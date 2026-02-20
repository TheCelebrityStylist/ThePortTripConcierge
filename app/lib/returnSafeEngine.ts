import type { DelayScenario, EngineOutput, ItineraryPlan, ItineraryStop, PortProfileLite, TripMode } from "./types";
import { minToTime, parseTimeToMin, sortByStart } from "./plannerUtils";

export const portProfilesLite: Record<string, PortProfileLite> = {
  barcelona: { tender: false, typicalTrafficWindows: ["11:30-13:30", "15:00-16:00"], baselineTransferMin: [10, 25], reliabilityRanking: ["walk", "metro", "taxi", "bus"] },
  marseille: { tender: false, typicalTrafficWindows: ["10:30-12:30", "15:30-16:30"], baselineTransferMin: [15, 35], reliabilityRanking: ["taxi", "metro", "bus", "walk"] },
  "athens-piraeus": { tender: false, typicalTrafficWindows: ["08:30-10:00", "16:00-17:00"], baselineTransferMin: [20, 40], reliabilityRanking: ["taxi", "metro", "bus", "walk"] },
  santorini: { tender: true, typicalTrafficWindows: ["08:00-10:30", "14:00-16:00"], baselineTransferMin: [20, 50], reliabilityRanking: ["walk", "taxi", "bus", "metro"] },
  mykonos: { tender: true, typicalTrafficWindows: ["09:00-11:00", "15:00-16:30"], baselineTransferMin: [15, 35], reliabilityRanking: ["walk", "taxi", "bus", "metro"] },
};

const modeMicroBuffer: Record<TripMode, number> = { aggressive: 8, balanced: 10, relaxed: 15 };

function travelEstimate(stop: ItineraryStop, profile: PortProfileLite) {
  const base = stop.travelMinToNext || profile.baselineTransferMin[0];
  const queuePenalty = stop.tags?.highQueue ? 6 : 0;
  return Math.max(profile.baselineTransferMin[0], Math.min(profile.baselineTransferMin[1], base + queuePenalty));
}

export function runReturnSafeEngine(plan: ItineraryPlan): EngineOutput {
  const profile = portProfilesLite[plan.portSlug] ?? { tender: false, typicalTrafficWindows: ["11:00-13:00"], baselineTransferMin: [10, 25], reliabilityRanking: ["walk", "taxi", "bus", "metro"] };
  const microBuffer = modeMicroBuffer[plan.tripMode];

  const fixed = plan.stops.filter((s) => !s.optional && !s.locked);
  const locked = plan.stops.filter((s) => s.locked && !s.optional);
  const optional = plan.stops.filter((s) => s.optional);

  const ordered = [...fixed].sort((a, b) => {
    if (a.tags?.highQueue && !b.tags?.highQueue) return -1;
    if (!a.tags?.highQueue && b.tags?.highQueue) return 1;
    if (a.tags?.returnCorridor && !b.tags?.returnCorridor) return 1;
    if (!a.tags?.returnCorridor && b.tags?.returnCorridor) return -1;
    return a.priority - b.priority;
  });

  const merged = [...locked, ...ordered].sort((a, b) => (a.locked ? -1 : 1));

  let cursor = parseTimeToMin(plan.stops.find((s) => s.startTime)?.startTime || "09:00");
  const scheduled: ItineraryStop[] = [];

  merged.forEach((stop, idx) => {
    const start = cursor;
    const end = start + stop.durationMin;
    scheduled.push({ ...stop, startTime: minToTime(start), endTime: minToTime(end), optional: false });
    cursor = end;

    if (idx < merged.length - 1) {
      const transfer = travelEstimate(stop, profile);
      const buffer = microBuffer + (profile.tender ? 3 : 0);
      scheduled.push({
        id: `buf_${stop.id}_${idx}`,
        title: `Transfer buffer`,
        type: "buffer",
        startTime: minToTime(cursor),
        endTime: minToTime(cursor + transfer + buffer),
        durationMin: transfer + buffer,
        travelMinToNext: 0,
        location: { name: "Estimated transition" },
        costEstimate: 0,
        notes: "Estimated",
        source: "manual",
        priority: 5,
        flexibility: "fixed",
      });
      cursor += transfer + buffer;
    }
  });

  const mustReturn = parseTimeToMin(plan.allAboardTime) - plan.bufferMinutes;
  if (cursor < mustReturn) {
    scheduled.push({
      id: "return_buffer",
      title: "Return buffer",
      type: "buffer",
      startTime: minToTime(cursor),
      endTime: minToTime(mustReturn),
      durationMin: Math.max(0, mustReturn - cursor),
      travelMinToNext: 0,
      location: { name: "Terminal corridor" },
      costEstimate: 0,
      notes: "Protected final leg",
      source: "manual",
      priority: 1,
      flexibility: "fixed",
      tags: { returnCorridor: true },
    });
  }

  const blocks = [...scheduled, ...optional];
  const active = sortByStart(blocks.filter((s) => !s.optional));
  const last = active[active.length - 1];
  const margin = last ? mustReturn - parseTimeToMin(last.endTime) : 120;

  const breaches: string[] = [];
  if (margin < 0) breaches.push(`Return buffer violated by ${Math.abs(margin)} minutes`);
  const lateOutbound = active.some((s) => s.tags?.highQueue && parseTimeToMin(s.startTime) > parseTimeToMin("12:30"));
  if (lateOutbound) breaches.push("High-queue stop scheduled too late");
  const transferCount = active.filter((s) => s.type === "buffer").length;
  if (transferCount > 4) breaches.push("Too many transfer segments for this time window");

  let score = 100;
  score -= Math.max(0, transferCount - 2) * 6;
  score -= active.filter((s) => s.tags?.highQueue).length * 5;
  if (!active.some((s) => s.tags?.returnCorridor)) score -= 12;
  if (margin < 0) score -= 30;
  else if (margin < 20) score -= 18;
  else if (margin < 45) score -= 8;
  if (active.filter((s) => s.type === "buffer").length >= 2) score += 6;
  score = Math.max(0, Math.min(100, score));

  const checkpoints = [
    { label: "Checkpoint 1 (first major stop start)", time: active.find((s) => s.type === "attraction")?.startTime || minToTime(parseTimeToMin(plan.mustReturnByTime) - 180) },
    { label: "Checkpoint 2 (midday)", time: minToTime(parseTimeToMin(plan.mustReturnByTime) - 120) },
    { label: "Checkpoint 3 (return leg start)", time: minToTime(parseTimeToMin(plan.mustReturnByTime) - 60) },
  ].map((c) => {
    const status: "ok" | "warn" | "late" = margin < 0 ? "late" : margin < 20 ? "warn" : "ok";
    return { ...c, status };
  });

  const cutCandidate = [...active].reverse().find((s) => s.optional || s.priority >= 4 || s.flexibility === "flex");
  const shortenCandidate = [...active].reverse().find((s) => s.flexibility === "flex" && s.durationMin > 30);

  const cutRecommendations = cutCandidate ? [`Cut ${cutCandidate.title} to recover margin.`] : ["No clear low-priority cut candidate found."];
  const shortenRecommendations = shortenCandidate ? [`Shorten ${shortenCandidate.title} by 20m.`] : ["No flexible stop available for shortening."];

  const fragileLeg = active.filter((s) => s.type === "buffer").sort((a, b) => b.durationMin - a.durationMin)[0]?.title || "Initial transfer";
  const scoreDrivers = [
    `Transfer segments: ${transferCount}`,
    `High-queue timing risk: ${lateOutbound ? "high" : "managed"}`,
    `Return margin: ${margin} minutes`,
    `Final corridor stop: ${active.some((s) => s.tags?.returnCorridor) ? "yes" : "no"}`,
    `Mode: ${plan.tripMode}`,
  ];

  return {
    scheduledBlocks: blocks,
    checkpoints,
    returnSafeScore: score,
    breachReasons: breaches,
    cutRecommendations,
    shortenRecommendations,
    scoreDrivers,
    fragileLeg,
  };
}

export function applySimulation(plan: ItineraryPlan, scenario: DelayScenario) {
  const shift = scenario === "tender20" ? 20 : scenario === "traffic25" ? 25 : scenario === "queue30" ? 30 : scenario === "lost15" ? 15 : 10;
  const weatherPivot = scenario === "weatherPivot";
  const shifted = plan.stops.map((s) => {
    if (!s.startTime) return s;
    const indoorPenalty = weatherPivot && s.tags?.outdoor ? 10 : 0;
    return {
      ...s,
      startTime: minToTime(parseTimeToMin(s.startTime) + shift + indoorPenalty),
      endTime: minToTime(parseTimeToMin(s.endTime) + shift + indoorPenalty),
      notes: `${s.notes}${s.notes ? " · " : ""}Simulation ${scenario}`,
    };
  });

  const weatherWarning = weatherPivot && !plan.stops.some((s) => s.tags?.indoor)
    ? "Weather pivot: no indoor stops found; suggest adding museum/café fallback."
    : "";

  return { shifted, weatherWarning };
}
