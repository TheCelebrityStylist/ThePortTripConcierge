export type StopType = "attraction" | "food" | "transport" | "buffer";
export type StopSource = "chat" | "manual";

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
};

export type ItineraryPlan = {
  id: string;
  portSlug: string;
  date: string;
  allAboardTime: string;
  mustReturnByTime: string;
  riskLevel: "low" | "amber" | "high";
  stops: ItineraryStop[];
  assumptions: string[];
  shipExcursionBenchmark: number;
};

export type DelayScenario = "tender20" | "taxi15" | "queue25";

export type PlannerSuggestion = {
  title: string;
  durationMin: number;
  costEstimate: number;
  location: string;
  type: StopType;
  notes?: string;
};
