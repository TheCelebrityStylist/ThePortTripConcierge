import type { PlannerIntent } from "./planMutations";

export type ChatIntentResult = {
  intent: PlannerIntent | null;
  confidence: number;
  quickActions: PlannerIntent[];
};

const intentMap: Array<{ intent: PlannerIntent; terms: string[] }> = [
  { intent: "reduce-walking", terms: ["less walking", "reduce walking", "walk less", "mobility"] },
  { intent: "make-safer", terms: ["safer", "ship-safe", "return safe", "safer route"] },
  { intent: "add-signature-highlight", terms: ["signature", "iconic", "highlight"] },
  { intent: "make-cheaper", terms: ["cheaper", "budget", "save"] },
  { intent: "add-food-stop", terms: ["food", "lunch", "tapas", "meal"] },
  { intent: "shorten-day", terms: ["shorter", "too long", "compress"] },
  { intent: "weather-safe", terms: ["weather", "rain", "wind"] },
  { intent: "family-friendly", terms: ["family", "kids", "stroller"] },
  { intent: "romantic", terms: ["romantic", "couple"] },
  { intent: "solo-traveler", terms: ["solo", "alone"] },
  { intent: "running-late", terms: ["running late", "behind", "30 minutes behind", "late"] },
  { intent: "weakest-part", terms: ["weakest", "fragile", "risk"] },
];

export function detectChatIntent(message: string): ChatIntentResult {
  const text = message.toLowerCase();
  for (const entry of intentMap) {
    if (entry.terms.some((term) => text.includes(term))) {
      return {
        intent: entry.intent,
        confidence: 0.86,
        quickActions: [entry.intent, "make-safer", "reduce-walking", "running-late"].filter((item, index, arr) => arr.indexOf(item) === index) as PlannerIntent[],
      };
    }
  }
  return { intent: null, confidence: 0.22, quickActions: ["make-safer", "reduce-walking", "add-signature-highlight"] };
}
