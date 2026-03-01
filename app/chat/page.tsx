"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AIAssistantPanel from "@/app/components/planner/AIAssistantPanel";
import DayHeader from "@/app/components/planner/DayHeader";
import DayNavigator from "@/app/components/planner/DayNavigator";
import PlanSetupStrip from "@/app/components/planner/PlanSetupStrip";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import PrimaryActionButton from "@/app/components/planner/PrimaryActionButton";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import UpgradeModal from "@/app/components/planner/UpgradeModal";
import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { buildCruiseDashboard, createPortDayFromPort, generatePortDayPlan, optimizePlan, simulateRisk } from "@/app/lib/planner/engine";
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
  durationDays: 0,
  timezone: "Local",
  itinerary: [],
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
  const [assistantMode, setAssistantMode] = useState<"day" | "cruise">("day");
  const [input] = useState<PlanInput>(defaultInput);
  const [cruise, setCruise] = useState<Cruise>(createDefaultCruise);
  const [selectedDayId, setSelectedDayId] = useState<string>();
  const [plansByDayId, setPlansByDayId] = useState<Record<string, PlanOutput>>({});
  const [generation, setGeneration] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 });
  const [upgradeGate, setUpgradeGate] = useState<FeatureGateKey | null>(null);
  const [toast, setToast] = useState("");
  const [mobileDaysOpen, setMobileDaysOpen] = useState(false);
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);
  const [timelinePulse, setTimelinePulse] = useState(false);
  const [pendingDayScrollId, setPendingDayScrollId] = useState<string | null>(null);

  const entitlements = useMemo(() => getEntitlements(tier, searchParams.toString()), [tier, searchParams]);
  const selectedDay = cruise.itinerary.find((day) => day.id === selectedDayId);
  const output = selectedDay ? plansByDayId[selectedDay.id] : undefined;
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
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise, selectedDayId, mode }));
  }, [cruise, selectedDayId, mode]);

  useEffect(() => {
    if (selectedDayId) return;
    const firstUnplanned = cruise.itinerary.find((day) => !plansByDayId[day.id]);
    setSelectedDayId(firstUnplanned?.id ?? cruise.itinerary[0]?.id);
  }, [selectedDayId, cruise.itinerary, plansByDayId]);

  useEffect(() => {
    if (!pendingDayScrollId) return;
    const node = document.querySelector(`[data-day-id=\"${pendingDayScrollId}\"]`);
    if (node instanceof HTMLElement) node.scrollIntoView({ behavior: "smooth", block: "nearest" });
    setPendingDayScrollId(null);
  }, [pendingDayScrollId]);

  const triggerGate = (feature: FeatureGateKey) => {
    if (hasFeature(entitlements, feature)) return false;
    setUpgradeGate(feature);
    return true;
  };

  const quickAddDay = (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => {
    const index = cruise.itinerary.length;
    const date = new Date(new Date(cruise.startDate).getTime() + index * 86400000).toISOString().slice(0, 10);
    const day = {
      ...createPortDayFromPort(payload.portSlug, date),
      portName: payload.portName,
      arrivalTime: payload.arrivalTime,
      onboardTime: payload.arrivalTime,
      allAboardTime: payload.allAboardTime,
    };
    setCruise((prev) => ({ ...prev, durationDays: index + 1, itinerary: [...prev.itinerary, day] }));
    setSelectedDayId(day.id);
    setPendingDayScrollId(day.id);
    setToast(`Added ${payload.portName} to Day ${index + 1}.`);
    setTimeout(() => setToast(""), 1300);
  };

  const onGenerateDay = (day: PortDay) => {
    const invalid = validateDay(day);
    if (invalid.port || invalid.times) {
      setToast(invalid.port || invalid.times || "Please check day setup.");
      setTimeout(() => setToast(""), 1200);
      return;
    }

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
    window.setTimeout(() => {
      const firstItem = document.querySelector("[data-timeline-item='0']");
      if (firstItem instanceof HTMLElement) firstItem.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    setTimelinePulse(true);
    window.setTimeout(() => setTimelinePulse(false), 1000);
  };

  const onGenerateAll = async () => {
    if (triggerGate("generateAll")) return;
    const validDays = cruise.itinerary.filter((day) => {
      const err = validateDay(day);
      return !err.port && !err.times;
    });
    setGeneration({ running: true, done: 0, total: validDays.length });
    for (let i = 0; i < validDays.length; i += 1) {
      onGenerateDay(validDays[i]);
      setGeneration({ running: true, done: i + 1, total: validDays.length });
      await new Promise((resolve) => setTimeout(resolve, 45));
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

  const hasDays = cruise.itinerary.length > 0;
  const hasAnyPlan = Object.keys(plansByDayId).length > 0;
  const selectedDayPlanned = !!(selectedDay && plansByDayId[selectedDay.id]);

  const primaryAction = () => {
    if (!hasDays) return;
    if (selectedDay) onGenerateDay(selectedDay);
  };

  const primaryLabel = !hasDays
    ? "Add your first day"
    : selectedDayPlanned
    ? `Update plan for ${selectedDay?.portName || selectedDay?.portSlug}`
    : `Generate plan for ${selectedDay?.portName || selectedDay?.portSlug}`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader hasPlan={!!output} onPrimary={() => undefined} onAction={() => undefined} />

      <div className="mx-auto max-w-[1500px] px-3 py-4 sm:px-4">
        <div className="mb-4 flex items-center gap-2 text-xs">
          <button onClick={() => setTier("free")} className={`rounded-full px-3 py-1 ${tier === "free" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Free</button>
          <button onClick={() => setTier("trip-pass")} className={`rounded-full px-3 py-1 ${tier === "trip-pass" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Trip Pass</button>
          <button onClick={() => setTier("pro")} className={`rounded-full px-3 py-1 ${tier === "pro" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Pro</button>
          <span className="ml-auto text-slate-400">{Object.keys(plansByDayId).length}/{cruise.itinerary.length} planned · Energy {dashboard.energyPacingScore}</span>
        </div>

        <div className="hidden lg:grid lg:grid-cols-[25%_50%_25%] lg:gap-5">
          <DayNavigator cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} onQuickAdd={quickAddDay} />

          <section className="space-y-4">
            {!hasDays ? (
              <PlanSetupStrip mode={mode} daysCount={cruise.itinerary.length} onModeChange={setMode} onQuickAdd={quickAddDay} onGenerateFirst={() => selectedDay && onGenerateDay(selectedDay)} onGenerateWhole={onGenerateAll} />
            ) : (
              <div className="rounded-2xl bg-slate-900/70 p-4">
                <p className="text-xs uppercase tracking-[0.14em] text-cyan-200/80">Next best action</p>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-300">
                    {selectedDayPlanned ? "Fine-tune this plan or update it after edits." : "Generate this day to unlock timeline editing and co-pilot refinements."}
                  </p>
                  <PrimaryActionButton label={primaryLabel} onClick={primaryAction} disabled={!selectedDay} />
                </div>
                {generation.running && <p className="mt-2 text-xs text-cyan-200">Generating {generation.done}/{generation.total} days...</p>}
                {toast && <p className="mt-2 text-xs text-emerald-200">{toast}</p>}
              </div>
            )}

            <DayHeader day={selectedDay} plan={output} />

            {!hasAnyPlan ? (
              <div className="rounded-2xl bg-slate-900/70 p-6 text-sm text-slate-300">
                <p className="font-semibold">Step 1: Add your first port day</p>
                <p className="mt-1">Step 2: Generate a plan</p>
                <p className="mt-1">Step 3: Refine with your co-pilot</p>
              </div>
            ) : output ? (
              <div className={timelinePulse ? "rounded-2xl ring-1 ring-cyan-300/50" : ""}>
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
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900/70 p-6 text-sm text-slate-300">Select an unplanned day to generate next.</div>
            )}
          </section>

          <section>
            {hasAnyPlan ? (
              <AIAssistantPanel cruise={cruise} selectedDay={selectedDay} selectedPlan={output} mode={assistantMode} onModeChange={setAssistantMode} onApplyAction={applyRecommendation} />
            ) : (
              <div className="rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">I’ll generate your first plan once you add a day.</div>
            )}
          </section>
        </div>

        <div className="space-y-3 lg:hidden">
          <DayHeader day={selectedDay} plan={output} />
          {!hasAnyPlan ? (
            <PlanSetupStrip mode={mode} daysCount={cruise.itinerary.length} onModeChange={setMode} onQuickAdd={quickAddDay} onGenerateFirst={() => selectedDay && onGenerateDay(selectedDay)} onGenerateWhole={onGenerateAll} />
          ) : output ? (
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
          ) : (
            <div className="rounded-2xl bg-slate-900/70 p-6 text-sm text-slate-300">Select a day and generate when ready.</div>
          )}

          {mobileDaysOpen && (
            <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileDaysOpen(false)}>
              <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm bg-slate-950 p-3" onClick={(e) => e.stopPropagation()}>
                <DayNavigator cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={(id) => {
                  setSelectedDayId(id);
                  setMobileDaysOpen(false);
                }} onQuickAdd={quickAddDay} />
              </div>
            </div>
          )}

          {mobileCopilotOpen && (
            <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setMobileCopilotOpen(false)}>
              <div className="absolute inset-y-0 right-0 w-[92%] max-w-md bg-slate-950 p-3" onClick={(e) => e.stopPropagation()}>
                {hasAnyPlan ? (
                  <AIAssistantPanel cruise={cruise} selectedDay={selectedDay} selectedPlan={output} mode={assistantMode} onModeChange={setAssistantMode} onApplyAction={applyRecommendation} />
                ) : (
                  <div className="rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">I’ll generate your first plan once you add a day.</div>
                )}
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 z-40 grid grid-cols-3 gap-2 border-t border-white/10 bg-slate-950/95 p-2">
            <PrimaryActionButton label={hasDays ? (selectedDayPlanned ? "Update" : "Generate") : "Add day"} onClick={hasDays ? primaryAction : () => setMobileDaysOpen(true)} />
            <button onClick={() => setMobileDaysOpen(true)} className="rounded-xl bg-slate-800 py-2 text-xs">Days</button>
            <button onClick={() => setMobileCopilotOpen(true)} className="rounded-xl bg-slate-800 py-2 text-xs">Co-Pilot</button>
          </div>
          <div className="h-16" />
        </div>
      </div>

      <UpgradeModal open={!!upgradeGate} message={upgradeGate ? gateMessage(upgradeGate) : ""} onClose={() => setUpgradeGate(null)} />
    </main>
  );
}
