import { portsRegistry } from "@/app/lib/ports";
import type { PlanInput, PlanMode } from "./types";

export type PlanStrategy = "safe-loop" | "culture-heavy" | "food-first" | "low-walking" | "signature-highlight";

export type PortIntelligence = {
  strategy: PlanStrategy;
  anchorClusters: string[];
  supportingClusters: string[];
  nearPortFallbackLoop: string;
  transportCorridors: string[];
  signatureHighlight: string;
  foodAnchor: string;
  weatherSafeAlternative: string;
  bottleneckNotes: string[];
  returnSafeRules: string[];
};

const chooseStrategy = (input: PlanInput): PlanStrategy => {
  if (input.walkingLevel === "minimal" || input.mode === "mobility-easy") return "low-walking";
  if (input.mode === "conservative" || input.riskTolerance === "conservative") return "safe-loop";
  if (input.interests.includes("food")) return "food-first";
  if (input.interests.includes("culture") || input.interests.includes("history")) return "culture-heavy";
  return "signature-highlight";
};

const titleMatch = (candidates: Array<string | undefined>, fallback: string) => candidates.find((item): item is string => Boolean(item)) ?? fallback;

export function buildPortIntelligence(input: PlanInput): PortIntelligence {
  const port = portsRegistry[input.portSlug] ?? portsRegistry.barcelona;
  const strategy = chooseStrategy(input);
  const byTag = (tag: string) => port.attractionClusters.filter((cluster) => cluster.tags.includes(tag as never));

  const culture = byTag("culture")[0]?.name;
  const food = byTag("food")[0]?.name;
  const view = byTag("views")[0]?.name;
  const family = byTag("family")[0]?.name;
  const fallback = port.attractionClusters.find((cluster) => /fallback|near-port/i.test(cluster.name))?.name ?? `${port.name} Near-Port Fallback Loop`;

  const anchorClusters =
    strategy === "food-first"
      ? [titleMatch([food, culture], `${port.name} Old Quarter`), titleMatch([culture, view], `${port.name} Waterfront Promenade`)]
      : strategy === "culture-heavy"
      ? [titleMatch([culture, view], `${port.name} Old Quarter`), titleMatch([view, food], `${port.name} Museum District`)]
      : strategy === "low-walking"
      ? [titleMatch([family, food], `${port.name} Port Corridor`), titleMatch([food, culture], `${port.name} City Core`)]
      : [titleMatch([culture, food], `${port.name} City Core`), titleMatch([view, culture], `${port.name} Viewpoint Corridor`)];

  const supportingClusters = port.attractionClusters
    .map((cluster) => cluster.name)
    .filter((name) => !anchorClusters.includes(name))
    .slice(0, 3);

  const signatureHighlight = titleMatch([view, culture, anchorClusters[0]], `${port.name} Signature Corridor`);
  const foodAnchor = titleMatch([food, anchorClusters.find((name) => /market|food/i.test(name))], `${port.name} Market + Food Lanes`);
  const weatherSafeAlternative = port.weatherFallbacks[0] ?? `${port.name} maritime museum`;

  const modeToCorridor = (mode: string) =>
    mode === "metro" ? `Metro line to ${port.corridorZones[1]?.name ?? "city core"}` : mode === "taxi" ? `Licensed taxi corridor to ${port.corridorZones[1]?.name ?? "city core"}` : `Walkable corridor via ${port.corridorZones[0]?.name ?? "port corridor"}`;

  const transportCorridors = port.transportProfiles.slice(0, 3).map((transport) => modeToCorridor(transport.mode));

  return {
    strategy,
    anchorClusters,
    supportingClusters,
    nearPortFallbackLoop: fallback,
    transportCorridors,
    signatureHighlight,
    foodAnchor,
    weatherSafeAlternative,
    bottleneckNotes: [...port.typicalTransitRisks.slice(0, 2), ...port.scamPatterns.slice(0, 1)],
    returnSafeRules: port.safeReturnRules.slice(0, 3),
  };
}

export const modeToStrategyLabel = (mode: PlanMode, strategy: PlanStrategy) => `${mode.replace(/-/g, " ")} · ${strategy.replace(/-/g, " ")}`;
