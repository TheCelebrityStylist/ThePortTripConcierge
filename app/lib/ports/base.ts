import type { PortProfile, PortRegion } from "./types";

export type PortSeed = {
  slug: string;
  name: string;
  country: string;
  region: PortRegion;
  dockingModeDefault: "dock" | "tender";
};

export const buildPort = (seed: PortSeed): PortProfile => {
  const tender = seed.dockingModeDefault === "tender";
  return {
    slug: seed.slug,
    name: seed.name,
    country: seed.country,
    region: seed.region,
    dockingModeDefault: seed.dockingModeDefault,
    tenderRiskScore: tender ? 72 : 34,
    defaultTimeWindows: {
      gangwayOpen: tender ? "08:30" : "08:00",
      lastOutboundCutoff: tender ? "13:45" : "14:30",
    },
    typicalTransitRisks: tender
      ? ["Tender queue variance 20-45m", "Queue compression after lunch", "Weather-induced tender holds"]
      : ["Taxi rank surges at 09:00", "Traffic wave after 15:00", "Construction detours on central arteries"],
    peakCrowdWindows: ["10:30-12:30", "14:30-16:00"],
    peakTrafficWindows: ["09:00-10:00", "15:00-16:30"],
    safeReturnRules: [
      "Keep a protected terminal return block of at least 45 minutes.",
      `Avoid new far-leg outbound moves after ${tender ? "13:45" : "14:30"}.`,
      "If two delays stack, collapse to near-port fallback immediately.",
    ],
    corridorZones: [
      { name: `${seed.name} Port Corridor`, typicalMinutes: [8, 18], distanceKm: [0.3, 1.1] },
      { name: `${seed.name} City Core`, typicalMinutes: [20, 45], distanceKm: [1.0, 3.4] },
      { name: `${seed.name} Outer Scenic Loop`, typicalMinutes: [35, 80], distanceKm: [3.0, 8.0] },
    ],
    attractionClusters: [
      { name: `${seed.name} Old Quarter`, tags: ["culture", "history"], typicalDuration: [50, 90], costRange: [0, 20], distanceFromPortKm: 1.5 },
      { name: `${seed.name} Waterfront Promenade`, tags: ["views", "family"], typicalDuration: [35, 70], costRange: [0, 10], distanceFromPortKm: 1.1 },
      { name: `${seed.name} Market + Food Lanes`, tags: ["food", "shopping"], typicalDuration: [45, 80], costRange: [12, 35], distanceFromPortKm: 1.8 },
      { name: `${seed.name} Museum District`, tags: ["culture", "family"], typicalDuration: [45, 75], costRange: [8, 25], distanceFromPortKm: 2.3 },
      { name: `${seed.name} Viewpoint Corridor`, tags: ["views", "history"], typicalDuration: [40, 65], costRange: [0, 12], distanceFromPortKm: 2.9 },
      { name: `${seed.name} Near-Port Fallback Loop`, tags: ["family", "food"], typicalDuration: [30, 55], costRange: [5, 18], distanceFromPortKm: 0.5 },
      { name: `${seed.name} Local Retail Arc`, tags: ["shopping", "culture"], typicalDuration: [30, 60], costRange: [6, 30], distanceFromPortKm: 1.6 },
      { name: `${seed.name} Beach / Coastal Block`, tags: ["beach", "views"], typicalDuration: [45, 80], costRange: [0, 18], distanceFromPortKm: 3.5 },
    ],
    transportProfiles: [
      { mode: "walk", reliability: 1, timeMin: [8, 35], notes: "Best for corridor clusters." },
      { mode: "taxi", reliability: 2, timeMin: [10, 30], notes: "Reliable when using official stands." },
      { mode: "metro", reliability: 3, timeMin: [15, 40], notes: "Fast where coverage exists." },
      { mode: "bus", reliability: 4, timeMin: [20, 55], notes: "Delay variance at peaks." },
      { mode: "ferry", reliability: tender ? 2 : 5, timeMin: [12, 35], notes: "Critical for tender ports." },
      { mode: "tram", reliability: 3, timeMin: [14, 38], notes: "Useful in selected port cities." },
    ],
    weatherFallbacks: [`${seed.name} covered market`, `${seed.name} maritime museum`, `${seed.name} indoor tasting hall`],
    scamPatterns: ["Decline unsolicited taxi guides outside controlled ranks.", "Confirm prices before ordering in high-footfall strips."],
  };
};
