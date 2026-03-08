import { optimizePlan, simulateRisk } from "./engine";
import { buildPortIntelligence } from "./planHeuristics";
import type { PlanOutput } from "./types";

export type PlannerIntent =
  | "reduce-walking"
  | "make-safer"
  | "add-signature-highlight"
  | "make-cheaper"
  | "add-food-stop"
  | "shorten-day"
  | "weather-safe"
  | "family-friendly"
  | "romantic"
  | "solo-traveler"
  | "running-late"
  | "weakest-part";

const withReflow = (output: PlanOutput, nextPlan: PlanOutput["plan"]): PlanOutput => ({
  ...output,
  plan: nextPlan,
  score: simulateRisk(nextPlan, nextPlan.input.portSlug),
});

export function applyPlannerIntent(output: PlanOutput, intent: PlannerIntent): { next: PlanOutput; changes: string[] } {
  if (intent === "reduce-walking") {
    const nextPlan = optimizePlan(output.plan, { action: "balanced-loop" });
    return { next: withReflow(output, nextPlan), changes: ["Reduced long walking legs.", "Shifted to a tighter loop near corridor zones."] };
  }
  if (intent === "make-safer" || intent === "running-late") {
    const step1 = optimizePlan(output.plan, { action: "trim-far-stop" });
    const step2 = optimizePlan(step1, { action: "move-lunch-earlier" });
    return { next: withReflow(output, step2), changes: ["Trimmed outer-leg exposure.", "Pulled key stop earlier for stronger return buffer."] };
  }
  if (intent === "make-cheaper") {
    const nextPlan = {
      ...output.plan,
      blocks: output.plan.blocks.map((block) => ({ ...block, costEUR: block.type === "transfer" ? Math.max(0, block.costEUR - 3) : Math.max(0, block.costEUR - 2) })),
    };
    return { next: withReflow(output, nextPlan), changes: ["Reduced transport and dwell costs.", "Kept core anchors with lower-spend pacing."] };
  }
  if (intent === "add-food-stop") {
    const intelligence = buildPortIntelligence(output.plan.input);
    const exists = output.plan.blocks.some((block) => block.type === "stop" && /food|market|tapas|lunch/i.test(block.title));
    if (exists) return { next: output, changes: ["Food anchor already exists in this plan."] };
    const insertion = {
      id: `${output.plan.input.portSlug}-food-insert`,
      title: intelligence.foodAnchor,
      type: "stop" as const,
      startTime: "00:00",
      endTime: "00:00",
      durationMin: 45,
      costEUR: 18,
      transitMode: "walk",
      whyThisHere: "Food-first pause inserted near existing corridor flow.",
      guidance: "Use this as a seated recovery block and hydration stop.",
      runningLateDecision: "If running late, convert this to quick snack and continue.",
      lock: false,
    };
    const nextPlan = optimizePlan({ ...output.plan, blocks: [...output.plan.blocks.slice(0, 2), insertion, ...output.plan.blocks.slice(2)] }, { action: "move-lunch-earlier" });
    return { next: withReflow(output, nextPlan), changes: [`Added food anchor: ${intelligence.foodAnchor}.`, "Adjusted sequence to keep return-safe flow."] };
  }
  if (intent === "add-signature-highlight") {
    const intelligence = buildPortIntelligence(output.plan.input);
    const nextPlan = {
      ...output.plan,
      blocks: output.plan.blocks.map((block, index) => (index === 2 && block.type === "stop" && !block.lock ? { ...block, title: intelligence.signatureHighlight, whyThisHere: "Signature highlight swap to upgrade day quality." } : block)),
    };
    return { next: withReflow(output, optimizePlan(nextPlan, { action: "balanced-loop" })), changes: ["Swapped in a higher-impact signature highlight.", "Protected same total timeline length."] };
  }
  if (intent === "shorten-day") {
    const nextPlan = {
      ...output.plan,
      blocks: output.plan.blocks.map((block) => (block.type === "stop" && !block.lock ? { ...block, durationMin: Math.max(30, block.durationMin - 15) } : block)),
    };
    return { next: withReflow(output, nextPlan), changes: ["Shortened dwell windows across optional stops.", "Maintained must-do and buffer blocks."] };
  }
  if (intent === "weather-safe") {
    const intelligence = buildPortIntelligence(output.plan.input);
    const nextPlan = {
      ...output.plan,
      blocks: output.plan.blocks.map((block) => (block.type === "stop" && !block.lock ? { ...block, title: block.title.includes("View") ? intelligence.weatherSafeAlternative : block.title } : block)),
      assumptions: [...output.plan.assumptions, `Weather-safe variant active: ${intelligence.weatherSafeAlternative}.`],
    };
    return { next: withReflow(output, nextPlan), changes: ["Shifted exposed segments to weather-safe alternatives."] };
  }
  if (intent === "family-friendly") {
    const nextPlan = optimizePlan(output.plan, { action: "move-lunch-earlier" });
    return { next: withReflow(output, nextPlan), changes: ["Smoothed pacing with family-friendly meal timing."] };
  }
  if (intent === "romantic" || intent === "solo-traveler") {
    const nextPlan = optimizePlan(output.plan, { action: "swap-transit" });
    return { next: withReflow(output, nextPlan), changes: ["Adjusted transitions for a calmer premium flow."] };
  }
  return { next: output, changes: ["No mutation required."] };
}
