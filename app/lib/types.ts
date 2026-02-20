export type StopType = "attraction" | "food" | "transport" | "buffer" | "misc";
export type StopSource = "chat" | "manual";
export type TripMode = "balanced" | "aggressive" | "relaxed";
export type WalkingLevel = "low" | "moderate" | "high";

export type StopTags = {
  highQueue?: boolean;
  indoor?: boolean;
  outdoor?: boolean;
  highWalk?: boolean;
  returnCorridor?: boolean;
};

export type ItineraryStop = {
  id: string;
  title: string;
  type: StopType;
  startTime: string;
  endTime: string;
  durationMin: number;
  travelMinToNext: number;
  location: { name: string; lat?: number; lng?: number };
  costEstimate: number;
  notes: string;
  source: StopSource;
  priority: 1 | 2 | 3 | 4 | 5;
  flexibility: "fixed" | "flex";
  optional?: boolean;
  locked?: boolean;
  tags?: StopTags;
};

export type ItineraryPlan = {
  id: string;
  portSlug: string;
  date: string;
  allAboardTime: string;
  mustReturnByTime: string;
  bufferMinutes: number;
  tripMode: TripMode;
  riskLevel: "low" | "amber" | "high";
  riskScore: number;
  stops: ItineraryStop[];
  assumptions: string[];
  shipExcursionBenchmark: number;
  budgetCap: number;
  walkingLevel: WalkingLevel;
  transportReliability: { walk: number; taxi: number; metro: number; bus: number };
};

export type DelayScenario = "tender20" | "traffic25" | "queue30" | "lost15" | "weatherPivot";

export type PlannerSuggestion = {
  title: string;
  why: string;
  durationMin: number;
  estimatedTravelImpact: string;
  costEstimate: number;
  location: string;
  type: StopType;
  tags?: StopTags;
  priority?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
};

export type PortProfileLite = {
  tender: boolean;
  typicalTrafficWindows: string[];
  baselineTransferMin: [number, number];
  reliabilityRanking: Array<"walk" | "taxi" | "metro" | "bus">;
};

export type EngineOutput = {
  scheduledBlocks: ItineraryStop[];
  checkpoints: { label: string; time: string; status: "ok" | "warn" | "late" }[];
  returnSafeScore: number;
  breachReasons: string[];
  cutRecommendations: string[];
  shortenRecommendations: string[];
  scoreDrivers: string[];
  fragileLeg: string;
};
