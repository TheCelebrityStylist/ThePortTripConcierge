import type { PlannerIntent } from "../planMutations";

const intentRules: Array<{ intent: PlannerIntent; re: RegExp }> = [
  { intent: "reduce-walking", re: /reduce walking|walk less|less walking|mobility/i },
  { intent: "make-cheaper", re: /cheaper|budget|save money/i },
  { intent: "shorten-day", re: /relaxed|shorter|simplify|less rushed/i },
  { intent: "make-safer", re: /ship-safe|safe|return/i },
  { intent: "add-food-stop", re: /add food|lunch|tapas|meal/i },
  { intent: "add-signature-highlight", re: /signature|highlight|views|culture|shopping/i },
  { intent: "weather-safe", re: /weather|rain|wind/i },
  { intent: "family-friendly", re: /family|kids/i },
  { intent: "running-late", re: /(10|20|30|45)\s*minutes? behind|running late|behind schedule/i },
  { intent: "weakest-part", re: /weakest|fragile|what should i cut/i },
];

export function parseIntent(message: string): { intent: PlannerIntent | null; confidence: number } {
  for (const rule of intentRules) {
    if (rule.re.test(message)) return { intent: rule.intent, confidence: 0.88 };
  }
  return { intent: null, confidence: 0.2 };
}
