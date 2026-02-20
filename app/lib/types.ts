export type StopType = "attraction" | "food" | "transport" | "buffer";
export type StopSource = "chat" | "manual";
export type TripMode = "balanced" | "aggressive" | "relaxed";

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
  location: { name: string; lat?: number; lng?: number };
  costEstimate: number;
  notes: string;
  source: StopSource;
  priority: 1 | 2 | 3;
  flexibleMin: number;
  optional?: boolean;
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
  transportReliability: { walk: number; taxi: number; metro: number; bus: number };
};

export type DelayScenario = "tender20" | "traffic25" | "queue30" | "lost15";

export type PlannerSuggestion = {
  title: string;
  durationMin: number;
  costEstimate: number;
  location: string;
  type: StopType;
  tags?: StopTags;
  priority?: 1 | 2 | 3;
  notes?: string;
};
