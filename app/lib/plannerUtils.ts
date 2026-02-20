import type { DelayScenario, ItineraryPlan, ItineraryStop, StopType, TripMode } from "./types";

export function parseTimeToMin(v: string) {
  const [h, m] = (v || "00:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function minToTime(v: number) {
  const n = Math.max(0, Math.round(v));
  const h = Math.floor(n / 60) % 24;
  const m = n % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function sortByStart(stops: ItineraryStop[]) {
  return [...stops].sort((a, b) => parseTimeToMin(a.startTime || "99:99") - parseTimeToMin(b.startTime || "99:99"));
}

export function stopTypeFromTitle(title: string): StopType {
  const t = title.toLowerCase();
  if (/(taxi|metro|bus|train|transfer|shuttle)/.test(t)) return "transport";
  if (/(lunch|dinner|cafe|food|market)/.test(t)) return "food";
  if (/(buffer|spare|margin)/.test(t)) return "buffer";
  return "attraction";
}

const modeBuffer: Record<TripMode, number> = { aggressive: 8, balanced: 12, relaxed: 15 };

function travelGap(stop: ItineraryStop, plan: ItineraryPlan) {
  if (stop.type === "transport") return Math.max(6, modeBuffer[plan.tripMode] - 2);
  const base = modeBuffer[plan.tripMode];
  const reliabilityPenalty = stop.type === "attraction" ? 2 : 0;
  return base + reliabilityPenalty;
}

function distanceRank(a: ItineraryStop, b: ItineraryStop) {
  if (typeof a.location.lat !== "number" || typeof a.location.lng !== "number") return 2;
  if (typeof b.location.lat !== "number" || typeof b.location.lng !== "number") return 2;
  const d = Math.hypot((a.location.lat - b.location.lat), (a.location.lng - b.location.lng));
  return d;
}

export function optimizePlan(plan: ItineraryPlan) {
  const scheduled = plan.stops.filter((s) => !s.optional);
  if (!scheduled.length) return plan.stops;

  const ordered = [...scheduled].sort((a, b) => {
    const queueA = a.tags?.highQueue ? -1 : 0;
    const queueB = b.tags?.highQueue ? -1 : 0;
    if (queueA !== queueB) return queueA - queueB;
    if (a.tags?.returnCorridor && !b.tags?.returnCorridor) return 1;
    if (!a.tags?.returnCorridor && b.tags?.returnCorridor) return -1;
    return a.priority - b.priority;
  });

  // local distance smoothing pass
  for (let i = 1; i < ordered.length - 1; i++) {
    const left = ordered[i - 1];
    const cur = ordered[i];
    const right = ordered[i + 1];
    const currentCost = distanceRank(left, cur) + distanceRank(cur, right);
    const swappedCost = distanceRank(left, right) + distanceRank(right, cur);
    if (swappedCost < currentCost && !right.tags?.highQueue) {
      ordered[i] = right;
      ordered[i + 1] = cur;
    }
  }

  let cursor = parseTimeToMin(plan.stops.find((s) => s.startTime)?.startTime || "09:00");
  const output: ItineraryStop[] = [];

  ordered.forEach((stop, idx) => {
    const start = cursor;
    const end = start + stop.durationMin;
    output.push({ ...stop, startTime: minToTime(start), endTime: minToTime(end), optional: false });
    cursor = end;

    if (idx < ordered.length - 1) {
      const gap = travelGap(stop, plan);
      output.push({
        id: `buf_${stop.id}_${idx}`,
        title: `Transfer buffer`,
        type: "buffer",
        startTime: minToTime(cursor),
        endTime: minToTime(cursor + gap),
        durationMin: gap,
        location: { name: "Transit margin" },
        costEstimate: 0,
        notes: "Auto-inserted by Auto-Optimize",
        source: "manual",
        priority: 3,
        flexibleMin: 0,
      });
      cursor += gap;
    }
  });

  // return buffer
  const must = parseTimeToMin(plan.mustReturnByTime);
  const returnBufferStart = Math.min(cursor, must - plan.bufferMinutes);
  if (returnBufferStart < must) {
    output.push({
      id: "return_buffer",
      title: "Return buffer",
      type: "buffer",
      startTime: minToTime(returnBufferStart),
      endTime: minToTime(must),
      durationMin: Math.max(0, must - returnBufferStart),
      location: { name: "Return corridor" },
      costEstimate: 0,
      notes: "Protected return window",
      source: "manual",
      priority: 1,
      flexibleMin: 0,
      tags: { returnCorridor: true },
    });
  }

  return [...output, ...plan.stops.filter((s) => s.optional)];
}

export function computeRisk(stops: ItineraryStop[], mustReturnByTime: string) {
  const scheduled = sortByStart(stops.filter((s) => s.startTime && !s.optional));
  if (!scheduled.length) return 10;
  const end = parseTimeToMin(scheduled[scheduled.length - 1].endTime);
  const must = parseTimeToMin(mustReturnByTime);
  const margin = must - end;
  let risk = 30;
  if (margin < 0) risk += 50;
  else if (margin < 20) risk += 35;
  else if (margin < 45) risk += 20;
  risk += scheduled.filter((s) => s.tags?.highQueue).length * 4;
  risk += scheduled.filter((s) => s.type === "transport").length * 2;
  return Math.max(0, Math.min(100, risk));
}

export function applyScenarioDelay(stops: ItineraryStop[], scenario: DelayScenario) {
  const delay = scenario === "tender20" ? 20 : scenario === "traffic25" ? 25 : scenario === "queue30" ? 30 : 15;
  const trigger = scenario === "traffic25" ? "transport" : scenario === "queue30" ? "attraction" : undefined;
  let hit = false;
  return stops.map((s) => {
    if (!hit && (!trigger || s.type === trigger)) hit = true;
    if (!hit || !s.startTime) return s;
    return {
      ...s,
      startTime: minToTime(parseTimeToMin(s.startTime) + delay),
      endTime: minToTime(parseTimeToMin(s.endTime) + delay),
      notes: `${s.notes}${s.notes ? " · " : ""}Scenario delay +${delay}m`,
    };
  });
}

export function breachRepair(stops: ItineraryStop[], mustReturnByTime: string) {
  const must = parseTimeToMin(mustReturnByTime);
  const scheduled = sortByStart(stops.filter((s) => s.startTime && !s.optional));
  if (!scheduled.length) return { fixed: stops, suggestion: "No scheduled stops yet." };
  const end = parseTimeToMin(scheduled[scheduled.length - 1].endTime);
  if (end <= must) return { fixed: stops, suggestion: "Plan remains return-safe." };

  const cutCandidate = [...scheduled].reverse().find((s) => s.priority === 3 || s.optional || s.type !== "transport");
  if (cutCandidate) {
    const fixed = stops.filter((s) => s.id !== cutCandidate.id);
    return { fixed, suggestion: `To stay return-safe, cut ${cutCandidate.title}.` };
  }

  const shrinkCandidate = [...scheduled].reverse().find((s) => s.flexibleMin > 0);
  if (shrinkCandidate) {
    const fixed = stops.map((s) => s.id === shrinkCandidate.id ? { ...s, durationMin: Math.max(15, s.durationMin - Math.min(20, s.flexibleMin)) } : s);
    return { fixed, suggestion: `To stay return-safe, reduce ${shrinkCandidate.title} by up to 20 minutes.` };
  }

  return { fixed: stops, suggestion: "Plan breached return-safe window; manual cuts required." };
}

export function dedupeConsecutive<T>(items: T[], getText: (item: T) => string) {
  const out: T[] = [];
  for (const item of items) {
    if (!out.length || getText(out[out.length - 1]) !== getText(item)) out.push(item);
  }
  return out;
}
