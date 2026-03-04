import type { PlanOutput } from "@/app/lib/planner/types";

export default function PlanQualityPanel({ output, onApplyRecommendation }: { output: PlanOutput; onApplyRecommendation: (action: PlanOutput["recommendations"][number]["action"]) => void }) {
  const score = output.score;
  const radar = [
    { key: "Buffer", value: score.bufferHealth, why: "Higher means stronger return-safe margin." },
    { key: "Distance", value: 100 - score.distanceRisk, why: "Lower distance risk improves reliability." },
    { key: "Transfers", value: 100 - score.transferCountRisk, why: "Fewer risky transfers reduce misses." },
    { key: "Crowds", value: 100 - score.crowdOverlapRisk, why: "Crowd smoothing cuts delay probability." },
  ];

  return (
    <aside className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
      <p className="font-semibold">Plan Radar</p>
      <p className="mt-1 text-2xl font-bold text-cyan-300">{score.totalScore}</p>
      <div className="mt-2 space-y-2">
        {radar.map((item) => (
          <div key={item.key} title={item.why}>
            <div className="mb-1 flex items-center justify-between text-xs"><span>{item.key}</span><span>{item.value}</span></div>
            <div className="h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-cyan-400" style={{ width: `${Math.max(6, Math.min(item.value, 100))}%` }} /></div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-slate-300">Why this score: {output.plan.assumptions[0]}</p>

      <div className="mt-3 space-y-2">
        {output.recommendations.slice(0, 3).map((recommendation) => (
          <button key={recommendation.action} onClick={() => onApplyRecommendation(recommendation.action)} className="block w-full rounded bg-cyan-400 px-2 py-2 text-left text-xs font-semibold text-slate-900">{recommendation.label}</button>
        ))}
      </div>

      {score.violations.length > 0 && <p className="mt-3 rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">Watch out: {score.violations[0]}</p>}
    </aside>
  );
}
