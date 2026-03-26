"use client";

import CruiseWorkspaceLayout from "../CruiseWorkspaceLayout";
import PlannerAssistantRail from "./PlannerAssistantRail";
import PlannerCenterSurface from "./PlannerCenterSurface";
import PlannerDayRail from "./PlannerDayRail";
import { usePlannerWorkspace } from "./PlannerWorkspaceProvider";

export default function PlannerWorkspaceScreen() {
  const { state, selectedDay, selectedPlan, healthChip, plannedCount, actions } = usePlannerWorkspace();

  const topBar = (
    <div className="flex h-[74px] items-center justify-between gap-4 px-6">
      <div className="flex items-center gap-3">
        <input className="h-10 rounded-2xl bg-slate-900/70 px-3 text-base font-semibold" value={state.cruise.cruiseName} onChange={(event) => actions.renameCruise(event.target.value)} aria-label="Cruise name" />
        <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs text-slate-300">{selectedDay ? `Day ${state.cruise.itinerary.findIndex((day) => day.id === selectedDay.id) + 1}` : "No day"}</span>
        <span className="rounded-full border border-cyan-300/30 px-3 py-1 text-xs text-cyan-100">{healthChip}</span>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <div className="rounded-full bg-slate-900 p-1 text-xs">
          <button onClick={() => actions.setAssistantMode("day")} className={`rounded-full px-3 py-1.5 ${state.assistantMode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>This Day</button>
          <button onClick={() => actions.setAssistantMode("cruise")} className={`rounded-full px-3 py-1.5 ${state.assistantMode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Whole Cruise</button>
        </div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">Planned {plannedCount}/{state.cruise.itinerary.length}</span>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={() => actions.setPaletteOpen(true)} className="hidden h-10 rounded-2xl bg-slate-900 px-3 text-sm md:inline">⌘K</button>
        <button onClick={() => void actions.generateDay()} className="h-10 rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-900">{selectedDay && selectedPlan ? "Update" : "Generate"}</button>
        <button onClick={() => selectedPlan && actions.applyRecommendation("trim-far-stop", "day")} className="h-10 rounded-2xl bg-slate-900 px-3 text-sm">Simulate day</button>
        <button onClick={() => actions.setUpgradeGate("exportBundle")} className="hidden h-10 rounded-2xl bg-slate-900 px-3 text-sm md:inline">Export</button>
        <button onClick={() => actions.setUpgradeGate("generateAll")} className="h-10 rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm">Upgrade</button>
      </div>
    </div>
  );

  const leftColumn = <PlannerDayRail />;
  const centerColumn = <PlannerCenterSurface />;
  const assistantRail = <PlannerAssistantRail />;
  const actionStudio = state.studioOpen ? <div className="pointer-events-auto fixed bottom-6 right-6 z-40 hidden h-[78vh] w-[350px] lg:block">{assistantRail}</div> : null;

  const mobile = (
    <div className="space-y-3 px-3 pb-24 pt-3">
      <div className="grid grid-cols-3 rounded-2xl bg-slate-900 p-1 text-xs">
        {(["days", "plan", "copilot"] as const).map((tab) => <button key={tab} onClick={() => actions.setMobileTab(tab)} className={`rounded-xl px-2 py-2 ${state.mobileTab === tab ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>{tab === "copilot" ? "Co-Pilot" : tab[0].toUpperCase() + tab.slice(1)}</button>)}
      </div>
      {state.mobileTab === "days" && leftColumn}
      {state.mobileTab === "plan" && centerColumn}
      {state.mobileTab === "copilot" && assistantRail}
      <div className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 gap-2 border-t border-white/10 bg-[#070C17]/95 p-2">
        <button className="rounded-xl bg-slate-900 py-2 text-xs" onClick={() => actions.setMobileTab("days")}>Days</button>
        <button className="rounded-xl bg-cyan-400 py-2 text-xs font-semibold text-slate-900" onClick={() => void actions.generateDay()}>{selectedPlan ? "Update" : "Generate"}</button>
        <button className="rounded-xl bg-slate-900 py-2 text-xs" onClick={() => actions.setMobileTab("copilot")}>Co-Pilot</button>
      </div>
    </div>
  );

  return (
    <>
      <CruiseWorkspaceLayout topBar={topBar} left={leftColumn} center={centerColumn} mobile={mobile} />
      {actionStudio}
    </>
  );
}
