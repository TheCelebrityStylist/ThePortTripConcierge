export type PlanMode = "conservative" | "balanced" | "aggressive" | "weather-safe" | "mobility-easy";
export type PlanCategory = "anchor" | "food" | "scenic" | "museum" | "shopping" | "beach" | "transfer" | "buffer";
export type CrowdLevel = "low" | "medium" | "high";

export type StopTemplate = {
  id: string;
  title: string;
  category: Exclude<PlanCategory, "buffer">;
  durationMin: number;
  walkMin: number;
  costEUR: number;
  crowd: CrowdLevel;
  tags: string[];
  indoor?: boolean;
  nearPort?: boolean;
};

export type PortProfile = {
  slug: string;
  name: string;
  tender: boolean;
  peakTrafficWindows: string[];
  transferToCityMin: number;
  anchors: StopTemplate[];
  foodAnchors: StopTemplate[];
  scenicBlocks: StopTemplate[];
  transferBlocks: StopTemplate[];
  fallbackLoop: StopTemplate[];
};

export type PlannedStop = {
  id: string;
  templateId?: string;
  title: string;
  category: PlanCategory;
  startTime: string;
  endTime: string;
  durationMin: number;
  walkMin: number;
  costEUR: number;
  crowd: CrowdLevel;
  notes: string;
  mustDo: boolean;
  locked: boolean;
};

export type PlanPreferences = {
  walkingLevel: "minimal" | "moderate" | "active";
  interests: Array<"food" | "culture" | "views" | "shopping" | "beach">;
  pace: "chill" | "normal" | "intense";
};

export type Plan = {
  portSlug: string;
  onboardTime: string;
  allAboardTime: string;
  targetBufferMin: number;
  mode: PlanMode;
  preferences: PlanPreferences;
  stops: PlannedStop[];
};

export type RiskItem = {
  key: "buffer" | "distance" | "transfers" | "crowd" | "tender";
  label: string;
  score: number;
  why: string;
  fixLabel: string;
  action: "trim-farthest" | "swap-transit" | "move-lunch-earlier" | "balanced-loop";
};

export type RiskBreakdown = {
  total: number;
  items: RiskItem[];
};

export type BriefState = {
  portSlug: string;
  onboardTime: string;
  allAboardTime: string;
  targetBufferMin: number;
  walkingLevel: "minimal" | "moderate" | "active";
  interests: Array<"food" | "culture" | "views" | "shopping" | "beach">;
  pace: "chill" | "normal" | "intense";
  mode: PlanMode;
};
