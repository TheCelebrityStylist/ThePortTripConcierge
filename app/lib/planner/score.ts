import { plannerPorts } from "@/app/data/ports";
import type { PlanMeta, PlanStop } from "./types";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export function computeMetrics(stops: PlanStop[], meta: PlanMeta) {
  const totalCost = stops.reduce((acc, stop) => acc + stop.costEUR, 0);
  const totalWalk = stops.reduce((acc, stop) => acc + stop.walkMin, 0);
  const transfersCount = stops.filter((s) => s.category === "transit").length;
  const bufferItem = stops.find((s) => s.category === "buffer" && s.title.toLowerCase().includes("return"));
  const bufferMinutesRemaining = bufferItem ? bufferItem.durationMin : 0;
  const farthestDistanceEstimate = stops.reduce((max, stop) => Math.max(max, Math.round(stop.walkMin * 0.08)), 0);
  const portInfo = plannerPorts[meta.portSlug];
  const overlapsPeak = stops.some((stop) => {
    const start = toMin(stop.startTime || "00:00");
    return portInfo?.peakTrafficWindows.some((window) => {
      const [from, to] = window.split("-");
      return start >= toMin(from) && start <= toMin(to);
    });
  });

  const riskFlags: string[] = [];
  if (meta.tenderDock === "tender") riskFlags.push("Tender dependency");
  if (transfersCount > 3) riskFlags.push("Multiple transfers");
  if (overlapsPeak) riskFlags.push("Peak traffic overlap");
  if (bufferMinutesRemaining < meta.returnBufferMin) riskFlags.push("Buffer under target");
  if (totalWalk > 180) riskFlags.push("High walking load");

  let returnSafeScore = 92;
  returnSafeScore -= riskFlags.length * 8;
  returnSafeScore -= Math.max(0, transfersCount - 2) * 5;
  if (meta.riskTolerance === "low" && bufferMinutesRemaining < 60) returnSafeScore -= 10;

  return {
    returnSafeScore: Math.max(10, Math.min(99, returnSafeScore)),
    totalCost,
    totalWalk,
    transfersCount,
    farthestDistanceEstimate,
    riskFlags,
    bufferMinutesRemaining,
    queueRisk: stops.filter((s) => s.crowdRisk === "high").length,
    transitComplexity: transfersCount + (meta.tenderDock === "tender" ? 1 : 0),
  };
}
