import type { PlanOutput } from "../types";
import type { DayPlan, PlanLeg, PlanStop } from "./types";

const walkIntensity = (duration: number): PlanStop["walkingIntensity"] => (duration >= 25 ? "high" : duration >= 12 ? "moderate" : "low");

export function toDayPlan(id: string, output: PlanOutput): DayPlan {
  const stops: PlanStop[] = output.plan.blocks.map((block) => ({
    id: block.id,
    title: block.title,
    category: block.type === "stop" ? (/market|food|tapas|lunch/i.test(block.title) ? "food" : "stop") : block.type,
    startTime: block.startTime,
    endTime: block.endTime,
    durationMin: block.durationMin,
    costEstimate: block.costEUR,
    walkingIntensity: walkIntensity(block.transitMode === "walk" ? block.durationMin : Math.round(block.durationMin / 2)),
    source: "engine",
    notes: block.guidance,
    whyThisFits: block.whyThisHere,
    safeLateInDay: block.type === "buffer" || /return|corridor|near-port/i.test(block.title + block.guidance),
    details: block.runningLateDecision,
  }));

  const legs: PlanLeg[] = stops.slice(0, -1).map((stop, index) => {
    const next = stops[index + 1];
    return {
      id: `${stop.id}__${next.id}`,
      fromStopId: stop.id,
      toStopId: next.id,
      mode: output.plan.blocks[index + 1]?.transitMode ?? "walk",
      durationMin: Math.max(8, Math.round((next.durationMin * 0.35))),
      costEstimate: Math.max(0, Math.round((output.plan.blocks[index + 1]?.costEUR ?? 0) * 0.4)),
      reliability: /taxi|metro/.test(output.plan.blocks[index + 1]?.transitMode ?? "") ? "high" : "medium",
      notes: output.plan.blocks[index + 1]?.guidance ?? "",
    };
  });

  return {
    id,
    portSlug: output.plan.input.portSlug,
    arrivalTime: output.plan.input.onboardTime,
    allAboardTime: output.plan.input.allAboardTime,
    pace: output.plan.input.pace,
    walkingLevel: output.plan.input.walkingLevel,
    budgetLevel: output.plan.input.budgetSensitivity,
    interests: output.plan.input.interests,
    stops,
    legs,
    lockedStopIds: output.plan.blocks.filter((block) => block.lock).map((block) => block.id),
    mustDoStopIds: output.plan.blocks.filter((block) => block.lock).map((block) => block.id),
    confidenceScore: output.score.totalScore,
    fragility: output.score.violations[0] ?? "Late transfer reliability",
    fallbackPlan: output.plan.assumptions.find((note) => /fallback/i.test(note)),
  };
}
