import type { PlanOutput } from "@/app/lib/planner/types";

export default function PlanQualityPanel({ output, onApplyRecommendation }: { output: PlanOutput; onApplyRecommendation: (action: PlanOutput["recommendations"][number]["action"]) => void }) {
  const score = output.score;

  return (
    <aside className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
      <p className="font-semibold">Plan Quality</p>
      <p className="mt-1 text-2xl font-bold text-cyan-300">{score.totalScore}</p>
      <ul className="mt-2 space-y-1 text-slate-300">
        <li>Buffer health: {score.bufferHealth}</li>
        <li>Distance risk: {score.distanceRisk}</li>
        <li>Transfer count risk: {score.transferCountRisk}</li>
        <li>Crowd overlap risk: {score.crowdOverlapRisk}</li>
        <li>Tender friction risk: {score.tenderFrictionRisk}</li>
      </ul>

      <p className="mt-3 font-medium">What I assumed</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-slate-300">
        {output.plan.assumptions.slice(0, 4).map((line) => <li key={line}>{line}</li>)}
      </ul>

      <p className="mt-3 font-medium">Top 3 recommendations</p>
      <div className="mt-1 space-y-2">
        {output.recommendations.slice(0, 3).map((recommendation) => (
          <button key={recommendation.action} onClick={() => onApplyRecommendation(recommendation.action)} className="block w-full rounded bg-cyan-400 px-2 py-2 text-left text-xs font-semibold text-slate-900">{recommendation.label}</button>
        ))}
      </div>

      {score.violations.length > 0 && <p className="mt-3 rounded bg-amber-500/20 px-2 py-1 text-xs text-amber-200">{score.violations[0]}</p>}
    </aside>
  );
}
