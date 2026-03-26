import type { DayPlan } from "./types";

export function deriveMetrics(plan: DayPlan) {
  const totalCost = plan.stops.reduce((sum, stop) => sum + stop.costEstimate, 0) + plan.legs.reduce((sum, leg) => sum + leg.costEstimate, 0);
  const totalWalking = plan.stops.reduce((sum, stop) => sum + (stop.walkingIntensity === "high" ? stop.durationMin : stop.walkingIntensity === "moderate" ? Math.round(stop.durationMin * 0.6) : Math.round(stop.durationMin * 0.3)), 0);
  const weakestLeg = plan.legs.find((leg) => leg.reliability === "low") ?? plan.legs[plan.legs.length - 1];
  return { totalCost, totalWalking, weakestLeg: weakestLeg?.id };
}
