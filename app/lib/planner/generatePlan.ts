import { generatePortDayPlan } from "./engine";
import { buildPortIntelligence } from "./planHeuristics";
import { buildPlanNarrative } from "./planNarrative";
import type { PlanInput, PlanOutput } from "./types";

const enrichStopText = (output: PlanOutput, intelligence = buildPortIntelligence(output.plan.input)) => {
  const nextBlocks = output.plan.blocks.map((block, index) => {
    if (block.type !== "stop") return block;
    const nextTransfer = output.plan.blocks.slice(index + 1).find((item) => item.type === "transfer");
    const supporting = intelligence.supportingClusters[index % Math.max(1, intelligence.supportingClusters.length)] ?? intelligence.nearPortFallbackLoop;
    return {
      ...block,
      title: block.title.includes("Old Quarter") ? intelligence.anchorClusters[0] : block.title.includes("Market") ? intelligence.foodAnchor : block.title,
      whyThisHere: `Strategic anchor: ${supporting}. Built for ${intelligence.strategy.replace(/-/g, " ")} pacing.`,
      guidance: `${block.guidance} Next leg: ${nextTransfer?.title ?? "protected return corridor"}.`,
      runningLateDecision: `If +20m behind, cut ${intelligence.supportingClusters.at(-1) ?? "outer loop"} and keep ${intelligence.signatureHighlight}.`,
    };
  });

  return {
    ...output,
    plan: {
      ...output.plan,
      blocks: nextBlocks,
      assumptions: [...output.plan.assumptions, ...intelligence.returnSafeRules.slice(0, 1), `Bottleneck watch: ${intelligence.bottleneckNotes[0] ?? "traffic variance"}`],
    },
    narrative: buildPlanNarrative(output, intelligence),
  } satisfies PlanOutput;
};

export function generateSmartPlan(input: PlanInput): PlanOutput {
  const base = generatePortDayPlan(input);
  return enrichStopText(base);
}
