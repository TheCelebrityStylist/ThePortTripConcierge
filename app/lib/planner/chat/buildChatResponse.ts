import type { PlannerIntent } from "../planMutations";
import type { PlanningContext } from "../context/buildPlanningContext";

export function buildChatResponse(input: {
  intent: PlannerIntent;
  context: PlanningContext;
  changes: string[];
  changedBlockIds: string[];
  scoreDelta: number;
}) {
  const local = input.context.localContext;
  const liveLine = input.context.liveContext.highlights[0] ?? local.practicalNotes[0] ?? "Local port intelligence applied.";
  return {
    summary: `Updated your day for ${input.intent.replace(/-/g, " ")} (${input.scoreDelta >= 0 ? "+" : ""}${input.scoreDelta} score).`,
    rationale: [
      `Port-aware: ${local.portName} corridors ${local.corridors.slice(0, 2).join(" / ") || "near-port"}.`,
      `Live signal: ${liveLine}`,
      ...input.changes,
    ].slice(0, 4),
    applyNow: [
      { label: "Keep ship-safe", intent: "make-safer" as PlannerIntent },
      { label: "Make easier", intent: "reduce-walking" as PlannerIntent },
      { label: "Make cheaper", intent: "make-cheaper" as PlannerIntent },
    ],
    diffLabel: input.changedBlockIds.length ? `Changed stops: ${input.changedBlockIds.join(", ")}` : "No stop delta detected.",
  };
}
