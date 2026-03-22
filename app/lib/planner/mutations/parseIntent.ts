import type { PlannerIntent } from "../planMutations";

const rules: Array<{ intent: PlannerIntent; re: RegExp }> = [
  { intent: "reduce-walking", re: /reduce walking|walk less|mobility|less walking/i },
  { intent: "make-cheaper", re: /cheaper|budget|save money|lower cost/i },
  { intent: "shorten-day", re: /relaxed|simplify|less rushed|shorter day/i },
  { intent: "make-safer", re: /ship-safe|protect return|return corridor|safer/i },
  { intent: "add-food-stop", re: /add food|food stop|lunch|tapas/i },
  { intent: "add-signature-highlight", re: /wow|signature|views|culture|shopping|more local/i },
  { intent: "weather-safe", re: /weather-safe|rain|wind|indoor/i },
  { intent: "family-friendly", re: /family-friendly|kids|stroller/i },
  { intent: "running-late", re: /(10|20|30|45)\s*minutes? behind|running late|recovery mode/i },
  { intent: "weakest-part", re: /what should i cut first|weakest|fragile/i },
];

export function parseIntent(message: string): { intent: PlannerIntent | null; confidence: number } {
  for (const rule of rules) {
    if (rule.re.test(message)) return { intent: rule.intent, confidence: 0.9 };
  }
  return { intent: null, confidence: 0.2 };
}
