"use client";

import { useMemo, useState } from "react";
import { plannerPorts } from "@/app/data/ports";
import AgentChat from "@/app/components/planner/AgentChat";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import RunningLateModal from "@/app/components/planner/RunningLateModal";
import Tabs, { type Tab } from "@/app/components/planner/Tabs";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import TripBriefModal from "@/app/components/planner/TripBriefModal";
import { defaultBriefForPort } from "@/app/lib/planner/brief";
import { applyPlanPatch } from "@/app/lib/planner/patch";
import { computeMetrics } from "@/app/lib/planner/score";
import type { AgentSuggestion, Brief, PlanMeta, PlanStop, PlannerAgentResponse } from "@/app/lib/planner/types";

const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 9);

function generatePlan(meta: PlanMeta): PlanStop[] {
  const port = plannerPorts[meta.portSlug] ?? plannerPorts.barcelona;
  const start = toMin(meta.disembarkTime || "08:30");
  const end = toMin(meta.allAboardTime) - meta.returnBufferMin;
  const clusters = port.recommendedClusters.slice(0, 8);
  const stops: PlanStop[] = [];
  let cursor = start;

  stops.push({ id: uid(), title: "Transfer from terminal", category: "transit", startTime: toTime(cursor), endTime: toTime(cursor + port.typicalTransferToCityMin), durationMin: port.typicalTransferToCityMin, costEUR: 12, walkMin: 5, crowdRisk: "medium" });
  cursor += port.typicalTransferToCityMin;

  for (const cluster of clusters) {
    if (cursor + cluster.minutes + 20 > end || stops.length >= 8) break;
    stops.push({
      id: uid(),
      title: cluster.name,
      category: cluster.name.toLowerCase().includes("market") ? "market" : cluster.name.toLowerCase().includes("water") ? "scenic" : "history",
      startTime: toTime(cursor),
      endTime: toTime(cursor + cluster.minutes),
      durationMin: cluster.minutes,
      costEUR: Math.max(0, Math.round(cluster.minutes / 5)),
      walkMin: cluster.walkingIntensity === "high" ? 35 : cluster.walkingIntensity === "moderate" ? 20 : 10,
      crowdRisk: cluster.walkingIntensity === "high" ? "high" : "medium",
    });
    cursor += cluster.minutes;
  }

  stops.push({ id: uid(), title: "Return buffer + port transfer", category: "buffer", startTime: toTime(cursor), endTime: toTime(Math.max(end, cursor + 20)), durationMin: Math.max(20, end - cursor), costEUR: 8, walkMin: 5, crowdRisk: "low", lockInclusion: true });
  return stops;
}

function mergeLockedStops(previous: PlanStop[], regenerated: PlanStop[]) {
  const locked = previous.filter((stop) => stop.lockInclusion || stop.lockTime);
  let next = [...regenerated];
  locked.forEach((lockedStop) => {
    const match = next.findIndex((s) => s.title === lockedStop.title);
    if (match >= 0) next[match] = { ...next[match], ...lockedStop };
    else next.splice(Math.max(1, next.length - 1), 0, lockedStop);
  });
  return next;
}

const defaults = defaultBriefForPort("barcelona");

export default function ChatPage() {
  const [tab, setTab] = useState<Tab>("timeline");
  const [showBrief, setShowBrief] = useState(true);
  const [showLate, setShowLate] = useState(false);
  const [meta, setMeta] = useState<PlanMeta>(defaults.meta);
  const [brief, setBrief] = useState<Brief>(defaults.brief);
  const [variant, setVariant] = useState<"balanced" | "low-risk" | "max-experience">("balanced");
  const [stops, setStops] = useState<PlanStop[]>([]);
  const [assistantHash, setAssistantHash] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const metrics = useMemo(() => computeMetrics(stops, meta), [stops, meta]);

  const generateFromBrief = (selectedVariant: typeof variant) => {
    if (!meta.portSlug || !meta.allAboardTime) {
      setError("Please choose a port and all aboard time.");
      return;
    }

    const updatedMeta = { ...meta, generatedAt: new Date().toISOString() };
    if (selectedVariant === "low-risk") updatedMeta.returnBufferMin = Math.max(meta.returnBufferMin, 75);
    if (selectedVariant === "max-experience") updatedMeta.returnBufferMin = Math.min(meta.returnBufferMin, 45);

    const regenerated = generatePlan(updatedMeta);
    setStops((prev) => prev.length ? mergeLockedStops(prev, regenerated) : regenerated);
    setMeta(updatedMeta);
    setVariant(selectedVariant);
    setError("");
    setShowBrief(false);
    setTab("timeline");
    setToast("Plan generated. Your timeline is ready.");
    setTimeout(() => setToast(""), 2600);
  };

  const skipDefaults = () => {
    const next = defaultBriefForPort(meta.portSlug || "barcelona", meta.allAboardTime || "16:30", meta.riskTolerance);
    setMeta(next.meta);
    setBrief(next.brief);
    generateFromBrief("balanced");
  };

  const onToggle = (id: string, key: "lockTime" | "lockInclusion") => setStops((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: !s[key] } : s)));
  const onMove = (id: string, direction: "up" | "down") => setStops((prev) => {
    const idx = prev.findIndex((s) => s.id === id);
    const nextIdx = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || nextIdx < 0 || nextIdx >= prev.length) return prev;
    const clone = [...prev];
    const [item] = clone.splice(idx, 1);
    clone.splice(nextIdx, 0, item);
    return clone;
  });

  const applySuggestion = (s: AgentSuggestion) => {
    if (s.actionType === "add") {
      const payload = s.payload as Partial<PlanStop>;
      const after = stops[stops.length - 2];
      const start = after ? toMin(after.endTime) : toMin(meta.disembarkTime || "08:30");
      const duration = Number(payload.durationMin ?? 45);
      const next: PlanStop = {
        id: uid(),
        title: String(payload.title ?? s.title),
        category: (payload.category as PlanStop["category"]) ?? "food",
        startTime: toTime(start),
        endTime: toTime(start + duration),
        durationMin: duration,
        costEUR: Number(payload.costEUR ?? 20),
        walkMin: Number(payload.walkMin ?? 10),
        crowdRisk: "medium",
      };
      setStops((prev) => [...prev.slice(0, -1), next, prev[prev.length - 1]].filter(Boolean));
    }
    if (s.actionType === "edit") {
      setStops((prev) => prev.map((stop) => stop.category === "transit" ? { ...stop, walkMin: Math.max(3, stop.walkMin - 8), costEUR: stop.costEUR + 6 } : stop));
    }
    if (s.actionType === "swap") {
      setStops((prev) => prev.map((stop) => stop.crowdRisk === "high" ? { ...stop, title: `${stop.title} (nearby calmer option)`, crowdRisk: "medium" } : stop));
    }
  };

  const applyRunningLate = (mode: "safe" | "salvage", delayMin: number) => {
    setStops((prev) => prev.filter((_, idx) => mode === "safe" ? idx !== 2 : idx !== 3).map((s) => ({ ...s, durationMin: Math.max(20, s.durationMin - Math.floor(delayMin / 4)) })));
    setShowLate(false);
  };

  const onReply = (response: PlannerAgentResponse) => {
    const hash = response.assistantMessage.slice(0, 120);
    if (assistantHash.includes(hash)) return;
    setAssistantHash((prev) => [hash, ...prev].slice(0, 5));
    if (response.planPatch) setStops((prev) => applyPlanPatch(prev, response.planPatch));
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader hasPlan={stops.length > 0} onPrimary={() => (stops.length ? generateFromBrief(variant) : setShowBrief(true))} onAction={(key) => {
        if (key === "simulate") setShowLate(true);
        if (key === "brief") setShowBrief(true);
      }} />

      <TripBriefModal open={showBrief} hasPlan={stops.length > 0} meta={meta} brief={brief} error={error} onClose={() => setShowBrief(false)} onSkip={skipDefaults} setMeta={setMeta} setBrief={setBrief} onGenerate={() => generateFromBrief(variant)} />
      <RunningLateModal open={showLate} onClose={() => setShowLate(false)} onApply={applyRunningLate} />

      {toast && <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">{toast}</div>}

      <div className="mx-auto max-w-6xl px-2 pb-20 sm:px-4">
        <Tabs active={tab} setActive={setTab} />
        <div className="mt-3 flex flex-wrap gap-2">
          {(["balanced", "low-risk", "max-experience"] as const).map((option) => (
            <button key={option} onClick={() => generateFromBrief(option)} className={`rounded-full px-3 py-1 text-xs ${variant === option ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{option}</button>
          ))}
          <button className="rounded-full bg-slate-800 px-3 py-1 text-xs" onClick={() => setShowBrief(true)}>Brief</button>
          <button className="rounded-full bg-amber-500/90 px-3 py-1 text-xs text-slate-900" onClick={() => setShowLate(true)}>I&apos;m running late</button>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_300px]">
          <section className="min-w-0">
            {tab === "timeline" && <TimelineBoard stops={stops} onToggle={onToggle} onAsk={() => setTab("chat")} onMove={onMove} />}
            {tab === "chat" && <AgentChat requestPayload={(message) => ({ portSlug: meta.portSlug, brief, currentPlan: stops, userMessage: message, mode: variant })} onApplySuggestion={applySuggestion} onReply={onReply} />}
            {tab === "map" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-slate-300">Route preview: {stops.map((s) => s.title).join(" → ")}</div>}
            {tab === "budget" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Per-stop budget total €{metrics.totalCost}. Compare against ship excursion in overflow actions.</div>}
            {tab === "risk" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Risk contributors: farthest {metrics.farthestDistanceEstimate}km, transfers {metrics.transfersCount}, tender {meta.tenderDock}, peak overlap {metrics.riskFlags.includes("Peak traffic overlap") ? "yes" : "no"}, buffer {metrics.bufferMinutesRemaining}m.</div>}
          </section>
          <div className="min-w-0">
            <PlanQualityPanel metrics={metrics} />
          </div>
        </div>
      </div>
    </main>
  );
}
