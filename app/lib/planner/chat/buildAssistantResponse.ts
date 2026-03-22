import type { PlannerIntent } from "../planMutations";

export function buildAssistantResponse(input: { intent: PlannerIntent; changes: string[]; scoreDelta: number; changedStopIds: string[] }) {
  const delta = input.scoreDelta;
  const scoreLabel = delta === 0 ? "score unchanged" : delta > 0 ? `score +${delta}` : `score ${delta}`;
  return {
    summary: `Applied ${input.intent.replace(/-/g, " ")} with ${scoreLabel}.`,
    why: input.changes,
    applyNow: [
      { label: "Keep me ship-safe", intent: "make-safer" as PlannerIntent },
      { label: "Reduce walking", intent: "reduce-walking" as PlannerIntent },
    ],
    fallback: input.changedStopIds.length ? `Updated stops: ${input.changedStopIds.join(", ")}` : "No stop-level delta detected.",
  };
}
