"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AIAssistantPanel from "@/app/components/planner/AIAssistantPanel";
import CruiseOverview from "@/app/components/planner/CruiseOverview";
import CruiseSetupCard from "@/app/components/planner/CruiseSetupCard";
import MobilePlannerShell from "@/app/components/planner/MobilePlannerShell";
import PlannerHeader from "@/app/components/planner/PlannerHeader";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import SimulationDrawer from "@/app/components/planner/SimulationDrawer";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import UpgradeModal from "@/app/components/planner/UpgradeModal";
import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { buildCruiseDashboard, createPortDayFromPort, generatePortDayPlan, optimizePlan, simulateRisk } from "@/app/lib/planner/engine";
import type { Cruise, FeatureGateKey, FeatureTier, PlanBlock, PlanInput, PlanOutput, PortDay } from "@/app/lib/planner/types";

const DRAFT_KEY = "porttrip_cruise_draft_v2";

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

const addDays = (startDate: string, count: number) =>
  Array.from({ length: count }, (_, idx) => {
    const date = new Date(new Date(startDate).getTime() + idx * 86400000).toISOString().slice(0, 10);
    return createPortDayFromPort(idx % 2 === 0 ? "barcelona" : "marseille", date);
  });

const createDefaultCruise = (): Cruise => ({
  id: "cruise-local",
  cruiseName: "Mediterranean Sprint",
  cruiseLine: "",
  ship: "",
  startDate: new Date().toISOString().slice(0, 10),
  durationDays: 5,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Local",
  itinerary: addDays(new Date().toISOString().slice(0, 10), 5),
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
  const [detailTab, setDetailTab] = useState<"timeline" | "map" | "risk" | "budget">("timeline");
  const [mobileTab, setMobileTab] = useState<"plan" | "chat" | "risk" | "budget">("plan");
  const [assistantMode, setAssistantMode] = useState<"day" | "cruise">("day");
  const [input, setInput] = useState<PlanInput>(defaultInput);
  const [cruise, setCruise] = useState<Cruise>(createDefaultCruise);
  const [selectedDayId, setSelectedDayId] = useState<string>();
  const [plansByDayId, setPlansByDayId] = useState<Record<string, PlanOutput>>({});
  const [generation, setGeneration] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 });
  const [toast, setToast] = useState("");
  const [simOpen, setSimOpen] = useState(false);
  const [upgradeGate, setUpgradeGate] = useState<FeatureGateKey | null>(null);

  const entitlements = useMemo(() => getEntitlements(tier, searchParams.toString()), [tier, searchParams]);
  const selectedDay = cruise.itinerary.find((day) => day.id === selectedDayId) ?? cruise.itinerary[0];
  const output = selectedDay ? plansByDayId[selectedDay.id] ?? null : null;
  const dashboard = useMemo(() => buildCruiseDashboard(cruise, plansByDayId), [cruise, plansByDayId]);
  const dayErrors = useMemo(() => Object.fromEntries(cruise.itinerary.map((day) => [day.id, validateDay(day)])), [cruise.itinerary]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { cruise: Cruise; mode: "single-port" | "full-cruise"; selectedDayId?: string };
      setCruise(parsed.cruise);
      setMode(parsed.mode);
      setSelectedDayId(parsed.selectedDayId);
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise, mode, selectedDayId }));
    }, 250);
    return () => clearTimeout(timer);
  }, [cruise, mode, selectedDayId]);

  useEffect(() => {
    if (!selectedDayId && cruise.itinerary[0]) setSelectedDayId(cruise.itinerary[0].id);
  }, [cruise.itinerary, selectedDayId]);

  const triggerGate = (gate: FeatureGateKey) => {
    if (hasFeature(entitlements, gate)) return false;
    setUpgradeGate(gate);
    return true;
  };

  const updateDay = (id: string, patch: Partial<PortDay>) => {
    setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((day) => (day.id === id ? { ...day, ...patch } : day)) }));
  };

  const onCruiseChange = (patch: Partial<Cruise>) => {
    setCruise((prev) => ({ ...prev, ...patch }));
  };

  const onAddDay = () => {
    setCruise((prev) => {
      const index = prev.itinerary.length;
      const date = new Date(new Date(prev.startDate).getTime() + index * 86400000).toISOString().slice(0, 10);
      const day = createPortDayFromPort("cozumel", date);
      setSelectedDayId(day.id);
      return { ...prev, durationDays: index + 1, itinerary: [...prev.itinerary, day] };
    });
  };

  const onRemoveDay = (id: string) => {
    setCruise((prev) => {
      const itinerary = prev.itinerary.filter((day) => day.id !== id);
      return { ...prev, durationDays: itinerary.length, itinerary };
    });
    setPlansByDayId((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedDayId === id) setSelectedDayId(cruise.itinerary.find((day) => day.id !== id)?.id);
  };

  const onDuplicatePortToAll = (id: string) => {
    const source = cruise.itinerary.find((day) => day.id === id);
    if (!source?.portSlug) return;
    setCruise((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day) => ({ ...day, portSlug: source.portSlug, portName: source.portName ?? day.portName })),
    }));
    setToast(`Applied ${source.portName ?? source.portSlug} across all days.`);
    setTimeout(() => setToast(""), 1500);
  };

  const onAutoFillDay = (id: string) => {
    const day = cruise.itinerary.find((item) => item.id === id);
    if (!day) return;
    const fallbackArrival = day.arrivalTime || "08:00";
    const fallbackAboard = day.allAboardTime && day.allAboardTime > fallbackArrival ? day.allAboardTime : "17:00";
    updateDay(id, { arrivalTime: fallbackArrival, onboardTime: fallbackArrival, allAboardTime: fallbackAboard });
  };

  const buildInputFromDay = (day: PortDay): PlanInput => ({
    ...input,
    portSlug: day.portSlug,
    portName: day.portName,
    onboardTime: day.arrivalTime,
    allAboardTime: day.allAboardTime,
    walkingLevel: day.walkingPreference,
    pace: day.pace,
    riskTolerance: day.riskTolerance,
    interests: day.interests,
  });

  const generateSelected = () => {
    if (!selectedDay) return;
    const errors = validateDay(selectedDay);
    if (errors.port || errors.times) {
      setToast(errors.port || errors.times || "Fix the day first.");
      return;
    }
    const next = generatePortDayPlan(buildInputFromDay(selectedDay), selectedDay.portSlug);
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: next }));
    setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((day) => (day.id === selectedDay.id ? { ...day, score: next.score.totalScore, status: "draft" } : day)) }));
    setToast(`Generated Day ${cruise.itinerary.findIndex((day) => day.id === selectedDay.id) + 1}.`);
    setTimeout(() => setToast(""), 1400);
  };

  const generateAll = async () => {
    if (triggerGate("generateAll")) return;
    const validDays = cruise.itinerary.filter((day) => {
      const errs = validateDay(day);
      return !errs.port && !errs.times;
    });
    setGeneration({ running: true, done: 0, total: validDays.length });
    const nextPlans: Record<string, PlanOutput> = { ...plansByDayId };

    for (let i = 0; i < validDays.length; i += 1) {
      const day = validDays[i];
      nextPlans[day.id] = generatePortDayPlan(buildInputFromDay(day), day.portSlug);
      setGeneration({ running: true, done: i + 1, total: validDays.length });
      // keeps progress visible
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    setPlansByDayId(nextPlans);
    setCruise((prev) => ({
      ...prev,
      itinerary: prev.itinerary.map((day) => (nextPlans[day.id] ? { ...day, status: "optimized", score: nextPlans[day.id].score.totalScore } : day)),
    }));
    setGeneration({ running: false, done: 0, total: 0 });
    setToast(`Generated ${validDays.length} day plans.`);
    setTimeout(() => setToast(""), 1800);
  };

  const applyAssistantAction = (action: PlanOutput["recommendations"][number]["action"], scope: "day" | "cruise") => {
    if (scope === "cruise") {
      if (triggerGate("generateAll")) return;
      const next: Record<string, PlanOutput> = { ...plansByDayId };
      Object.entries(next).forEach(([dayId, plan]) => {
        const updatedPlan = optimizePlan(plan.plan, { action });
        next[dayId] = { ...plan, plan: updatedPlan, score: simulateRisk(updatedPlan, updatedPlan.input.portSlug) };
      });
      setPlansByDayId(next);
      return;
    }

    if (!selectedDay || !output) return;
    const optimized = optimizePlan(output.plan, { action });
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: { ...output, plan: optimized, score: simulateRisk(optimized, optimized.input.portSlug) } }));
  };

  const updateBlocks = (updater: (blocks: PlanBlock[]) => PlanBlock[]) => {
    if (!selectedDay || !output) return;
    const nextPlan = { ...output.plan, blocks: updater(output.plan.blocks) };
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: { ...output, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) } }));
  };

  const content = (
    <>
      <div className="mx-auto max-w-7xl px-3 pb-24 pt-3 sm:px-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <button onClick={() => setTier("free")} className={`rounded-full px-3 py-1 ${tier === "free" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Free</button>
          <button onClick={() => setTier("trip-pass")} className={`rounded-full px-3 py-1 ${tier === "trip-pass" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Trip Pass</button>
          <button onClick={() => setTier("pro")} className={`rounded-full px-3 py-1 ${tier === "pro" ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>Pro</button>
          {process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_DEV_UNLOCK === "true" && (
            <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">DEV: Pro unlocked</span>
          )}
          {entitlements.bypassEnabled && <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-emerald-200">Bypass active</span>}
          <button
            onClick={() => {
              localStorage.removeItem(DRAFT_KEY);
              setCruise(createDefaultCruise());
              setPlansByDayId({});
              setSelectedDayId(undefined);
            }}
            className="ml-auto rounded bg-slate-800 px-3 py-1"
          >
            Reset draft
          </button>
        </div>

        <CruiseSetupCard
          cruise={cruise}
          mode={mode}
          selectedDayId={selectedDayId}
          dayErrors={dayErrors}
          onModeChange={setMode}
          onCruiseChange={onCruiseChange}
          onDayChange={updateDay}
          onAddDay={onAddDay}
          onRemoveDay={onRemoveDay}
          onDuplicatePortToAll={onDuplicatePortToAll}
          onAutoFillDay={onAutoFillDay}
          onSelectDay={setSelectedDayId}
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_350px]">
          <section className="space-y-4">
            <div className="sticky top-28 z-20 rounded-xl border border-white/10 bg-slate-900/90 p-3 backdrop-blur">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">Plan radar</p>
                  <p className="text-xs text-slate-400">Energy {dashboard.energyPacingScore} · Savings €{dashboard.savingsEstimateTotal}</p>
                </div>
                <button onClick={() => (mode === "full-cruise" ? generateAll() : generateSelected())} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">
                  {Object.keys(plansByDayId).length ? "Update plan" : "Generate plan"}
                </button>
              </div>
              {generation.running && <p className="mt-2 text-xs text-cyan-200">Generating full cruise... {generation.done}/{generation.total}</p>}
              {toast && <p className="mt-2 rounded bg-cyan-400 px-2 py-1 text-xs font-semibold text-slate-900">{toast}</p>}
            </div>

            <CruiseOverview cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} />

            {output && (
              <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="mb-3 flex gap-2 text-xs">
                  {(["timeline", "map", "risk", "budget"] as const).map((tab) => (
                    <button key={tab} onClick={() => setDetailTab(tab)} className={`rounded-full px-3 py-1 ${detailTab === tab ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{tab}</button>
                  ))}
                </div>
                {detailTab === "timeline" && (
                  <TimelineBoard
                    blocks={output.plan.blocks}
                    onEdit={(id, field, value) => updateBlocks((blocks) => blocks.map((block) => (block.id === id ? { ...block, [field]: value } : block)))}
                    onMove={(from, to) =>
                      updateBlocks((blocks) => {
                        if (to < 0 || to >= blocks.length) return blocks;
                        const next = [...blocks];
                        const [item] = next.splice(from, 1);
                        next.splice(to, 0, item);
                        return next;
                      })
                    }
                  />
                )}
                {detailTab === "map" && <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm">Route: {output.plan.blocks.map((block) => block.title).join(" → ")}</div>}
                {detailTab === "risk" && <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm">{output.score.violations.join(" ") || "No critical return-safe issues."}</div>}
                {detailTab === "budget" && <div className="rounded-lg border border-white/10 bg-slate-950/60 p-3 text-sm">Estimated spend: €{output.plan.blocks.reduce((sum, block) => sum + block.costEUR, 0)}</div>}
              </section>
            )}

            {output && (
              <div className="relative">
                <PlanQualityPanel output={output} onApplyRecommendation={(action) => applyAssistantAction(action, "day")} />
                {!hasFeature(entitlements, "exportBundle") && (
                  <div className="pointer-events-none absolute inset-0 rounded-xl bg-slate-900/45 backdrop-blur-[2px]">
                    <div className="absolute inset-x-3 top-3 rounded bg-slate-950/90 p-2 text-xs text-slate-200">Preview mode: upgrade to unlock edits/export for premium outputs.</div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="hidden lg:block">
            <div className="sticky top-28 h-[calc(100vh-8rem)]">
              <AIAssistantPanel
                cruise={cruise}
                selectedDay={selectedDay}
                selectedPlan={output ?? undefined}
                mode={assistantMode}
                onModeChange={setAssistantMode}
                onApplyAction={applyAssistantAction}
              />
            </div>
          </section>
        </div>
      </div>

      <MobilePlannerShell active={mobileTab} onChange={setMobileTab}>
        <div className="mx-3 space-y-3 lg:hidden">
          {mobileTab === "chat" && (
            <AIAssistantPanel
              cruise={cruise}
              selectedDay={selectedDay}
              selectedPlan={output ?? undefined}
              mode={assistantMode}
              onModeChange={setAssistantMode}
              onApplyAction={applyAssistantAction}
            />
          )}
          {mobileTab === "risk" && output && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">{output.score.violations.join(" ") || "No critical risk flags."}</div>}
          {mobileTab === "budget" && output && <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">Spend €{output.plan.blocks.reduce((sum, block) => sum + block.costEUR, 0)}</div>}
        </div>
      </MobilePlannerShell>
    </>
  );

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PlannerHeader
        hasPlan={!!output}
        onPrimary={() => (mode === "full-cruise" ? generateAll() : generateSelected())}
        onAction={(action) => {
          if (action === "simulate") {
            if (!triggerGate("simulation")) setSimOpen(true);
            return;
          }
          if (action === "export" && triggerGate("exportBundle")) return;
          setToast(`${action} queued`);
          setTimeout(() => setToast(""), 1200);
        }}
      />

      {content}

      <SimulationDrawer
        open={simOpen}
        onClose={() => setSimOpen(false)}
        onRun={(scenario) => {
          const action = scenario === "museum" ? "move-lunch-earlier" : scenario === "tender" ? "balanced-loop" : "trim-far-stop";
          applyAssistantAction(action, "day");
          setSimOpen(false);
        }}
      />
      <UpgradeModal open={!!upgradeGate} message={upgradeGate ? gateMessage(upgradeGate) : ""} onClose={() => setUpgradeGate(null)} />
    </main>
  );
}
