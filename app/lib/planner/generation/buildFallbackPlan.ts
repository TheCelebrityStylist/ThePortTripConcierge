import type { PlanOutput } from "../types";

export function buildFallbackPlan(output: PlanOutput, minutesBehind = 30) {
  const optionalStops = output.plan.blocks.filter((block) => block.type === "stop" && !block.lock).slice(-2);
  return `If ${minutesBehind} minutes behind, cut ${optionalStops.map((s) => s.title).join(" then ")} and return via fastest licensed corridor.`;
}
