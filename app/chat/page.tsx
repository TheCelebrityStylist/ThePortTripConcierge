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
import type { PlannerIntent } from "@/app/lib/planner/planMutations";
import { parseIntent } from "@/app/lib/planner/mutations/parseIntent";
import { executeMutation } from "@/app/lib/planner/mutations/executeMutation";
import { buildPlanningContext } from "@/app/lib/planner/context/buildPlanningContext";
import { buildPremiumConciergeBrief } from "@/app/lib/planner/generation/buildConciergeBrief";
import { buildRecoveryMode } from "@/app/lib/planner/generation/buildRecoveryMode";
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
   * Maintainer note:
   * - Itinerary state lives in `plansByDayId` keyed by cruise day id.
   * - Generate/update flow uses deterministic planner engine wrappers (`generateSmartPlan`, `optimizePlan`).
   * - AI prompt/actions mutate actual itinerary through `executeMutation` (intent -> state diff -> risk recompute).
   * - Retrieval for AI rationale is assembled via `buildPlanningContext` (local port data + live Tavily context).
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
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

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

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      onboardTime: day.arrivalTime,
      allAboardTime: day.allAboardTime,
      walkingLevel: day.walkingPreference,
      pace: day.pace,
      riskTolerance: day.riskTolerance,
      interests: day.interests,
    };
    const next = generateSmartPlan(planInput);
    setPlansByDayId((prev) => ({ ...prev, [day.id]: next }));
    setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((item) => (item.id === day.id ? { ...item, status: "draft", score: next.score.totalScore } : item)) }));
  };

  const onGenerateAll = () => {
    if (!hasFeature(entitlements, "generateAll")) {
      setUpgradeGate("generateAll");
      return;
    }
    setGeneration({ running: true, done: 0, total: cruise.itinerary.length });
    const nextMap: Record<string, PlanOutput> = {};
    cruise.itinerary.forEach((day, index) => {
      const planInput: PlanInput = {
        ...input,
        portSlug: day.portSlug,
        portName: day.portName,
        onboardTime: day.arrivalTime,
        allAboardTime: day.allAboardTime,
        walkingLevel: day.walkingPreference,
        pace: day.pace,
        riskTolerance: day.riskTolerance,
        interests: day.interests,
      };
      nextMap[day.id] = generateSmartPlan(planInput);
      setGeneration((prev) => ({ ...prev, done: index + 1 }));
    });
    setPlansByDayId(nextMap);
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
        const recovery = buildRecoveryMode(output, 30);
        setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: recovery.next }));
        setChangeLog([recovery.summary, ...recovery.cuts]);
        setHighlightedIds(recovery.next.plan.blocks.slice(0, 2).map((b) => b.id));
        setTimeout(() => setHighlightedIds([]), 1800);
        return;
      }
      const mutation = executeMutation(output, intent);
      setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: mutation.next }));
      setChangeLog([mutation.rationale, ...mutation.changes]);
      setHighlightedIds(mutation.diff.changedBlockIds.slice(0, 4));
      setTimeout(() => setHighlightedIds([]), 1800);
      return;
    }
    if (scope === "cruise") {
      const nextMap = { ...plansByDayId };
      const merged: string[] = [];
      const changed: string[] = [];
      Object.entries(nextMap).forEach(([dayId, plan]) => {
        const mutation = executeMutation(plan, intent);
        nextMap[dayId] = mutation.next;
        merged.push(...mutation.changes);
        changed.push(...mutation.diff.changedBlockIds);
      });
      setPlansByDayId(nextMap);
      setChangeLog(Array.from(new Set(merged)).slice(0, 4));
      setHighlightedIds(Array.from(new Set(changed)).slice(0, 6));
      setTimeout(() => setHighlightedIds([]), 1800);
    }
  };

  const submitCopilotPrompt = async (prompt: string, scope: "day" | "cruise") => {
    const parsed = parseIntent(prompt);
    if (!parsed.intent) return null;
    applyIntent(parsed.intent, scope);
    const context = await buildPlanningContext({ scope, intent: parsed.intent, selectedDay, selectedPlan: output, cruise });
    const brief = buildPremiumConciergeBrief(context);
    return {
      summary: `Applied ${parsed.intent.replace(/-/g, " ")} to ${scope === "day" ? "this day" : "whole cruise"}.`,
      why: [`Risk watch: ${brief.risk}`, `Must not miss: ${brief.mustNotMiss}`],
      applyNow: [{ label: "Keep me ship-safe", intent: "make-safer" as PlannerIntent }, { label: "Reduce walking", intent: "reduce-walking" as PlannerIntent }],
      fallback: `Fallback loop: ${brief.fallbackLoop}`,
    };
  };

  const plannedCount = Object.keys(plansByDayId).length;
  const conciergeBrief = output ? buildConciergeBrief(output, buildPortIntelligence(output.plan.input), selectedDay) : null;
  const healthChip = !output ? "No plan" : output.score.totalScore >= 82 ? "Flexible" : output.score.totalScore >= 72 ? "Ship-safe" : output.score.totalScore >= 62 ? "Tight" : "Fragile";

  const topBar = (
    <div className="flex h-[74px] items-center justify-between gap-4 px-6">
      <div className="flex items-center gap-3">
        <input className="h-10 rounded-2xl bg-slate-900/70 px-3 text-base font-semibold" value={cruise.cruiseName} onChange={(e) => setCruise((prev) => ({ ...prev, cruiseName: e.target.value }))} aria-label="Cruise name" />
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{selectedDay ? `Day ${cruise.itinerary.findIndex((day) => day.id === selectedDay.id) + 1}` : "No day"}</span>
        <span className="rounded-full border border-cyan-300/30 px-3 py-1 text-xs text-cyan-100">{healthChip}</span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="rounded-full bg-slate-900 p-1 text-xs">
          <button onClick={() => setAssistantMode("day")} className={`rounded-full px-3 py-1.5 ${assistantMode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>This Day</button>
          <button onClick={() => setAssistantMode("cruise")} className={`rounded-full px-3 py-1.5 ${assistantMode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Whole Cruise</button>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Planned {plannedCount}/{cruise.itinerary.length}</span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => setPaletteOpen(true)} className="hidden h-10 rounded-2xl bg-slate-900 px-3 text-sm md:inline">⌘K</button>
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
          <div className="rounded-[24px] border border-white/10 bg-[#0D1526] p-5">
            <p className="text-xl font-semibold">{conciergeBrief?.howTodayFeels ?? (selectedDay.portName || selectedDay.portSlug)}</p>
            <p className="mt-2 text-sm text-slate-300">Must-not-miss: {conciergeBrief?.mustNotMiss} · Risk: {conciergeBrief?.biggestRisk} · Fallback: {conciergeBrief?.fallbackLoop}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
              <span className="rounded-full bg-slate-900 px-3 py-1">Confidence {conciergeBrief?.confidenceScore ?? output.score.totalScore}</span>
              <span className="rounded-full bg-slate-900 px-3 py-1">Fragile leg: {conciergeBrief?.fragileLeg}</span>
              <span className="rounded-full bg-slate-900 px-3 py-1">Cut first: {conciergeBrief?.cutFirstIfBehind}</span>
              <button onClick={() => setRecoveryOpen(true)} className="rounded-full border border-cyan-300/40 px-3 py-1 text-cyan-100">Recovery mode</button>
            </div>
          </div>
          <TimelineBoard blocks={output.plan.blocks} dayStart={selectedDay.arrivalTime} dayEnd={selectedDay.allAboardTime} highlightedIds={highlightedIds} onChange={updateBlocks} onSelectBlock={(block) => setEditingTitle(block?.title)} />
          <div className="fixed bottom-8 right-[34%] z-30 hidden items-center gap-2 lg:flex">
            <button onClick={() => setBoardKey((prev) => prev + 1)} className="rounded-full bg-slate-900 px-3 py-2 text-xs">+ Add stop</button>
            <button onClick={() => setRecoveryOpen(true)} className="rounded-full bg-slate-900 px-3 py-2 text-xs">Recovery mode</button>
            <button onClick={() => applyIntent("reduce-walking", "day")} className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">Optimize with AI</button>
          </div>
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
        const recovery = buildRecoveryMode(output, minutes);
        setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: recovery.next }));
        setChangeLog([`Recovery +${minutes}m`, recovery.summary, ...recovery.cuts]);
        setHighlightedIds(recovery.next.plan.blocks.slice(0, 2).map((b) => b.id));
        setTimeout(() => setHighlightedIds([]), 1800);
      }} />

      {paletteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 pt-24" onClick={() => setPaletteOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0D1526] p-3" onClick={(e) => e.stopPropagation()}>
            {[{ label: "Add day", action: () => quickAddDay({ portSlug: "barcelona", portName: "Barcelona", arrivalTime: "08:00", allAboardTime: "17:00" }) }, { label: "Generate this day", action: () => selectedDay && onGenerateDay(selectedDay) }, { label: "Reduce walking", action: () => applyIntent("reduce-walking", "day") }, { label: "Recovery mode", action: () => setRecoveryOpen(true) }, { label: "Add food stop", action: () => applyIntent("add-food-stop", "day") }, { label: "Export", action: () => setUpgradeGate("exportBundle") }].map((item) => (
              <button key={item.label} onClick={() => { item.action(); setPaletteOpen(false); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10">{item.label}</button>
            ))}
            <div className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-400">Jump to day: {cruise.itinerary.map((day, index) => <button key={day.id} onClick={() => { setSelectedDayId(day.id); setPaletteOpen(false); }} className="mr-2 rounded bg-slate-900 px-2 py-1">Day {index + 1}</button>)}</div>
          </div>
        </div>
      )}
    </>
  );
}
