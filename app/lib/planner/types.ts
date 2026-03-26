import type { PortProfile } from "@/app/lib/ports/types";

export type InterestTag = "food" | "culture" | "views" | "shopping" | "beach" | "history" | "nightlife" | "family";
export type WalkingLevel = "minimal" | "moderate" | "active";
export type PaceLevel = "chill" | "normal" | "intense";
export type RiskTolerance = "conservative" | "balanced" | "aggressive";
export type PlanMode = "conservative" | "balanced" | "aggressive" | "weather-safe" | "mobility-easy";

export type PlanInput = {
  portSlug: string;
  portName?: string;
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

export type PortDay = {
  id: string;
  date: string;
  portSlug: string;
  portName?: string;
  arrivalTime: string;
  onboardTime: string;
  allAboardTime: string;
  dockMode: "dock" | "tender";
  walkingPreference: WalkingLevel;
  pace: PaceLevel;
  riskTolerance: RiskTolerance;
  interests: InterestTag[];
  locked: boolean;
  status: "not-planned" | "draft" | "optimized" | "locked";
  score?: number;
};

export type Cruise = {
  id: string;
  cruiseName: string;
  cruiseLine?: string;
  ship?: string;
  startDate: string;
  durationDays: number;
  timezone: string;
  itinerary: PortDay[];
};

export type CruiseDashboard = {
  energyPacingScore: number;
  riskConcentrationDayId?: string;
  budgetEstimateTotal: number;
  excursionBenchmarkTotal: number;
  savingsEstimateTotal: number;
};

export type FeatureTier = "free" | "trip-pass" | "pro";

export type FeatureGateKey = "fullCruiseMode" | "generateAll" | "exportBundle" | "simulation" | "offlinePack";

export type CruiseContext = {
  cruise: Cruise;
  selectedDayId?: string;
  plansByDayId: Record<string, PlanOutput>;
  ports: Record<string, PortProfile>;
};
