import type { PlanOutput } from "../types";

export function buildDiff(before: PlanOutput, after: PlanOutput) {
  const beforeById = new Map(before.plan.blocks.map((block) => [block.id, block]));
  const changed = after.plan.blocks
    .filter((block) => {
      const prev = beforeById.get(block.id);
      return !prev || prev.title !== block.title || prev.startTime !== block.startTime || prev.costEUR !== block.costEUR || prev.durationMin !== block.durationMin;
    })
    .map((block) => block.id);

  return {
    changedBlockIds: changed,
    scoreDelta: after.score.totalScore - before.score.totalScore,
    costDelta: after.plan.blocks.reduce((s, b) => s + b.costEUR, 0) - before.plan.blocks.reduce((s, b) => s + b.costEUR, 0),
  };
}
