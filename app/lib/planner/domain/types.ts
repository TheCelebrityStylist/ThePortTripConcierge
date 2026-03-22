export type DayPlan = {
  id: string;
  portSlug: string;
  arrivalTime: string;
  allAboardTime: string;
  pace: "chill" | "normal" | "intense";
  walkingLevel: "minimal" | "moderate" | "active";
  budgetLevel?: "low" | "medium" | "high";
  interests: string[];
  stops: PlanStop[];
  legs: PlanLeg[];
  lockedStopIds: string[];
  mustDoStopIds: string[];
  confidenceScore: number;
  fragility: string;
  fallbackPlan?: string;
};

export type PlanStop = {
  id: string;
  title: string;
  category: "stop" | "food" | "transfer" | "buffer";
  cluster?: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  costEstimate: number;
  walkingIntensity: "low" | "moderate" | "high";
  source: "engine" | "local-db" | "live" | "assistant";
  notes: string;
  whyThisFits: string;
  safeLateInDay?: boolean;
  details?: string;
};

export type PlanLeg = {
  id: string;
  fromStopId: string;
  toStopId: string;
  mode: string;
  durationMin: number;
  costEstimate: number;
  reliability: "high" | "medium" | "low";
  notes: string;
};

export type MutationResult = {
  updatedPlan: DayPlan;
  changes: string[];
  rationale: string;
  changedStopIds: string[];
  beforeAfter: { beforeScore: number; afterScore: number };
};
