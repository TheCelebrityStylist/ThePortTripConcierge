
type Metrics = {
  returnSafeScore: number;
  totalCost: number;
  totalWalk: number;
  transfersCount: number;
  farthestDistanceEstimate: number;
  riskFlags: string[];
  queueRisk: number;
  transitComplexity: number;
  bufferMinutesRemaining: number;
};

export default function PlanQualityPanel({ metrics }: { metrics: Metrics }) {
  return (
    <aside className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
      <p className="font-semibold">Plan Quality</p>
      <ul className="mt-2 space-y-1 text-slate-300">
        <li>Return-safe score: {metrics.returnSafeScore}</li>
        <li>Budget: €{metrics.totalCost}</li>
        <li>Walking load: {metrics.totalWalk} min</li>
        <li>Queue risk: {metrics.queueRisk}</li>
        <li>Transit complexity: {metrics.transitComplexity}</li>
        <li>Buffer remaining: {metrics.bufferMinutesRemaining} min</li>
      </ul>
      {metrics.riskFlags.length > 0 && <p className="mt-2 text-amber-300">Risks: {metrics.riskFlags.join(", ")}</p>}
    </aside>
  );
}