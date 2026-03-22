"use client";

import DayHeroCard from "../DayHeroCard";
import QuickAddDayRow from "../QuickAddDayRow";
import RecoveryModeDrawer from "../RecoveryModeDrawer";
import StopDetailDrawer from "../StopDetailDrawer";
import UpgradeModal from "../UpgradeModal";
import VisualRouteBoard from "../VisualRouteBoard";
import { usePlannerWorkspace } from "./PlannerWorkspaceProvider";

export default function PlannerCenterSurface() {
  const { state, selectedDay, selectedPlan, dayHero, healthChip, actions, gateMessage } = usePlannerWorkspace();

  return (
    <>
      <section key={state.boardKey} className="space-y-4 pb-6">
        {state.toast && <p className="rounded-2xl bg-emerald-500/20 px-4 py-3 text-sm text-emerald-100">{state.toast}</p>}
        {state.undoSnapshot && <button className="rounded-xl bg-slate-800 px-3 py-2 text-xs" onClick={actions.undoOptimize}>Undo optimize</button>}

        {!selectedDay ? (
          <div className="rounded-[24px] border border-dashed border-white/20 bg-[#0D1526] p-8 text-slate-300">
            <p className="text-2xl font-semibold">Build your first day</p>
            <p className="mt-2 text-sm text-slate-400">Add a port in the Day Rail, then generate a polished plan in one tap.</p>
          </div>
        ) : !selectedPlan ? (
          <div className="rounded-[24px] border border-white/10 bg-[#0D1526] p-8">
            <p className="text-2xl font-semibold">{selectedDay.portName || selectedDay.portSlug}</p>
            <p className="mt-2 text-sm text-slate-400">Arrival {selectedDay.arrivalTime} · All aboard {selectedDay.allAboardTime} · Pace {selectedDay.pace}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={actions.generateDay} className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-900">Generate plan</button>
              <button onClick={actions.loadSample} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">Try sample itinerary</button>
              <button onClick={actions.generateAll} className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">Generate all days</button>
            </div>
            {state.generation.running && <div className="mt-4 animate-pulse rounded-2xl bg-slate-900 p-4 text-xs">Generating {state.generation.done}/{state.generation.total}…</div>}
          </div>
        ) : (
          <>
            {dayHero && <DayHeroCard hero={dayHero} healthChip={healthChip} confidence={selectedPlan.score.totalScore} onRefine={() => actions.applyIntent("reduce-walking", "day")} onRecovery={() => actions.setRecoveryOpen(true)} />}
            <VisualRouteBoard
              blocks={selectedPlan.plan.blocks}
              dayStart={selectedDay.arrivalTime}
              dayEnd={selectedDay.allAboardTime}
              changedIds={state.highlightedIds}
              diffLabel={state.proposalLabel || undefined}
              onOpenStop={actions.openStopDetails}
            />
            <div className="rounded-2xl border border-white/10 bg-[#0D1526] p-4 text-xs text-slate-300">
              <p className="font-semibold text-slate-100">Plan insight</p>
              <p className="mt-2">Confidence: {selectedPlan.score.totalScore} · Fragility: {selectedPlan.score.violations[0] || "Stable"}</p>
              <p className="mt-1">Cut first if delayed: {selectedPlan.plan.blocks.filter((block) => block.type === "stop" && !block.lock).slice(-1)[0]?.title || "Last optional stop"}</p>
              <p className="mt-1">Why this day works: {dayHero?.whyThisWorks}</p>
            </div>
            <div className="fixed bottom-8 right-8 z-30 hidden items-center gap-2 lg:flex">
              <button onClick={actions.incrementBoardKey} className="rounded-full bg-slate-900 px-3 py-2 text-xs">+ Add stop</button>
              <button onClick={() => actions.setRecoveryOpen(true)} className="rounded-full bg-slate-900 px-3 py-2 text-xs">I&apos;m behind</button>
              <button onClick={() => actions.setStudioOpen((value) => !value)} className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">{state.studioOpen ? "Hide AI" : "Show AI"}</button>
            </div>
          </>
        )}
      </section>

      <UpgradeModal open={!!state.upgradeGate} message={gateMessage} onClose={() => actions.setUpgradeGate(null)} />
      <RecoveryModeDrawer open={state.recoveryOpen} onClose={() => actions.setRecoveryOpen(false)} onApply={actions.applyRecovery} />
      <StopDetailDrawer
        open={!!state.detailBlockId}
        block={selectedPlan?.plan.blocks.find((block) => block.id === state.detailBlockId)}
        onClose={actions.closeStopDetails}
        onEdit={actions.editDetailBlockField}
        onDelete={actions.deleteDetailBlock}
      />

      {state.addDayOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => actions.setAddDayOpen(false)}>
          <div className="mx-auto mt-20 max-w-lg rounded-3xl border border-white/10 bg-[#0D1526] p-5" onClick={(event) => event.stopPropagation()}>
            <p className="text-lg font-semibold">Add a new cruise day</p>
            <p className="text-sm text-slate-400">Keep the rail focused on navigation.</p>
            <div className="mt-4"><QuickAddDayRow onAdd={(payload) => { actions.quickAddDay(payload); actions.setAddDayOpen(false); }} /></div>
            <button onClick={actions.loadSample} className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs">Paste sample itinerary</button>
          </div>
        </div>
      )}

      {state.paletteOpen && (
        <div className="fixed inset-0 z-50 grid place-items-start bg-black/50 pt-24" onClick={() => actions.setPaletteOpen(false)}>
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-[#0D1526] p-3" onClick={(event) => event.stopPropagation()}>
            {[
              { label: "Add day", action: () => actions.quickAddDay({ portSlug: "barcelona", portName: "Barcelona", arrivalTime: "08:00", allAboardTime: "17:00" }) },
              { label: "Generate this day", action: actions.generateDay },
              { label: "Reduce walking", action: () => actions.applyIntent("reduce-walking", "day") },
              { label: "Recovery mode", action: () => actions.setRecoveryOpen(true) },
              { label: "Add food stop", action: () => actions.applyIntent("add-food-stop", "day") },
              { label: "Export", action: () => actions.setUpgradeGate("exportBundle") },
            ].map((item) => (
              <button key={item.label} onClick={() => { void item.action(); actions.setPaletteOpen(false); }} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/10">{item.label}</button>
            ))}
            <div className="mt-2 border-t border-white/10 pt-2 text-xs text-slate-400">Jump to day: {state.cruise.itinerary.map((day, index) => <button key={day.id} onClick={() => { actions.setSelectedDayId(day.id); actions.setPaletteOpen(false); }} className="mr-2 rounded bg-slate-900 px-2 py-1">Day {index + 1}</button>)}</div>
          </div>
        </div>
      )}
    </>
  );
}
