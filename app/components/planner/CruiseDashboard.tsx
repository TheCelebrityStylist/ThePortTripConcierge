import type { Cruise, CruiseDashboard as Dashboard, PlanOutput } from "@/app/lib/planner/types";

export default function CruiseDashboard({ cruise, dashboard, plansByDayId, onGenerateAll, onOptimizeFlow }: { cruise: Cruise; dashboard: Dashboard; plansByDayId: Record<string, PlanOutput>; onGenerateAll: () => void; onOptimizeFlow: () => void }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Cruise Dashboard</h2>
        <div className="flex gap-2">
          <button onClick={onGenerateAll} className="rounded bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900">Generate All</button>
          <button onClick={onOptimizeFlow} className="rounded bg-slate-800 px-3 py-2 text-xs">Optimize Cruise Flow</button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <div className="rounded bg-slate-800/70 p-2 text-xs">Energy pacing score: <strong>{dashboard.energyPacingScore}</strong></div>
        <div className="rounded bg-slate-800/70 p-2 text-xs">Estimated savings: <strong>€{dashboard.savingsEstimateTotal}</strong></div>
        <div className="rounded bg-slate-800/70 p-2 text-xs">Highest risk day: <strong>{dashboard.riskConcentrationDayId ?? "n/a"}</strong></div>
      </div>

      <div className="mt-3 space-y-2">
        {cruise.itinerary.map((day) => (
          <div key={day.id} className="flex items-center justify-between rounded border border-white/10 p-2 text-xs">
            <div>
              <p>{day.date} · {day.portName || day.portSlug}</p>
              <p className="text-slate-400">{day.status} · score {plansByDayId[day.id]?.score.totalScore ?? "--"}</p>
            </div>
            <span className={`rounded px-2 py-1 ${day.locked ? "bg-cyan-500 text-slate-900" : "bg-slate-700"}`}>{day.locked ? "Locked" : "Editable"}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
