import { modeToStrategyLabel, type PortIntelligence } from "./planHeuristics";
import type { PlanOutput, PortDay } from "./types";

export type ConciergeBrief = {
  howTodayFeels: string;
  mustNotMiss: string;
  biggestRisk: string;
  fallbackLoop: string;
  confidenceScore: number;
  fragileLeg: string;
  cutFirstIfBehind: string;
};

export function buildPlanNarrative(output: PlanOutput, intelligence: PortIntelligence) {
  const intro = `Strategy: ${modeToStrategyLabel(output.plan.input.mode, intelligence.strategy)}.`;
  const anchor = intelligence.anchorClusters[0] ?? output.plan.blocks.find((block) => block.type === "stop")?.title ?? "port core";
  const returnRule = intelligence.returnSafeRules[0] ?? "Protect return corridor before all aboard.";
  return `${intro} Start with ${anchor}, protect a clean midpoint transfer, then lock in a protected return corridor. ${returnRule}`;
}

export function buildConciergeBrief(output: PlanOutput, intelligence: PortIntelligence, selectedDay?: PortDay): ConciergeBrief {
  const stops = output.plan.blocks.filter((block) => block.type === "stop");
  const weakest = output.score.violations[0] ?? `Most fragile leg is ${output.plan.blocks.find((block) => block.type === "transfer")?.title ?? "the final transfer"}.`;
  const cutFirst = [...stops].reverse().find((block) => !block.lock)?.title ?? intelligence.supportingClusters[0] ?? "outer scenic loop";

  return {
    howTodayFeels: `${selectedDay?.portName ?? output.plan.input.portSlug}: calm pace with ${stops.length} anchor stops and return-safe timing.`,
    mustNotMiss: intelligence.signatureHighlight,
    biggestRisk: weakest,
    fallbackLoop: intelligence.nearPortFallbackLoop,
    confidenceScore: Math.max(35, Math.min(99, output.score.totalScore)),
    fragileLeg: output.plan.blocks.find((block) => block.type === "transfer")?.title ?? "Outbound transfer to city core",
    cutFirstIfBehind: cutFirst,
  };
}
