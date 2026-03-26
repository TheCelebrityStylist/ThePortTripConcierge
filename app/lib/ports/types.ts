export type PortRegion = "Europe" | "Caribbean" | "Alaska" | "Asia";

export type PortProfile = {
  slug: string;
  name: string;
  country: string;
  region: PortRegion;
  dockingModeDefault: "dock" | "tender";
  tenderRiskScore: number;
  defaultTimeWindows: { gangwayOpen: string; lastOutboundCutoff: string };
  typicalTransitRisks: string[];
  peakCrowdWindows: string[];
  peakTrafficWindows: string[];
  safeReturnRules: string[];
  corridorZones: Array<{ name: string; typicalMinutes: [number, number]; distanceKm: [number, number] }>;
  attractionClusters: Array<{
    name: string;
    tags: Array<"food" | "culture" | "views" | "shopping" | "beach" | "history" | "nightlife" | "family">;
    typicalDuration: [number, number];
    costRange: [number, number];
    distanceFromPortKm: number;
  }>;
  transportProfiles: Array<{ mode: "walk" | "taxi" | "metro" | "bus" | "tram" | "ferry"; reliability: number; timeMin: [number, number]; notes: string }>;
  weatherFallbacks: string[];
  scamPatterns: string[];
};
