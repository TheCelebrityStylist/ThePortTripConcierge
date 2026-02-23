export type InterestTag = "food" | "culture" | "views" | "shopping" | "beach" | "history" | "nightlife" | "family";
export type WalkingLevel = "minimal" | "moderate" | "active";
export type PaceLevel = "chill" | "normal" | "intense";
export type RiskTolerance = "conservative" | "balanced" | "aggressive";
export type PlanMode = "conservative" | "balanced" | "aggressive" | "weather-safe" | "mobility-easy";

export type Corridor = {
  name: string;
  distanceKmRange: [number, number];
  timeRangeMin: [number, number];
  notes: string;
};

export type TransportProfile = {
  mode: "walk" | "taxi" | "metro" | "bus" | "tram" | "ferry";
  reliabilityRank: number;
  typicalTimeMin: [number, number];
  costRangeEUR: [number, number];
  notes: string;
};

export type ClusterStop = {
  id: string;
  name: string;
  cluster: string;
  tags: InterestTag[];
  typicalDurationMin: [number, number];
  costRangeEUR: [number, number];
  distanceFromCorridorKm: number;
  bestWindow: string;
  watchOut: string;
};

export type Port = {
  slug: string;
  displayName: string;
  country: string;
  region: "Europe" | "Caribbean";
  dockingMode: "dock" | "tender";
  defaultTimeWindows: { gangwayOpen: string; lastOutboundCutoff: string };
  typicalTransitRisks: string[];
  corridors: Corridor[];
  transportProfiles: TransportProfile[];
  peakCrowdWindows: string[];
  trafficWindows: string[];
  returnSafeRules: { hardRules: string[]; triggers: string[] };
  attractionClusters: ClusterStop[];
  weatherFallbacks: string[];
  scamNotes: string[];
};

export type PlanInput = {
  portSlug: string;
  onboardTime: string;
  allAboardTime: string;
  mustReturnBufferMin: number;
  walkingLevel: WalkingLevel;
  pace: PaceLevel;
  mode: PlanMode;
  interests: InterestTag[];
  budgetSensitivity: "low" | "medium" | "high";
  mustDoStops: string[];
  riskTolerance: RiskTolerance;
  avoidCrowds: boolean;
};

export type PlanBlock = {
  id: string;
  title: string;
  type: "stop" | "transfer" | "buffer";
  startTime: string;
  endTime: string;
  durationMin: number;
  costEUR: number;
  transitMode: string;
  whyThisHere: string;
  guidance: string;
  runningLateDecision: string;
  lock: boolean;
};

export type ScoreCard = {
  bufferHealth: number;
  distanceRisk: number;
  transferCountRisk: number;
  crowdOverlapRisk: number;
  tenderFrictionRisk: number;
  totalScore: number;
  violations: string[];
};

export type PlanOutput = {
  plan: { input: PlanInput; blocks: PlanBlock[]; assumptions: string[] };
  score: ScoreCard;
  recommendations: Array<{ label: string; action: "trim-far-stop" | "swap-transit" | "move-lunch-earlier" | "balanced-loop" }>;
  narrative: string;
};
