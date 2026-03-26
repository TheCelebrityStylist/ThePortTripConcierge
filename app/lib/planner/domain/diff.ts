import type { DayPlan } from "./types";

export function diffDayPlans(before: DayPlan, after: DayPlan) {
  const beforeMap = new Map(before.stops.map((stop) => [stop.id, stop]));
  const added = after.stops.filter((stop) => !beforeMap.has(stop.id)).map((stop) => stop.id);
  const changed = after.stops.filter((stop) => {
    const prior = beforeMap.get(stop.id);
    return prior && (prior.startTime !== stop.startTime || prior.endTime !== stop.endTime || prior.title !== stop.title || prior.costEstimate !== stop.costEstimate);
  }).map((stop) => stop.id);
  return { addedStopIds: added, changedStopIds: changed };
}
