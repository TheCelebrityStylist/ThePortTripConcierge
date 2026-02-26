"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AIAssistantPanel from "@/app/components/planner/AIAssistantPanel";
import CruiseSetupCard from "@/app/components/planner/CruiseSetupCard";
import DayNavigator from "@/app/components/planner/DayNavigator";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import UpgradeModal from "@/app/components/planner/UpgradeModal";
import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { buildCruiseDashboard, createPortDayFromPort, generatePortDayPlan, optimizePlan, simulateRisk } from "@/app/lib/planner/engine";
import { parseItineraryText } from "@/app/lib/planner/itineraryParser";
import type { Cruise, FeatureGateKey, FeatureTier, PlanBlock, PlanInput, PlanOutput, PortDay } from "@/app/lib/planner/types";

const DRAFT_KEY = "porttrip_workspace_draft_v1";
type DayError = { port?: string; times?: string };

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
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: 2,
  timezone: "Local",
  itinerary: [
    createPortDayFromPort("barcelona", new Date().toISOString().slice(0, 10)),
    createPortDayFromPort("marseille", new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
  ],
});

const validateDay = (day: PortDay): DayError => {
  const error: DayError = {};
  if (!day.portSlug) error.port = "Select a port.";
  if (!day.arrivalTime || !day.allAboardTime || day.arrivalTime >= day.allAboardTime) error.times = "Arrival must be before all aboard.";
  return error;
};

export default function ChatPage() {
  const searchParams = useSearchParams();
  const [tier, setTier] = useState<FeatureTier>("free");
  const [mode, setMode] = useState<"single-port" | "full-cruise">("full-cruise");
  const [mobileTab, setMobileTab] = useState<"days" | "plan" | "agent">("plan");
  const [assistantMode, setAssistantMode] = useState<"day" | "cruise">("day");
  const [showSetup, setShowSetup] = useState(true);
  const [pasteText, setPasteText] = useState("");
  const [input, setInput] = useState<PlanInput>(defaultInput);
  const [cruise, setCruise] = useState<Cruise>(createDefaultCruise);
  const [selectedDayId, setSelectedDayId] = useState<string>();
  const [plansByDayId, setPlansByDayId] = useState<Record<string, PlanOutput>>({});
  const [generation, setGeneration] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 });
  const [upgradeGate, setUpgradeGate] = useState<FeatureGateKey | null>(null);

  const entitlements = useMemo(() => getEntitlements(tier, searchParams.toString()), [tier, searchParams]);
  const selectedDay = cruise.itinerary.find((day) => day.id === selectedDayId) ?? cruise.itinerary[0];
  const output = selectedDay ? plansByDayId[selectedDay.id] : undefined;
  const dashboard = useMemo(() => buildCruiseDashboard(cruise, plansByDayId), [cruise, plansByDayId]);
  const dayErrors = useMemo(() => Object.fromEntries(cruise.itinerary.map((day) => [day.id, validateDay(day)])), [cruise.itinerary]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { cruise: Cruise; selectedDayId?: string; mode: "single-port" | "full-cruise" };
      setCruise(parsed.cruise);
      setSelectedDayId(parsed.selectedDayId);
      setMode(parsed.mode);
      setShowSetup(false);
    } catch {
      // ignore draft parse failures
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise, selectedDayId, mode }));
  }, [cruise, selectedDayId, mode]);

  useEffect(() => {
    if (!selectedDayId && cruise.itinerary[0]) setSelectedDayId(cruise.itinerary[0].id);
  }, [selectedDayId, cruise.itinerary]);

  useEffect(() => {
    if (!selectedDay?.date) return;
    const next = new URL(window.location.href);
    next.searchParams.set("mode", "cruise");
    next.searchParams.set("day", selectedDay.date);
    window.history.replaceState({}, "", next.toString());
  }, [selectedDay?.date]);

  const triggerGate = (feature: FeatureGateKey) => {
    if (hasFeature(entitlements, feature)) return false;
    setUpgradeGate(feature);
    return true;
  };

  const onAddDay = () => {
    const index = cruise.itinerary.length;
    const date = new Date(new Date(cruise.startDate).getTime() + index * 86400000).toISOString().slice(0, 10);
    const day = createPortDayFromPort("cozumel", date);
    setCruise((prev) => ({ ...prev, durationDays: index + 1, itinerary: [...prev.itinerary, day] }));
    setSelectedDayId(day.id);
  };

  const onGenerateDay = (day: PortDay) => {
    const invalid = validateDay(day);
    if (invalid.port || invalid.times) return;
    const planInput: PlanInput = {
      ...input,
      portSlug: day.portSlug,
      portName: day.portName,
      onboardTime: day.arrivalTime,
      allAboardTime: day.allAboardTime,
      walkingLevel: day.walkingPreference,
      pace: day.pace,
      interests: day.interests,
      riskTolerance: day.riskTolerance,
    };
    const out = generatePortDayPlan(planInput, day.portSlug);
    setPlansByDayId((prev) => ({ ...prev, [day.id]: out }));
  };

  const onGenerateAll = async () => {
    const validDays = cruise.itinerary.filter((day) => {
      const err = validateDay(day);
      return !err.port && !err.times;
    });
    setGeneration({ running: true, done: 0, total: validDays.length });
    for (let i = 0; i < validDays.length; i += 1) {
      onGenerateDay(validDays[i]);
      setGeneration({ running: true, done: i + 1, total: validDays.length });
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    setGeneration({ running: false, done: 0, total: 0 });
  };

  const applyRecommendation = (action: PlanOutput["recommendations"][number]["action"], scope: "day" | "cruise") => {
    if (scope === "cruise") {
      if (triggerGate("generateAll")) return;
      const next: Record<string, PlanOutput> = { ...plansByDayId };
      Object.entries(next).forEach(([id, plan]) => {
        const updated = optimizePlan(plan.plan, { action });
        next[id] = { ...plan, plan: updated, score: simulateRisk(updated, updated.input.portSlug) };
      });
      setPlansByDayId(next);
      return;
    }
    if (!selectedDay || !output) return;
    const updated = optimizePlan(output.plan, { action });
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: { ...output, plan: updated, score: simulateRisk(updated, updated.input.portSlug) } }));
  };

  const updateBlocks = (updater: (blocks: PlanBlock[]) => PlanBlock[]) => {
    if (!selectedDay || !output) return;
    const nextPlan = { ...output.plan, blocks: updater(output.plan.blocks) };
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: { ...output, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) } }));
  };

  const plannedCount = Object.keys(plansByDayId).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader
        hasPlan={!!output}
        onPrimary={() => (mode === "full-cruise" ? onGenerateAll() : selectedDay && onGenerateDay(selectedDay))}
        onAction={() => undefined}
      />

      <div className="mx-auto max-w-[1400px] px-3 py-4">
        <div className="mb-3 flex items-center gap-2 text-xs">
          <button onClick={() => setTier("free")} className={`rounded-full px-3 py-1 ${tier === "free" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Free</button>
          <button onClick={() => setTier("trip-pass")} className={`rounded-full px-3 py-1 ${tier === "trip-pass" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Trip Pass</button>
          <button onClick={() => setTier("pro")} className={`rounded-full px-3 py-1 ${tier === "pro" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Pro</button>
          <span className="ml-auto text-slate-300">{plannedCount}/{cruise.itinerary.length} port days planned</span>
        </div>

        <div className="mb-3 rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Workspace</p>
            <div className="flex gap-2">
              <button onClick={() => selectedDay && onGenerateDay(selectedDay)} className="rounded bg-slate-800 px-3 py-1 text-xs">Generate this day</button>
              <button onClick={onGenerateAll} className="rounded bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-900">Generate whole cruise</button>
            </div>
          </div>
          {generation.running && <p className="mt-2 text-xs text-cyan-200">Generating... {generation.done}/{generation.total}</p>}
          <p className="mt-1 text-xs text-slate-400">Plan radar · Energy {dashboard.energyPacingScore} · Savings €{dashboard.savingsEstimateTotal}</p>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[280px_minmax(0,1fr)_340px] lg:gap-4">
          <DayNavigator cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} onAddDay={onAddDay} />

          <section className="space-y-3">
            {output ? (
              <>
                <TimelineBoard
                  blocks={output.plan.blocks}
                  onEdit={(id, field, value) => updateBlocks((blocks) => blocks.map((block) => (block.id === id ? { ...block, [field]: value } : block)))}
                  onMove={(from, to) => updateBlocks((blocks) => {
                    if (to < 0 || to >= blocks.length) return blocks;
                    const next = [...blocks];
                    const [item] = next.splice(from, 1);
                    next.splice(to, 0, item);
                    return next;
                  })}
                />
                <PlanQualityPanel output={output} onApplyRecommendation={(action) => applyRecommendation(action, "day")} />
              </>
            ) : (
              <div className="rounded-xl border border-white/10 bg-slate-900/70 p-6 text-sm text-slate-300">Select a day and click Generate this day to open the planning timeline.</div>
            )}
          </section>

          <AIAssistantPanel cruise={cruise} selectedDay={selectedDay} selectedPlan={output} mode={assistantMode} onModeChange={setAssistantMode} onApplyAction={applyRecommendation} />
        </div>

        <div className="lg:hidden">
          <div className="mb-2 flex gap-2 text-xs">
            {(["days", "plan", "agent"] as const).map((tab) => (
              <button key={tab} onClick={() => setMobileTab(tab)} className={`rounded-full px-3 py-1 ${mobileTab === tab ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{tab}</button>
            ))}
          </div>
          {mobileTab === "days" && <DayNavigator cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} onAddDay={onAddDay} />}
          {mobileTab === "plan" && (
            <div className="space-y-3">
              {output ? <TimelineBoard blocks={output.plan.blocks} onEdit={(id, field, value) => updateBlocks((blocks) => blocks.map((block) => (block.id === id ? { ...block, [field]: value } : block)))} onMove={(from, to) => updateBlocks((blocks) => {
                if (to < 0 || to >= blocks.length) return blocks;
                const next = [...blocks];
                const [item] = next.splice(from, 1);
                next.splice(to, 0, item);
                return next;
              })} /> : <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm">Generate a day to start planning.</div>}
            </div>
          )}
          {mobileTab === "agent" && <AIAssistantPanel cruise={cruise} selectedDay={selectedDay} selectedPlan={output} mode={assistantMode} onModeChange={setAssistantMode} onApplyAction={applyRecommendation} />}
          <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 gap-2 border-t border-white/10 bg-slate-950/95 p-2">
            <button onClick={() => selectedDay && onGenerateDay(selectedDay)} className="rounded bg-cyan-400 py-2 text-xs font-semibold text-slate-900">Generate</button>
            <button onClick={() => setMobileTab("agent")} className="rounded bg-slate-800 py-2 text-xs">Chat</button>
            <button onClick={() => setMobileTab("days")} className="rounded bg-slate-800 py-2 text-xs">Days</button>
          </div>
          <div className="h-16" />
        </div>
      </div>

      {showSetup && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4">
          <div className="mx-auto max-w-4xl space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-4">
            <CruiseSetupCard
              cruise={cruise}
              mode={mode}
              selectedDayId={selectedDayId}
              dayErrors={dayErrors}
              onModeChange={setMode}
              onCruiseChange={(patch) => setCruise((prev) => ({ ...prev, ...patch }))}
              onDayChange={(id, patch) => setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((day) => (day.id === id ? { ...day, ...patch } : day)) }))}
              onAddDay={onAddDay}
              onRemoveDay={(id) => setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.filter((day) => day.id !== id) }))}
              onDuplicatePortToAll={(id) => {
                const source = cruise.itinerary.find((day) => day.id === id);
                if (!source) return;
                setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((day) => ({ ...day, portSlug: source.portSlug, portName: source.portName })) }));
              }}
              onAutoFillDay={(id) => setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((day) => (day.id === id ? { ...day, arrivalTime: day.arrivalTime || "08:00", allAboardTime: day.allAboardTime || "17:00" } : day)) }))}
              onSelectDay={setSelectedDayId}
            />
            <div className="rounded-xl border border-white/10 p-3">
              <p className="text-sm font-semibold">Paste itinerary</p>
              <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder="Feb 26 Marseille 08:00-18:00" className="mt-2 h-24 w-full rounded bg-slate-900 p-2 text-sm" />
              <div className="mt-2 flex justify-end gap-2">
                <button onClick={() => setShowSetup(false)} className="rounded bg-slate-800 px-3 py-2 text-xs">Continue to planning</button>
                <button
                  onClick={() => {
                    const parsed = parseItineraryText(pasteText);
                    if (!parsed.length) return;
                    setCruise((prev) => ({ ...prev, itinerary: parsed, durationDays: parsed.length }));
                    setSelectedDayId(parsed[0].id);
                  }}
                  className="rounded bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900"
                >
                  Parse itinerary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UpgradeModal open={!!upgradeGate} message={upgradeGate ? gateMessage(upgradeGate) : ""} onClose={() => setUpgradeGate(null)} />
    </main>
  );
}
