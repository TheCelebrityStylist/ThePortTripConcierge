import type { RiskBreakdown } from "@/app/lib/planner/types";

export default function PlanQualityPanel({ risk, onFix }: { risk: RiskBreakdown; onFix: (action: RiskBreakdown["items"][number]["action"]) => void }) {
  return (
    <aside className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
      <p className="font-semibold">Return-Safe Intelligence</p>
      <p className="mt-1 text-2xl font-bold text-cyan-300">{risk.total}</p>
      <div className="mt-3 space-y-2">
        {risk.items.map((item) => (
          <div key={item.key} className="rounded-lg bg-slate-800 p-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">{item.label}</p>
              <span className="text-xs text-slate-300">{item.score}</span>
            </div>
            <p className="mt-1 text-xs text-slate-300">{item.why}</p>
            <button onClick={() => onFix(item.action)} className="mt-2 rounded bg-cyan-400 px-2 py-1 text-xs font-semibold text-slate-900">{item.fixLabel}</button>
          </div>
        ))}
      </div>
    </aside>
  );
}
