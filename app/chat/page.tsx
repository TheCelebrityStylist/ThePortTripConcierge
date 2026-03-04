"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AIAssistantPanel from "@/app/components/planner/AIAssistantPanel";
import CruiseWorkspaceLayout from "@/app/components/planner/CruiseWorkspaceLayout";
import DayNavigator from "@/app/components/planner/DayNavigator";
import PlanQualityPanel from "@/app/components/planner/PlanQualityPanel";
import TimelineBoard from "@/app/components/planner/TimelineBoard";
import UpgradeModal from "@/app/components/planner/UpgradeModal";
import { gateMessage, getEntitlements, hasFeature } from "@/app/lib/cruise/gates";
import { buildCruiseDashboard, createPortDayFromPort, generatePortDayPlan, optimizePlan, simulateRisk } from "@/app/lib/planner/engine";
import type { Cruise, FeatureGateKey, FeatureTier, PlanBlock, PlanInput, PlanOutput, PortDay } from "@/app/lib/planner/types";

const DRAFT_KEY = "porttrip_workspace_draft_v3";

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
  const searchParams = useSearchParams();
  const [tier, setTier] = useState<FeatureTier>("free");
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
  const [focusAdd, setFocusAdd] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string>();
  const [changeLog, setChangeLog] = useState<string[]>([]);

  const entitlements = useMemo(() => getEntitlements(tier, searchParams.toString()), [tier, searchParams]);
  const selectedDay = cruise.itinerary.find((day) => day.id === selectedDayId);
  const output = selectedDay ? plansByDayId[selectedDay.id] : undefined;
  const dashboard = useMemo(() => buildCruiseDashboard(cruise, plansByDayId), [cruise, plansByDayId]);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { cruise: Cruise; selectedDayId?: string; tier?: FeatureTier };
      setCruise(parsed.cruise);
      setSelectedDayId(parsed.selectedDayId);
      setTier(parsed.tier ?? "free");
    } catch {
      // ignore malformed draft
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ cruise, selectedDayId, tier }));
  }, [cruise, selectedDayId, tier]);

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
    const generated = generatePortDayPlan(planInput);
    setPlansByDayId((prev) => ({ ...prev, [day.id]: generated }));
    setCruise((prev) => ({ ...prev, itinerary: prev.itinerary.map((item) => (item.id === day.id ? { ...item, status: "draft", score: generated.score.totalScore } : item)) }));
    setChangeLog([`Generated ${day.portName || day.portSlug} with score ${generated.score.totalScore}.`, "Built a return-safe block.", "Mapped transfer legs based on local reliability."]);
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
      setChangeLog([`Applied ${action} on this day.`, "Updated block ordering and timings.", "Recomputed risk score."]);
      return;
    }
    const next = { ...plansByDayId };
    Object.entries(next).forEach(([dayId, plan]) => {
      const nextPlan = optimizePlan(plan.plan, { action });
      next[dayId] = { ...plan, plan: nextPlan, score: simulateRisk(nextPlan, nextPlan.input.portSlug) };
    });
    setPlansByDayId(next);
    setChangeLog([`Applied ${action} cruise-wide.`, "Adjusted each planned day.", "Preserved locked blocks."]);
  };

  const updateBlocks = (nextBlocks: PlanBlock[]) => {
    if (!selectedDay || !output) return;
    const updatedPlan = { ...output.plan, blocks: nextBlocks };
    const updated: PlanOutput = { ...output, plan: updatedPlan, score: simulateRisk(updatedPlan, updatedPlan.input.portSlug) };
    setPlansByDayId((prev) => ({ ...prev, [selectedDay.id]: updated }));
    setChangeLog(["Edited board blocks manually.", "Updated timing and transfer details.", "Recomputed score."]);
  };

  const hasAnyPlan = Object.keys(plansByDayId).length > 0;
  const plannedCount = Object.keys(plansByDayId).length;

  const topBar = (
    <div className="mx-auto flex max-w-[1700px] items-center gap-2 px-3 py-3">
      <input className="max-w-[190px] rounded-lg bg-slate-800 px-3 py-1.5 text-sm" value={cruise.cruiseName} onChange={(e) => setCruise((prev) => ({ ...prev, cruiseName: e.target.value }))} aria-label="Cruise name" />
      <span className="hidden rounded-lg bg-slate-900 px-2 py-1 text-xs text-slate-300 md:inline">{selectedDay ? `Day ${cruise.itinerary.findIndex((day) => day.id === selectedDay.id) + 1}` : "No day selected"}</span>
      <button onClick={() => selectedDay && onGenerateDay(selectedDay)} className="ml-auto rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">{selectedDay && output ? "Update" : "Generate"}</button>
      <button onClick={() => output && applyRecommendation("trim-far-stop", "day")} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">Simulate</button>
      <button onClick={onGenerateAll} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">Generate all</button>
      <button onClick={() => setUpgradeGate("generateAll")} className="rounded-lg bg-slate-800 px-3 py-2 text-sm">Upgrade</button>
      <span className="hidden text-xs text-slate-400 lg:inline">{plannedCount}/{cruise.itinerary.length} planned · Pace {dashboard.energyPacingScore}</span>
    </div>
  );

  const leftColumn = <DayNavigator cruise={cruise} plansByDayId={plansByDayId} selectedDayId={selectedDayId} onSelectDay={setSelectedDayId} onQuickAdd={quickAddDay} onQuickAddFive={loadSample} autoFocusAdd={focusAdd} />;

  const centerColumn = (
    <section className="space-y-3">
      {toast && <p className="rounded bg-emerald-500/20 px-3 py-2 text-xs text-emerald-200">{toast}</p>}
      {undoSnapshot && <button className="rounded bg-slate-800 px-3 py-1 text-xs" onClick={() => { setPlansByDayId(undoSnapshot); setUndoSnapshot(null); }}>Undo optimize</button>}
      {!selectedDay ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/40 p-6 text-sm text-slate-300">Add your first port day to start. <button className="underline" onClick={() => setFocusAdd(true)}>Focus add form</button></div>
      ) : !output ? (
        <div className="space-y-3 rounded-2xl bg-slate-900/60 p-6 text-sm text-slate-300">
          <p className="font-semibold">Ready to plan {selectedDay.portName || selectedDay.portSlug}.</p>
          <p className="text-xs text-slate-400">Arrival {selectedDay.arrivalTime} · All aboard {selectedDay.allAboardTime} · Pace {selectedDay.pace}</p>
          <button onClick={() => onGenerateDay(selectedDay)} className="w-fit rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">Generate this day</button>
          {!hasAnyPlan && <button className="w-fit rounded-lg bg-slate-800 px-3 py-2 text-xs" onClick={loadSample}>Try with sample itinerary</button>}
          {generation.running && <div className="animate-pulse rounded bg-slate-800 p-4 text-xs">Generating {generation.done}/{generation.total}…</div>}
        </div>
      ) : (
        <>
          <div className="rounded-2xl bg-slate-900/60 p-3 text-xs text-slate-300">{selectedDay.portName || selectedDay.portSlug} · {selectedDay.arrivalTime}-{selectedDay.allAboardTime} · walking {selectedDay.walkingPreference} · risk {selectedDay.riskTolerance}</div>
          <TimelineBoard blocks={output.plan.blocks} dayStart={selectedDay.arrivalTime} dayEnd={selectedDay.allAboardTime} onChange={updateBlocks} onSelectBlock={(block) => setEditingTitle(block?.title)} />
          <PlanQualityPanel output={output} onApplyRecommendation={(action) => applyRecommendation(action, "day")} />
        </>
      )}
    </section>
  );

  const rightColumn = <AIAssistantPanel cruise={cruise} selectedDay={selectedDay} selectedPlan={output} mode={assistantMode} editingTitle={editingTitle} changeLog={changeLog} onModeChange={setAssistantMode} onApplyAction={applyRecommendation} />;

  const mobile = (
    <div className="space-y-3 pb-20">
      <div className="grid grid-cols-3 rounded-xl bg-slate-900/80 p-1 text-xs">
        {(["days", "plan", "copilot"] as MobileTab[]).map((tab) => <button key={tab} onClick={() => setMobileTab(tab)} className={`rounded-lg px-2 py-2 ${mobileTab === tab ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>{tab === "copilot" ? "Co-Pilot" : tab[0].toUpperCase() + tab.slice(1)}</button>)}
      </div>
      {mobileTab === "days" && leftColumn}
      {mobileTab === "plan" && centerColumn}
      {mobileTab === "copilot" && rightColumn}
      <div className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 border-t border-white/10 bg-slate-950/95 p-2">
        <button className="rounded-lg bg-slate-800 py-2 text-xs" onClick={() => setMobileTab("days")}>Days</button>
        <button className="rounded-lg bg-cyan-400 py-2 text-xs font-semibold text-slate-900" onClick={() => selectedDay && onGenerateDay(selectedDay)}>{output ? "Update" : "Generate"}</button>
        <button className="rounded-lg bg-slate-800 py-2 text-xs" onClick={() => setMobileTab("copilot")}>Co-Pilot</button>
      </div>
    </div>
  );

  return (
    <>
      <CruiseWorkspaceLayout topBar={topBar} left={leftColumn} center={centerColumn} right={rightColumn} mobile={mobile} />
      <UpgradeModal open={!!upgradeGate} message={upgradeGate ? gateMessage(upgradeGate) : ""} onClose={() => setUpgradeGate(null)} />
    </>
  );
}
