import type { PlannerChatContext } from "./chatContextBuilder";
import type { PlannerIntent } from "./planMutations";

export type AssistantStructuredResponse = {
  summary: string;
  why: string[];
  applyNow: Array<{ label: string; intent: PlannerIntent }>;
  fallback?: string;
};

const intentLabel = (intent: PlannerIntent) =>
  ({
    "reduce-walking": "Reduce walking",
    "make-safer": "Keep me ship-safe",
    "add-signature-highlight": "Add signature highlight",
    "make-cheaper": "Make it cheaper",
    "add-food-stop": "Add food stop",
    "shorten-day": "Shorten overall day",
    "weather-safe": "Weather-safe version",
    "family-friendly": "Family-friendly mode",
    romantic: "Romantic mode",
    "solo-traveler": "Solo traveler mode",
    "running-late": "I’m running late",
    "weakest-part": "Show weakest part",
  }[intent]);

export function formatChatResponse({ context, intent, confidence }: { context: PlannerChatContext; intent: PlannerIntent | null; confidence: number }): AssistantStructuredResponse {
  const port = context.selectedDay?.portName ?? context.selectedPlan?.plan.input.portName ?? context.selectedPlan?.plan.input.portSlug ?? "this port";
  const weakest = context.weakestPart;

  if (!intent) {
    return {
      summary: `I can tune ${port} right now. Tell me your priority (walking, safety, budget, highlight, or recovery mode).`,
      why: [
        `Current fragile leg: ${weakest}`,
        `Locked stops stay protected: ${context.lockedStops[0] ?? "none yet"}`,
      ],
      applyNow: (["make-safer", "reduce-walking", "add-signature-highlight"] as PlannerIntent[]).map((item) => ({ label: intentLabel(item), intent: item })),
      fallback: "If you’re behind by 20–30 minutes, run Recovery Mode to keep one great highlight and preserve return-safe timing.",
    };
  }

  const summaryByIntent: Record<PlannerIntent, string> = {
    "reduce-walking": `I’ll tighten ${port} into a lower-walking loop while preserving one high-value stop.`,
    "make-safer": `I’ll harden return safety for ${port} by trimming the riskiest late leg.`,
    "add-signature-highlight": `I’ll swap in a stronger signature moment without breaking return-safe timing.`,
    "make-cheaper": `I’ll reduce spend on transfers and optional dwell while keeping the core experience.`,
    "add-food-stop": `I’ll inject a real food anchor into the strongest point of the day flow.`,
    "shorten-day": `I’ll compress optional dwell times so the day feels lighter and less rushed.`,
    "weather-safe": `I’ll pivot to indoor/weather-safe anchors and preserve the best parts of the route.`,
    "family-friendly": `I’ll smooth pacing and route friction for a family-friendly day structure.`,
    romantic: `I’ll tune the sequence toward relaxed scenic moments and smoother transitions.`,
    "solo-traveler": `I’ll keep it efficient, independent, and low-friction for solo movement.`,
    "running-late": `Recovery mode: I’ll keep your must-not-miss and cut the lowest-value segment first.`,
    "weakest-part": `The weakest section is currently ${weakest}; I can patch it immediately.`,
  };

  return {
    summary: `${summaryByIntent[intent]} (confidence ${Math.round(confidence * 100)}%)`,
    why: [
      `Context: ${context.scope === "day" ? "This Day" : "Whole Cruise"}`,
      `Weakest part now: ${weakest}`,
      `Return-safe rule in play: ${context.intelligenceSummary?.returnSafeRules[0] ?? "hold protected return corridor"}`,
    ],
    applyNow: ([intent, "make-safer", "running-late"] as PlannerIntent[]).filter((item, index, arr) => arr.indexOf(item) === index).map((item) => ({ label: intentLabel(item), intent: item })),
    fallback: "If delay stacks after lunch, cut the outer-most optional stop and board via the fastest licensed corridor.",
  };
}
