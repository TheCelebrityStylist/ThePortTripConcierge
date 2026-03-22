import { portIntelligence } from "@/app/data/cruise-intelligence";
import type { PlanInput } from "./types";
import { buildPortIntelligence } from "./planHeuristics";

export type ResolvedPortIntelligence = ReturnType<typeof buildPortIntelligence> & {
  localFood: string[];
  hiddenGem?: string;
  instagramSpot?: string;
  quickSnackNearPort?: string;
  attractionNames: string[];
};

export function resolvePortIntelligence(input: PlanInput): ResolvedPortIntelligence {
  const heuristic = buildPortIntelligence(input);
  const dataset = portIntelligence.find((port) => port.slug === input.portSlug);
  return {
    ...heuristic,
    localFood: dataset?.localFood ?? [],
    hiddenGem: dataset?.hiddenGem,
    instagramSpot: dataset?.instagramSpot,
    quickSnackNearPort: dataset?.quickSnackNearPort,
    attractionNames: dataset?.attractions.map((item) => item.name) ?? heuristic.anchorClusters,
  };
}
