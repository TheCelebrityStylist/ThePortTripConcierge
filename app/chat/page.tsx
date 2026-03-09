"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AIAssistantPanel from "@/app/components/planner/AIAssistantPanel";
import CruiseWorkspaceLayout from "@/app/components/planner/CruiseWorkspaceLayout";
import DayNavigator from "@/app/components/planner/DayNavigator";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import UpgradeModal from "@/app/components/planner/UpgradeModal";
import RecoveryModeDrawer from "@/app/components/planner/RecoveryModeDrawer";
import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { buildCruiseDashboard, createPortDayFromPort, optimizePlan, simulateRisk } from "@/app/lib/planner/engine";
import { generateSmartPlan } from "@/app/lib/planner/generatePlan";
import { buildConciergeBrief } from "@/app/lib/planner/planNarrative";
import { buildPortIntelligence } from "@/app/lib/planner/planHeuristics";
import { applyPlannerIntent, type PlannerIntent } from "@/app/lib/planner/planMutations";
import { parseIntent } from "@/app/lib/planner/chat/parseIntent";
import { executeIntent } from "@/app/lib/planner/chat/executeIntent";
import { buildPlanningContext } from "@/app/lib/planner/context/buildPlanningContext";
import { buildPremiumConciergeBrief } from "@/app/lib/planner/generation/buildConciergeBrief";
import { buildRecoveryPlan } from "@/app/lib/planner/buildRecoveryPlan";
import type { Cruise, FeatureGateKey, FeatureTier, PlanBlock, PlanInput, PlanOutput, PortDay } from "@/app/lib/planner/types";

const DRAFT_KEY = "porttrip_workspace_draft_v4";

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

const createDefaultCruise = (): Cruise => ({ id: "cruise-local", cruiseName: "My Cruise", startDate: new Date().toISOString().slice(0, 10), durationDays: 0, timezone: "Local", itinerary: [] });
type MobileTab = "days" | "plan" | "copilot";

export default function ChatPage() {
  /*
   * Architecture notes:
   * - Workspace shell: command bar + day rail + plan board + co-pilot dock.
   * - Engine remains deterministic; smart wrappers enrich plans and responses.
   * - Plan content resolves from local port intelligence + deterministic engine wrappers.
   * - Live research enrichment is fetched in the co-pilot via researchPortContext fallback flow.
   * - Co-pilot actions mutate state via applyPlannerIntent/buildRecoveryPlan in this workspace.
   */
  const searchParams = useSearchParams();
  const [tier] = useState<FeatureTier>("free");
  const [assistantMode, setAssistantMode] = useState<"day" | "cruise">("day");
  const [mobileTab, setMobileTab] = useState<MobileTab>("plan");
  const [input] = useState<PlanInput>(defaultInput);
  const [cruise, setCruise] = useState<Cruise>(createDefaultCruise);
  const [selectedDayId, setSelectedDayId] = useState<string>();
  const [plansByDayId, setPlansByDayId] = useState<Record<string, PlanOutput>>({});
  const [generation, setGeneration] = useState<{ running: boolean; done: number; total: number }>({ running: false, done: 0, total: 0 });
  const [upgradeGate, setUpgradeGate] = useState<FeatureGateKey | null>(null);
  const [toast, setToast] = useState("");
  const [undoSnapshot, setUndoSnapshot] = useState<Record<string, PlanOutput> | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>();
  const [changeLog, setChangeLog] = useState<string[]>([]);
  const [boardKey, setBoardKey] = useState(0);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  const entitlements = useMemo(() => getEntitlements(tier, searchParams.toString()), [tier, searchParams]);
  const selectedDay = cruise.itinerary.find((day) => day.id === selectedDayId);
  const output = selectedDay ? plansByDayId[selectedDay.id] : undefined;
  const dashboard = useMemo(() => buildCruiseDashboard(cruise, plansByDayId), [cruise, plansByDayId]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { cruise: Cruise; selectedDayId?: string };
      setCruise(parsed.cruise);
      setSelectedDayId(parsed.selectedDayId);
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise, selectedDayId }));
  }, [cruise, selectedDayId]);

  useEffect(() => {
    if (selectedDayId || cruise.itinerary.length === 0) return;
    setSelectedDayId(cruise.itinerary[0]?.id);
  }, [selectedDayId, cruise.itinerary]);

  const quickAddDay = (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => {
    if (!hasFeature(entitlements, "fullCruiseMode") && cruise.itinerary.length >= 1) {
      setUpgradeGate("fullCruiseMode");
      return;
    }
    const index = cruise.itinerary.length;
    const date = new Date(new Date(cruise.startDate).getTime() + index * 86400000).toISOString().slice(0, 10);
    const day = { ...createPortDayFromPort(payload.portSlug, date), portName: payload.portName, arrivalTime: payload.arrivalTime, onboardTime: payload.arrivalTime, allAboardTime: payload.allAboardTime };
    setCruise((prev) => ({ ...prev, durationDays: index + 1, itinerary: [...prev.itinerary, day] }));
    setSelectedDayId(day.id);
    setToast(`Added ${payload.portName} to Day ${index + 1}.`);
    setTimeout(() => setToast(""), 1600);
  };

  const loadSample = () => {
    ["barcelona", "marseille", "naples", "rome-civitavecchia"].forEach((slug, idx) => {
      if (!hasFeature(entitlements, "fullCruiseMode") && idx > 0) return;
      quickAddDay({ portSlug: slug, portName: slug.replace(/-/g, " "), arrivalTime: "08:00", allAboardTime: "17:00" });
    });
  };

  const onGenerateDay = (day: PortDay) => {
    const planInput: PlanInput = {
      ...input,
      portSlug: day.portSlug,
      portName: day.portName,
      onboardTime: day.onboardTime,
      allAboardTime: day.allAboardTime,
      walkingLevel: day.walkingPreference,
      pace: day.pace,
      riskTolerance: day.riskTolerance,
      interests: day.interests,
    };
    const generated = generateSmartPlan(planInput);
    setPlansByDayId((prev) => ({ ...prev, [day.id]: generated }));
    setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((item) => (item.id === day.id ? { ...item, status: "draft", score: generated.score.totalScore } : item)) }));
    setChangeLog([`Generated ${day.portName || day.portSlug} with score ${generated.score.totalScore}.`, "Built return-safe block.", "Added reliability-weighted transfers."]);
    setBoardKey((prev) => prev + 1);
  };

  const onGenerateAll = async () => {
    if (!hasFeature(entitlements, "generateAll")) {
      setUpgradeGate("generateAll");
      return;
    }
    setGeneration({ running: true, done: 0, total: cruise.itinerary.length });
    for (let i = 0; i < cruise.itinerary.length; i += 1) {
      const day = cruise.itinerary[i];
      onGenerateDay(day);
      setGeneration({ running: true, done: i + 1, total: cruise.itinerary.length });
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
    setGeneration({ running: false, done: cruise.itinerary.length, total: cruise.itinerary.length });
  };

  const applyRecommendation = (action: PlanOutput["recommendations"][number]["action"], scope: "day" | "cruise") => {
    setUndoSnapshot(plansByDayId);
    if (scope === "day" && selectedDay && output) {
      const nextPlan = optimizePlan(output.plan, { action });
      const next = { ...output, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) };
      setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: next }));
      setChangeLog([`Applied ${action}.`, "Updated sequencing and timing.", "Recomputed risk score."]);
      return;
    }
    const next = { ...plansByDayId };
    Object.entries(next).forEach(([dayId, plan]) => {
      const nextPlan = optimizePlan(plan.plan, { action });
      next[dayId] = { ...plan, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) };
    });
    setPlansByDayId(next);
    setChangeLog([`Applied ${action} cruise-wide.`, "Preserved locked blocks.", "Recomputed all planned days."]);
  };

  const updateBlocks = (nextBlocks: PlanBlock[]) => {
    if (!selectedDay || !output) return;
    const updatedPlan = { ...output.plan, blocks: nextBlocks };
    const updated: PlanOutput = { ...output, plan: updatedPlan, score: simulateRisk(updatedPlan, updatedPlan.input.portSlug) };
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: updated }));
    setChangeLog(["Manual board edits applied.", "Updated block details.", "Score recalculated."]);
  };


  const applyIntent = (intent: PlannerIntent, scope: "day" | "cruise") => {
    if (scope === "day" && selectedDay && output) {
      if (intent === "running-late") {
        const recovery = buildRecoveryPlan(output, 20);
        setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: recovery.next }));
        setChangeLog([recovery.summary, ...recovery.cuts]);
        return;
      }
      const { next, changes } = applyPlannerIntent(output, intent);
      setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: next }));
      setChangeLog(changes);
      return;
    }
    if (scope === "cruise") {
      const nextMap = { ...plansByDayId };
      const merged: string[] = [];
      Object.entries(nextMap).forEach(([dayId, plan]) => {
        const mutated = applyPlannerIntent(plan, intent);
        nextMap[dayId] = mutated.next;
        merged.push(...mutated.changes);
      });
      setPlansByDayId(nextMap);
      setChangeLog(Array.from(new Set(merged)).slice(0, 4));
    }
  };

  const submitCopilotPrompt = async (prompt: string, scope: "day" | "cruise") => {
    const parsed = parseIntent(prompt);
    if (!parsed.intent) return null;
    if (scope === "day" && selectedDay && output) {
      const { assistant } = executeIntent({ dayId: selectedDay.id, output, intent: parsed.intent });
      applyIntent(parsed.intent, "day");
      const context = await buildPlanningContext({ scope, intent: parsed.intent, selectedDay, selectedPlan: output, cruise });
      const brief = buildPremiumConciergeBrief(context);
      return { ...assistant, why: [...assistant.why, `Risk now: ${brief.risk}`] };
    }
    applyIntent(parsed.intent, scope);
    return null;
  };

  const plannedCount = Object.keys(plansByDayId).length;
  const conciergeBrief = output ? buildConciergeBrief(output, buildPortIntelligence(output.plan.input), selectedDay) : null;

  const topBar = (
    <div className="flex h-[72px] items-center justify-between gap-3 px-6">
      <div className="flex items-center gap-3">
        <span className={`h-2.5 w-2.5 rounded-full ${selectedDay ? "bg-emerald-400" : "bg-slate-500"}`} />
        <input className="h-10 rounded-2xl bg-slate-900/70 px-3 text-base font-semibold" value={cruise.cruiseName} onChange={(e) => setCruise((prev) => ({ ...prev, cruiseName: e.target.value }))} aria-label="Cruise name" />
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{selectedDay ? `Day ${cruise.itinerary.findIndex((day) => day.id === selectedDay.id) + 1}` : "No day"}</span>
      </div>

      <div className="hidden rounded-full bg-slate-900 p-1 text-xs md:flex">
        <button onClick={() => setAssistantMode("day")} className={`rounded-full px-3 py-1.5 ${assistantMode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>This Day</button>
        <button onClick={() => setAssistantMode("cruise")} className={`rounded-full px-3 py-1.5 ${assistantMode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Whole Cruise</button>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300 lg:inline">Planned {plannedCount}/{cruise.itinerary.length}</span>
        <button onClick={() => selectedDay && onGenerateDay(selectedDay)} className="h-10 rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-900">{selectedDay && output ? "Update" : "Generate"}</button>
        <button onClick={() => output && applyRecommendation("trim-far-stop", "day")} className="h-10 rounded-2xl bg-slate-900 px-3 text-sm">Simulate</button>
        <button onClick={() => setUpgradeGate("exportBundle")} className="hidden h-10 rounded-2xl bg-slate-900 px-3 text-sm md:inline">Export</button>
        <button onClick={() => setUpgradeGate("generateAll")} className="h-10 rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm">Upgrade</button>
      </div>
    </div>
  );

  const leftColumn = <DayNavigator cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} onQuickAdd={quickAddDay} onQuickAddFive={loadSample} />;

  const centerColumn = (
    <section key={boardKey} className="space-y-4 pb-6">
      {toast && <p className="rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">{toast}</p>}
      {undoSnapshot && <button className="rounded-xl bg-slate-800 px-3 py-2 text-xs" onClick={() => { setPlansByDayId(undoSnapshot); setUndoSnapshot(null); }}>Undo optimize</button>}

      {!selectedDay ? (
        <div className="rounded-[24px] border border-dashed border-white/20 bg-[#0D1526] p-8 text-slate-300">
          <p className="text-2xl font-semibold">Build your first day</p>
          <p className="mt-2 text-sm text-slate-400">Add a port in the Day Rail, then generate a polished plan in one tap.</p>
        </div>
      ) : !output ? (
        <div className="rounded-[24px] border border-white/10 bg-[#0D1526] p-8">
          <p className="text-2xl font-semibold">{selectedDay.portName || selectedDay.portSlug}</p>
          <p className="mt-2 text-sm text-slate-400">Arrival {selectedDay.arrivalTime} · All aboard {selectedDay.allAboardTime} · Pace {selectedDay.pace}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => onGenerateDay(selectedDay)} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900">Generate plan</button>
            <button onClick={loadSample} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">Try sample itinerary</button>
            <button onClick={onGenerateAll} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">Generate all days</button>
          </div>
          {generation.running && <div className="mt-4 animate-pulse rounded-2xl bg-slate-900 p-4 text-xs">Generating {generation.done}/{generation.total}…</div>}
        </div>
      ) : (
        <>
          <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
            <div className="rounded-[24px] border border-white/10 bg-[#0D1526] p-5">
              <p className="text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Concierge brief</p>
              <p className="mt-1 text-xl font-semibold">{conciergeBrief?.howTodayFeels ?? (selectedDay.portName || selectedDay.portSlug)}</p>
              <div className="mt-3 grid gap-2 text-xs">
                <p><span className="text-slate-400">Must-not-miss:</span> {conciergeBrief?.mustNotMiss}</p>
                <p><span className="text-slate-400">Biggest risk:</span> {conciergeBrief?.biggestRisk}</p>
                <p><span className="text-slate-400">Fallback loop:</span> {conciergeBrief?.fallbackLoop}</p>
              </div>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-[#0D1526] p-5">
              <p className="text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Confidence + fragility</p>
              <p className="mt-1 text-3xl font-semibold">{conciergeBrief?.confidenceScore ?? output.score.totalScore}</p>
              <p className="mt-2 text-xs text-slate-300">Fragile leg: {conciergeBrief?.fragileLeg}</p>
              <p className="mt-1 text-xs text-slate-300">If +20m behind, cut first: {conciergeBrief?.cutFirstIfBehind}</p>
              <button onClick={() => setRecoveryOpen(true)} className="mt-3 rounded-full border border-cyan-300/40 px-3 py-1 text-xs text-cyan-100">Recovery mode</button>
              <p className="mt-2 text-[11px] text-slate-400">Cruise pacing score {dashboard.energyPacingScore}</p>
            </div>
          </div>
          <TimelineBoard blocks={output.plan.blocks} dayStart={selectedDay.arrivalTime} dayEnd={selectedDay.allAboardTime} onChange={updateBlocks} onSelectBlock={(block) => setEditingTitle(block?.title)} />
          <PlanQualityPanel output={output} onApplyRecommendation={(action) => applyRecommendation(action, "day")} />
        </>
      )}
    </section>
  );

  const rightColumn = <AIAssistantPanel cruise={cruise} selectedDay={selectedDay} selectedPlan={output} mode={assistantMode} editingTitle={editingTitle} changeLog={changeLog} onModeChange={setAssistantMode} onApplyIntent={applyIntent} onSubmitPrompt={submitCopilotPrompt} />;

  const mobile = (
    <div className="space-y-3 px-3 pb-24 pt-3">
      <div className="grid grid-cols-3 rounded-2xl bg-slate-900 p-1 text-xs">
        {(["days", "plan", "copilot"] as MobileTab[]).map((tab) => <button key={tab} onClick={() => setMobileTab(tab)} className={`rounded-xl px-2 py-2 ${mobileTab === tab ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>{tab === "copilot" ? "Co-Pilot" : tab[0].toUpperCase() + tab.slice(1)}</button>)}
      </div>
      {mobileTab === "days" && leftColumn}
      {mobileTab === "plan" && centerColumn}
      {mobileTab === "copilot" && rightColumn}
      <div className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 border-t border-white/10 bg-[#070C17]/95 p-2">
        <button className="rounded-xl bg-slate-900 py-2 text-xs" onClick={() => setMobileTab("days")}>Days</button>
        <button className="rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-900" onClick={() => selectedDay && onGenerateDay(selectedDay)}>{output ? "Update" : "Generate"}</button>
        <button className="rounded-xl bg-slate-900 py-2 text-xs" onClick={() => setMobileTab("copilot")}>Co-Pilot</button>
      </div>
    </div>
  );

  return (
    <>
      <CruiseWorkspaceLayout topBar={topBar} left={leftColumn} center={centerColumn} right={rightColumn} mobile={mobile} />
      <UpgradeModal open={!!upgradeGate} message={upgradeGate ? gateMessage(upgradeGate) : ""} onClose={() => setUpgradeGate(null)} />
      <RecoveryModeDrawer open={recoveryOpen} onClose={() => setRecoveryOpen(false)} onApply={(minutes) => {
        if (!selectedDay || !output) return;
        const recovery = buildRecoveryPlan(output, minutes);
        setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: recovery.next }));
        setChangeLog([recovery.summary, ...recovery.cuts]);
      }} />
    </>
  );
}
