import type { PlanOutput } from "./types";
import type { ResolvedPortIntelligence } from "./resolvePortIntelligence";

export function buildStopNarratives(output: PlanOutput, intelligence: ResolvedPortIntelligence): PlanOutput {
  const attractionSet = new Set(intelligence.attractionNames.map((item) => item.toLowerCase()));
  const blocks = output.plan.blocks.map((block, index) => {
    if (block.type !== "stop") return block;
    const matchedAttraction = intelligence.attractionNames.find((name) => block.title.toLowerCase().includes(name.toLowerCase()) || attractionSet.has(name.toLowerCase()));
    const explicitTitle = matchedAttraction ?? intelligence.anchorClusters[index % Math.max(1, intelligence.anchorClusters.length)] ?? block.title;
    const nextLink = output.plan.blocks.slice(index + 1).find((item) => item.type === "transfer")?.title ?? "protected return corridor";
    return {
      ...block,
      title: explicitTitle,
      whyThisHere: `Fits ${intelligence.strategy.replace(/-/g, " ")} strategy with user pace/walking constraints and current port realities.`,
      guidance: `At ${explicitTitle}, focus on one high-value loop. Next transfer: ${nextLink}. Try local option: ${intelligence.localFood[0] ?? intelligence.quickSnackNearPort ?? "near-port snack"}.`,
      runningLateDecision: `If behind schedule, cut ${intelligence.supportingClusters.at(-1) ?? "outer optional stop"} and keep ${intelligence.signatureHighlight}.`,
    };
  });

  return {
    ...output,
    plan: {
      ...output.plan,
      blocks,
      assumptions: [...output.plan.assumptions, `Hidden gem option: ${intelligence.hiddenGem ?? intelligence.nearPortFallbackLoop}.`],
    },
  };
}
