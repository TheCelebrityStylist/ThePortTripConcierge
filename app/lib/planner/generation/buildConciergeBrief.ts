import type { PlanningContext } from "../context/buildPlanningContext";

export function buildPremiumConciergeBrief(context: PlanningContext) {
  const mustNotMiss = context.localContext.clusters[0] ?? context.localContext.portName;
  const risk = context.liveContext.warnings[0] ?? context.localContext.constraints[0] ?? "Midday transfer compression";
  return {
    vibe: `${context.localContext.portName} day tuned for ${context.selectedPlan?.plan.input.interests.slice(0, 2).join(" + ") || "cruise comfort"}.`,
    mustNotMiss,
    risk,
    fallbackLoop: context.localContext.fallbackLoops[0] ?? `${context.localContext.portName} waterfront loop`,
  };
}
