import { portProfiles } from "./ports";
import type { BriefState, Plan, PlannedStop, PlanMode, PortProfile, RiskBreakdown, StopTemplate } from "./types";

const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

const seedNum = (seed: string) => Array.from(seed).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 7);
const rng = (seed: string) => {
  let state = seedNum(seed);
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
};

const uid = (prefix: string, n: number) => `${prefix}-${n}`;

function pickStops(profile: PortProfile, mode: PlanMode, interests: BriefState["interests"], rand: () => number) {
  const interestTags = new Set(interests);
  const anchors = [...profile.anchors].sort(() => rand() - 0.5).filter((s) => {
    if (interestTags.has("culture") && (s.tags.includes("culture") || s.tags.includes("shopping"))) return true;
    if (interestTags.has("views") && s.tags.includes("views")) return true;
    return true;
  });

  const food = [...profile.foodAnchors].sort(() => rand() - 0.5);
  const scenic = [...profile.scenicBlocks].sort(() => rand() - 0.5);

  const count = mode === "aggressive" ? 5 : mode === "conservative" ? 3 : 4;
  const picks: StopTemplate[] = [anchors[0], anchors[1], food[0], scenic[0]].filter(Boolean);
  while (picks.length < count) picks.push((anchors[picks.length % anchors.length] || scenic[0]));

  if (mode === "weather-safe") {
    const indoor = [...food, ...profile.anchors].find((s) => s.indoor);
    if (indoor) picks[1] = indoor;
  }
  if (mode === "mobility-easy") {
    picks.sort((a, b) => a.walkMin - b.walkMin);
  }
  return picks;
}

export function generatePlan(input: BriefState): Plan {
  const profile = portProfiles[input.portSlug] ?? portProfiles.barcelona;
  const seed = `${input.portSlug}-${input.mode}-${input.allAboardTime}-${input.targetBufferMin}-${input.interests.join(",")}-${input.pace}-${input.walkingLevel}`;
  const rand = rng(seed);
  const selected = pickStops(profile, input.mode, input.interests, rand);

  const allAboardMin = toMin(input.allAboardTime);
  const onboardMin = toMin(input.onboardTime);
  const hardReturn = allAboardMin - input.targetBufferMin;
  const transferToCity = profile.transferToCityMin + (profile.tender ? 8 : 0);

  let cursor = onboardMin;
  const stops: PlannedStop[] = [];
  stops.push({ id: uid("stop", 0), title: profile.transferBlocks[0].title, category: "transfer", startTime: toTime(cursor), endTime: toTime(cursor + transferToCity), durationMin: transferToCity, walkMin: 4, costEUR: profile.transferBlocks[0].costEUR, crowd: profile.transferBlocks[0].crowd, notes: "Exit terminal and enter city corridor.", mustDo: false, locked: true, templateId: profile.transferBlocks[0].id });
  cursor += transferToCity;

  selected.forEach((template, index) => {
    const paceAdj = input.pace === "intense" ? 0.85 : input.pace === "chill" ? 1.15 : 1;
    const walkAdj = input.walkingLevel === "minimal" ? 0.8 : input.walkingLevel === "active" ? 1.1 : 1;
    const duration = Math.max(35, Math.round(template.durationMin * paceAdj));
    const walk = Math.round(template.walkMin * walkAdj);
    stops.push({ id: uid("stop", index + 1), title: template.title, category: template.category, startTime: toTime(cursor), endTime: toTime(cursor + duration), durationMin: duration, walkMin: walk, costEUR: template.costEUR, crowd: template.crowd, notes: `Chosen for ${template.tags.join(" + ")} fit.`, mustDo: index === 0, locked: false, templateId: template.id });
    cursor += duration;

    if (index < selected.length - 1) {
      const hop = Math.max(12, profile.transferBlocks[0].durationMin + Math.round(rand() * 8));
      stops.push({ id: uid("transfer", index), title: profile.transferBlocks[0].title, category: "transfer", startTime: toTime(cursor), endTime: toTime(cursor + hop), durationMin: hop, walkMin: 5, costEUR: profile.transferBlocks[0].costEUR, crowd: "medium", notes: "Planned connection between clusters.", mustDo: false, locked: false, templateId: profile.transferBlocks[0].id });
      cursor += hop;
    }
  });

  const buffer = Math.max(25, hardReturn - cursor);
  stops.push({ id: uid("buffer", 1), title: profile.tender ? "Tender queue + return buffer" : "Return buffer to ship", category: "buffer", startTime: toTime(cursor), endTime: toTime(cursor + buffer), durationMin: buffer, walkMin: 5, costEUR: 0, crowd: profile.tender ? "high" : "low", notes: "Protected final return corridor.", mustDo: true, locked: true });

  return {
    portSlug: profile.slug,
    onboardTime: input.onboardTime,
    allAboardTime: input.allAboardTime,
    targetBufferMin: input.targetBufferMin,
    mode: input.mode,
    preferences: { walkingLevel: input.walkingLevel, interests: input.interests, pace: input.pace },
    stops,
  };
}

export function computeRiskBreakdown(plan: Plan): RiskBreakdown {
  const profile = portProfiles[plan.portSlug];
  const bufferStop = plan.stops.find((stop) => stop.category === "buffer");
  const bufferScore = Math.max(20, Math.min(100, Math.round(((bufferStop?.durationMin || 20) / plan.targetBufferMin) * 100)));
  const lateFar = plan.stops.some((s) => s.walkMin > 18 && toMin(s.startTime) > toMin(plan.allAboardTime) - 180);
  const distanceScore = lateFar ? 58 : 84;
  const transferCount = plan.stops.filter((s) => s.category === "transfer").length;
  const transferScore = Math.max(45, 90 - transferCount * 12);
  const crowdOverlap = plan.stops.some((s) => profile.peakTrafficWindows.some((w) => {
    const [a, b] = w.split("-");
    const time = toMin(s.startTime);
    return time >= toMin(a) && time <= toMin(b) && s.crowd === "high";
  }));
  const crowdScore = crowdOverlap ? 55 : 82;
  const tenderScore = profile.tender ? 62 : 90;

  const items: RiskBreakdown["items"] = [
    { key: "buffer", label: "Buffer health", score: bufferScore, why: `Protected return window is ${bufferStop?.durationMin ?? 0} minutes.`, fixLabel: "Move lunch earlier", action: "move-lunch-earlier" },
    { key: "distance", label: "Distance risk", score: distanceScore, why: lateFar ? "A long-walk stop sits late in the day." : "Far stops are not stacked late.", fixLabel: "Reduce farthest stop by 25 min", action: "trim-farthest" },
    { key: "transfers", label: "Transfer count", score: transferScore, why: `${transferCount} transfer segments in this plan.`, fixLabel: "Swap transit mode", action: "swap-transit" },
    { key: "crowd", label: "Crowd overlap", score: crowdScore, why: crowdOverlap ? "High-crowd stop overlaps peak traffic window." : "Peak windows are mostly avoided.", fixLabel: "Move lunch earlier", action: "move-lunch-earlier" },
    { key: "tender", label: "Tender friction", score: tenderScore, why: profile.tender ? "Tender operations add uncertainty." : "Docking mode is stable.", fixLabel: "Convert to Balanced Loop", action: "balanced-loop" },
  ];

  const total = Math.round(items.reduce((sum, item) => sum + item.score, 0) / items.length);
  return { total, items };
}

export function applyFixAction(plan: Plan, action: RiskBreakdown["items"][number]["action"]): Plan {
  const next: Plan = { ...plan, stops: plan.stops.map((s) => ({ ...s })) };
  if (action === "trim-farthest") {
    const far = next.stops.filter((s) => s.category !== "buffer").sort((a, b) => b.walkMin - a.walkMin)[0];
    if (far) far.durationMin = Math.max(30, far.durationMin - 25);
  }
  if (action === "swap-transit") {
    next.stops = next.stops.map((s) => s.category === "transfer" ? { ...s, durationMin: Math.max(14, s.durationMin - 6), notes: "Transit mode swapped to faster option." } : s);
  }
  if (action === "move-lunch-earlier") {
    const lunch = next.stops.find((s) => s.category === "food");
    if (lunch) lunch.startTime = toTime(Math.max(toMin(plan.onboardTime) + 140, toMin(lunch.startTime) - 45));
  }
  if (action === "balanced-loop") {
    const profile = portProfiles[next.portSlug];
    const fallback = profile.fallbackLoop[0];
    if (fallback) {
      next.stops = next.stops.filter((s) => s.category !== "anchor" || s.mustDo).slice(0, 5);
      const buffer = next.stops.find((s) => s.category === "buffer");
      next.stops.splice(Math.max(2, next.stops.length - 1), 0, {
        id: `fallback-${fallback.id}`,
        templateId: fallback.id,
        title: fallback.title,
        category: fallback.category,
        startTime: buffer?.startTime || next.onboardTime,
        endTime: buffer?.startTime || next.onboardTime,
        durationMin: fallback.durationMin,
        walkMin: fallback.walkMin,
        costEUR: fallback.costEUR,
        crowd: fallback.crowd,
        notes: "Closer loop to reduce return risk.",
        mustDo: false,
        locked: false,
      });
    }
  }
  return regenerateTimeline(next);
}

export function applySimulation(plan: Plan, scenario: "disembark" | "traffic" | "tender" | "museum") {
  const deltas = { disembark: 25, traffic: 20, tender: 30, museum: 18 } as const;
  const delta = deltas[scenario];
  const next = regenerateTimeline({ ...plan, stops: plan.stops.map((s) => ({ ...s })) }, delta);
  const risk = computeRiskBreakdown(next);
  const suggested = risk.items.sort((a, b) => a.score - b.score)[0];
  return { plan: next, suggestion: suggested };
}

export function regenerateTimeline(plan: Plan, addMinutes = 0): Plan {
  const copy = plan.stops.map((s) => ({ ...s }));
  let cursor = toMin(plan.onboardTime) + addMinutes;
  copy.forEach((stop) => {
    stop.startTime = toTime(cursor);
    stop.endTime = toTime(cursor + stop.durationMin);
    cursor += stop.durationMin;
  });
  return { ...plan, stops: copy };
}

export function conciergeBrief(plan: Plan, risk: RiskBreakdown) {
  const profile = portProfiles[plan.portSlug];
  const highlights = plan.stops.filter((s) => s.category !== "transfer" && s.category !== "buffer").slice(0, 3).map((s) => s.title);
  return {
    narrative: `Your ${profile.name} day starts with a direct push into ${highlights[0] || "the core district"}, then shifts through ${highlights[1] || "a lighter mid-day block"} before wrapping with ${highlights[2] || "a controlled return corridor"}.`,
    why: [
      `Stops prioritize ${plan.preferences.interests.join(", ")} while staying inside a ${plan.targetBufferMin} minute return buffer.`,
      `Transfer count is capped to ${plan.stops.filter((s) => s.category === "transfer").length} to avoid compounding delays.`,
      profile.tender ? "Tender friction is treated as a hard constraint with an expanded return block." : "Dock operations allow tighter but still protected sequencing.",
    ],
    bookAvoid: [
      `Book timed entry only for your top anchor if it starts before ${profile.peakTrafficWindows[0]}.`,
      `Avoid adding a new far stop after ${plan.allAboardTime.slice(0, 2)}:00 local time.`,
    ],
    pacing: `Pace is ${plan.preferences.pace} with walking load tuned for ${plan.preferences.walkingLevel} mobility. Current return-safe score: ${risk.total}.`,
    lateTree: [
      "If 15–20 minutes late: trim the longest scenic block and keep lunch.",
      "If 25–35 minutes late: switch one transfer to faster mode and skip non-must-do stop.",
      "If >35 minutes late: run balanced-loop fallback and head shipward immediately after one highlight.",
    ],
  };
}

export function chatReply(plan: Plan, risk: RiskBreakdown, question: string) {
  const lower = question.toLowerCase();
  const lunch = plan.stops.find((s) => s.category === "food");
  if (lower.includes("less walking")) {
    return `I’d cut ${plan.stops.sort((a, b) => b.walkMin - a.walkMin)[0]?.title} by 20 minutes and shift to a faster transfer. That lowers walking load while protecting your ${plan.targetBufferMin} minute buffer.`;
  }
  if (lower.includes("lunch")) {
    return lunch ? `Best lunch anchor in your current plan is ${lunch.title} at ${lunch.startTime}. Moving it 30 minutes earlier will avoid peak crowd pressure.` : "Add a lunch anchor near your mid-day cluster to stabilize pacing.";
  }
  return `Based on ${plan.portSlug}, current mode ${plan.mode}, and risk score ${risk.total}, I recommend focusing on ${plan.stops.filter((s) => s.category === "anchor").slice(0, 2).map((s) => s.title).join(" + ")} and keeping your final buffer untouched.`;
}
