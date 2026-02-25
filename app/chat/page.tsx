"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AgentChat from "@/app/components/planner/AgentChat";
import ConciergeBrief from "@/app/components/planner/ConciergeBrief";
import CruiseBuilder from "@/app/components/planner/CruiseBuilder";
import CruiseDashboard from "@/app/components/planner/CruiseDashboard";
import PlanBuilder from "@/app/components/planner/PlanBuilder";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import SimulationDrawer from "@/app/components/planner/SimulationDrawer";
import Tabs, { type Tab } from "@/app/components/planner/Tabs";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import UpgradeModal from "@/app/components/planner/UpgradeModal";
import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { buildAgentResponse, buildCruiseDashboard, createPortDayFromPort, generatePortDayPlan, optimizePlan, simulateRisk } from "@/app/lib/planner/engine";
import type { Cruise, FeatureGateKey, FeatureTier, PlanBlock, PlanInput, PlanOutput, PortDay } from "@/app/lib/planner/types";

const DRAFT_KEY = "porttrip_cruise_draft_v1";

const defaultInput: PlanInput = {
  portSlug: "barcelona",
  onboardTime: "08:30",
  allAboardTime: "16:30",
  mustReturnBufferMin: 60,
  walkingLevel: "moderate",
  pace: "normal",
  mode: "balanced",
  interests: ["food", "culture", "views"],
  budgetSensitivity: "medium",
  mustDoStops: [],
  riskTolerance: "balanced",
  avoidCrowds: false,
};

const createDefaultCruise = (): Cruise => ({
  id: "cruise-local",
  cruiseName: "My Cruise",
  cruiseLine: "",
  ship: "",
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: 7,
  timezone: "Local",
  itinerary: [
    createPortDayFromPort("barcelona", new Date().toISOString().slice(0, 10)),
    createPortDayFromPort("marseille", new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
  ],
});

const isDayValid = (day: PortDay) => !!day.portSlug && day.arrivalTime < day.allAboardTime;

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("timeline");
  const [tier, setTier] = useState<FeatureTier>("free");
  const [mode, setMode] = useState<"single-port" | "full-cruise">("full-cruise");
  const [input, setInput] = useState<PlanInput>(defaultInput);
  const [output, setOutput] = useState<PlanOutput | null>(null);
  const [cruise, setCruise] = useState<Cruise>(createDefaultCruise);
  const [selectedDayId, setSelectedDayId] = useState<string | undefined>(undefined);
  const [plansByDayId, setPlansByDayId] = useState<Record<string, PlanOutput>>({});
  const [toast, setToast] = useState("");
  const [simOpen, setSimOpen] = useState(false);
  const [upgradeGate, setUpgradeGate] = useState<FeatureGateKey | null>(null);

  const entitlements = useMemo(() => getEntitlements(tier, searchParams.toString()), [tier, searchParams]);
  const dashboard = useMemo(() => buildCruiseDashboard(cruise, plansByDayId), [cruise, plansByDayId]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { cruise: Cruise; selectedDayId?: string; mode: "single-port" | "full-cruise" };
      setCruise(parsed.cruise);
      setSelectedDayId(parsed.selectedDayId);
      setMode(parsed.mode);
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise, selectedDayId, mode }));
    }, 300);
    return () => clearTimeout(id);
  }, [cruise, selectedDayId, mode]);

  useEffect(() => {
    if (!selectedDayId && cruise.itinerary[0]) setSelectedDayId(cruise.itinerary[0].id);
  }, [cruise.itinerary, selectedDayId]);

  const triggerGate = (gate: FeatureGateKey) => {
    if (hasFeature(entitlements, gate)) return false;
    setUpgradeGate(gate);
    return true;
  };

  const selectedDay = cruise.itinerary.find((day) => day.id === selectedDayId) ?? cruise.itinerary[0];

  const generateSelectedDay = () => {
    if (!selectedDay || !isDayValid(selectedDay)) {
      setToast("Please fix selected day (port + times). ");
      return;
    }
    const planInput: PlanInput = {
      ...input,
      portSlug: selectedDay.portSlug,
      onboardTime: selectedDay.onboardTime,
      allAboardTime: selectedDay.allAboardTime,
      walkingLevel: selectedDay.walkingPreference,
      pace: selectedDay.pace,
      interests: selectedDay.interests,
      riskTolerance: selectedDay.riskTolerance,
    };
    const next = generatePortDayPlan(planInput, selectedDay.portSlug);
    setOutput(next);
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: next }));
    setCruise({ ...cruise, itinerary: cruise.itinerary.map((day) => (day.id === selectedDay.id ? { ...day, status: "draft", score: next.score.totalScore } : day)) });
    setTab("timeline");
    setToast(`Generated ${selectedDay.portSlug} day plan.`);
    setTimeout(() => setToast(""), 1400);
  };

  const generateAll = () => {
    if (triggerGate("generateAll")) return;
    const next: Record<string, PlanOutput> = {};
    cruise.itinerary.forEach((day) => {
      if (!isDayValid(day)) return;
      const planInput: PlanInput = {
        ...input,
        portSlug: day.portSlug,
        onboardTime: day.onboardTime,
        allAboardTime: day.allAboardTime,
        walkingLevel: day.walkingPreference,
        pace: day.pace,
        interests: day.interests,
        riskTolerance: day.riskTolerance,
      };
      next[day.id] = generatePortDayPlan(planInput, day.portSlug);
    });
    setPlansByDayId(next);
    setCruise({ ...cruise, itinerary: cruise.itinerary.map((day) => ({ ...day, status: next[day.id] ? "optimized" : day.status, score: next[day.id]?.score.totalScore })) });
    setToast("Generated all valid days.");
    setTimeout(() => setToast(""), 1600);
  };

  const optimizeCruiseFlow = () => {
    if (triggerGate("generateAll")) return;
    const intense = cruise.itinerary.filter((day) => day.pace === "intense");
    if (intense.length > 2) {
      setCruise({ ...cruise, itinerary: cruise.itinerary.map((day, index) => (index % 3 === 2 ? { ...day, pace: "chill" } : day)) });
      setToast("Energy pacing adjusted.");
      setTimeout(() => setToast(""), 1500);
    }
  };

  const addDay = () => {
    const index = cruise.itinerary.length;
    const nextDate = new Date(new Date(cruise.startDate).getTime() + index * 86400000).toISOString().slice(0, 10);
    const day = createPortDayFromPort("cozumel", nextDate);
    setCruise({ ...cruise, itinerary: [...cruise.itinerary, day] });
    setSelectedDayId(day.id);
  };

  const removeDay = (id: string) => {
    const remaining = cruise.itinerary.filter((day) => day.id !== id);
    setCruise({ ...cruise, itinerary: remaining });
    setPlansByDayId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedDayId === id) setSelectedDayId(remaining[0]?.id);
  };

  const updateBlocks = (updater: (blocks: PlanBlock[]) => PlanBlock[]) => {
    if (!output) return;
    const nextPlan = { ...output.plan, blocks: updater(output.plan.blocks) };
    const nextScore = simulateRisk(nextPlan, nextPlan.input.portSlug);
    setOutput({ ...output, plan: nextPlan, score: nextScore });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader
        hasPlan={!!output}
        onPrimary={generateSelectedDay}
        onAction={(action) => {
          if (action === "simulate") {
            if (!triggerGate("simulation")) setSimOpen(true);
            return;
          }
          if (action === "export") {
            if (triggerGate("exportBundle")) return;
          }
          setToast(`${action} queued`);
          setTimeout(() => setToast(""), 1200);
        }}
      />

      <div className="mx-auto max-w-6xl px-2 pb-24 pt-3 sm:px-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button onClick={() => setTier("free")} className={`rounded-full px-3 py-1 text-xs ${tier === "free" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Free</button>
          <button onClick={() => setTier("trip-pass")} className={`rounded-full px-3 py-1 text-xs ${tier === "trip-pass" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Trip Pass</button>
          <button onClick={() => setTier("pro")} className={`rounded-full px-3 py-1 text-xs ${tier === "pro" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Pro</button>
          {entitlements.bypassEnabled && <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[11px] text-emerald-200">Pro bypass enabled</span>}
          <button onClick={() => {
            if (!confirm("Reset cruise draft?")) return;
            localStorage.removeItem(DRAFT_KEY);
            setCruise(createDefaultCruise());
            setSelectedDayId(undefined);
            setPlansByDayId({});
            setOutput(null);
          }} className="ml-auto rounded bg-slate-800 px-3 py-1 text-xs">Reset draft</button>
        </div>

        <CruiseBuilder
          cruise={cruise}
          setCruise={setCruise}
          mode={mode}
          setMode={setMode}
          selectedDayId={selectedDayId}
          setSelectedDayId={setSelectedDayId}
          onAddDay={addDay}
          onRemoveDay={removeDay}
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4 min-w-0">
            <CruiseDashboard cruise={cruise} dashboard={dashboard} plansByDayId={plansByDayId} onGenerateAll={generateAll} onOptimizeFlow={optimizeCruiseFlow} />
            {mode === "single-port" && <PlanBuilder input={input} setInput={setInput} onGenerate={generateSelectedDay} />}
            {toast && <div className="rounded bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">{toast}</div>}
          </section>
          <section className="space-y-3 min-w-0">
            <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
              <p className="font-semibold">Free vs Premium</p>
              <ul className="mt-2 list-disc pl-5 text-xs text-slate-300">
                <li>Free: create/edit cruise and generate selected day</li>
                <li>Trip Pass/Pro: generate all + optimize cruise + exports</li>
                <li>Pro: simulations + offline pack</li>
              </ul>
            </div>
          </section>
        </div>

        {output && (
          <>
            <Tabs active={tab} setActive={setTab} />
            <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
              <section className="space-y-4 min-w-0">
                {tab === "timeline" && <TimelineBoard blocks={output.plan.blocks} onEdit={(id, field, value) => updateBlocks((blocks) => blocks.map((block) => (block.id === id ? { ...block, [field]: value } : block)))} onMove={(from, to) => updateBlocks((blocks) => {
                  if (to < 0 || to >= blocks.length) return blocks;
                  const next = [...blocks];
                  const [item] = next.splice(from, 1);
                  next.splice(to, 0, item);
                  return next;
                })} />}
                {tab === "map" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Route: {output.plan.blocks.map((block) => block.title).join(" → ")}</div>}
                {tab === "budget" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Estimated day spend: €{output.plan.blocks.reduce((sum, block) => sum + block.costEUR, 0)}.</div>}
                {tab === "risk" && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">{output.score.violations.length ? output.score.violations.join(" ") : "No critical return-safe violations."}</div>}
                {tab === "chat" && <AgentChat onAsk={(question) => buildAgentResponse(output, question)} />}
                <ConciergeBrief output={output} />
              </section>
              <section className="space-y-3 min-w-0">
                <PlanQualityPanel output={output} onApplyRecommendation={(action) => {
                  const optimized = optimizePlan(output.plan, { action });
                  setOutput({ ...output, plan: optimized, score: simulateRisk(optimized, optimized.input.portSlug) });
                }} />
              </section>
            </div>
          </>
        )}
      </div>

      <SimulationDrawer
        open={simOpen}
        onClose={() => setSimOpen(false)}
        onRun={(scenario) => {
          if (!output) return;
          const action = scenario === "museum" ? "move-lunch-earlier" : scenario === "tender" ? "balanced-loop" : "trim-far-stop";
          const optimized = optimizePlan(output.plan, { action });
          setOutput({ ...output, plan: optimized, score: simulateRisk(optimized, optimized.input.portSlug) });
          setSimOpen(false);
          setToast(`Simulation applied: ${scenario}`);
          setTimeout(() => setToast(""), 1700);
        }}
      />

      <UpgradeModal open={!!upgradeGate} message={upgradeGate ? gateMessage(upgradeGate) : ""} onClose={() => setUpgradeGate(null)} />
    </main>
  );
}
