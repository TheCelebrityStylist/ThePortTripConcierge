import type { PlanningContext } from "../context/buildPlanningContext";

export function buildPremiumConciergeBrief(context: PlanningContext) {
  const mustNotMiss = context.localContext.clusters[0] ?? context.localContext.portName;
  const risk = context.liveContext.warnings[0] ?? context.localContext.constraints[0] ?? "Midday transfer compression";
  const liveNote = context.liveContext.highlights[0] ?? context.localContext.practicalNotes[0] ?? "Keep return corridor protected.";
  return {
    vibe: `${context.localContext.portName} tuned for ${context.preferences.interests?.slice(0, 2).join(" + ") || "balanced cruising"}.`,
    mustNotMiss,
    risk,
    fallbackLoop: context.localContext.fallbackLoops[0] ?? `${context.localContext.portName} waterfront loop`,
    liveNote,
  };
}
