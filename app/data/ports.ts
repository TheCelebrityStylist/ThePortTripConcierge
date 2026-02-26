import { portsRegistry as sourceRegistry } from "@/app/lib/ports";

export type PortRecord = {
  id: string;
  name: string;
  country: string;
  region: "Mediterranean" | "Northern Europe" | "Caribbean" | "Alaska" | "Asia";
  aliases: string[];
  search: string;
};

const mk = (region: PortRecord["region"], country: string, name: string, aliases: string[] = []): PortRecord => {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return { id, name, country, region, aliases, search: `${name} ${country} ${region} ${aliases.join(" ")}`.toLowerCase() };
};

const buildRegional = (region: PortRecord["region"], country: string, prefix: string, count: number) =>
  Array.from({ length: count }, (_, i) => mk(region, country, `${prefix} ${i + 1}`, [`${prefix}${i + 1}`]));

const seeded: PortRecord[] = [
  mk("Mediterranean", "Spain", "Barcelona", ["BCN"]),
  mk("Mediterranean", "Italy", "Civitavecchia", ["Rome Port"]),
  mk("Mediterranean", "France", "Marseille"),
  mk("Northern Europe", "Denmark", "Copenhagen"),
  mk("Northern Europe", "Norway", "Bergen"),
  mk("Caribbean", "Mexico", "Cozumel"),
  mk("Caribbean", "Bahamas", "Nassau"),
  mk("Alaska", "USA", "Juneau"),
  mk("Alaska", "USA", "Ketchikan"),
  mk("Asia", "Singapore", "Singapore"),
  mk("Asia", "Japan", "Yokohama"),
];

export const ports: PortRecord[] = [
  ...seeded,
  ...buildRegional("Mediterranean", "Italy", "Mediterranean Port", 35),
  ...buildRegional("Northern Europe", "United Kingdom", "Northern Port", 35),
  ...buildRegional("Caribbean", "Dominican Republic", "Caribbean Port", 35),
  ...buildRegional("Alaska", "USA", "Alaska Port", 35),
  ...buildRegional("Asia", "Thailand", "Asia Port", 35),
];

export const portIndex = ports.map((port) => ({ ...port }));

export const plannerPorts = Object.fromEntries(
  Object.values(sourceRegistry).map((port) => [
    port.slug,
    {
      portSlug: port.slug,
      dockType: port.dockingModeDefault,
      typicalTransferToCity: port.transportProfiles.find((transport) => transport.mode === "taxi")?.timeMin[0] ?? 20,
      peakTrafficWindows: port.peakTrafficWindows,
      reliabilityRanking: port.transportProfiles
        .filter((transport) => ["walk", "taxi", "metro", "bus"].includes(transport.mode))
        .sort((a, b) => a.reliability - b.reliability)
        .map((transport) => transport.mode) as Array<"walk" | "taxi" | "metro" | "bus">,
      recommendedClusters: port.attractionClusters.slice(0, 8).map((cluster) => ({
        name: cluster.name,
        minutes: cluster.typicalDuration[0],
        walkingIntensity: cluster.distanceFromPortKm > 2.8 ? "high" : cluster.distanceFromPortKm > 1.6 ? "moderate" : "low",
      })),
    },
  ])
) as Record<string, {
  portSlug: string;
  dockType: "dock" | "tender";
  typicalTransferToCity: number;
  peakTrafficWindows: string[];
  reliabilityRanking: Array<"walk" | "taxi" | "metro" | "bus">;
  recommendedClusters: Array<{ name: string; minutes: number; walkingIntensity: "low" | "moderate" | "high" }>;
}>;
