import { portsRegistry } from "@/app/lib/ports";
import type { Cruise, CruiseDashboard, PlanBlock, PlanInput, PlanOutput, PortDay, ScoreCard } from "./types";

const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
const hash = (text: string) => Array.from(text).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 2147483647, 11);
const seeded = (seed: string) => {
  let value = hash(seed);
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
};

const similarityScore = (a: string, b: string) => {
  const aw = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const bw = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  const overlap = Array.from(aw).filter((word) => bw.has(word)).length;
  return overlap / Math.max(aw.size, bw.size, 1);
};

const ensureUniqueTitles = (blocks: PlanBlock[]) => {
  const seen = new Map<string, number>();
  return blocks.map((block) => {
    const key = block.title.toLowerCase();
    const count = seen.get(key) ?? 0;
    seen.set(key, count + 1);
    return count === 0 ? block : { ...block, title: `${block.title} (${count + 1})` };
  });
};

const transferLabel = (from: string, to: string, mode: string) =>
  mode === "metro" ? `Metro transfer: ${from} → ${to}` : mode === "taxi" ? `Taxi corridor: ${from} → ${to}` : `${mode.toUpperCase()} link: ${from} → ${to}`;

const stopGuidance = (stopName: string, prev: string, watch: string, fallback: string, reason: string) =>
  `At ${stopName}, focus on one compact loop that matches your interests. From ${prev}, use the planned transfer and keep dwell time disciplined. Watch for ${watch.toLowerCase()} and pivot early if it starts to slip. If you are running late, switch to ${fallback}. This fits because ${reason}.`;

export function generateNarrative(plan: PlanOutput, portName: string) {
  const modeText = plan.plan.input.mode.replace("-", " ");
  const anchor = plan.plan.blocks.find((block) => block.type === "stop")?.title ?? `${portName} core`;
  return `Your ${portName} day opens with a decisive corridor move, then anchors around ${anchor} before tightening into a protected return corridor. This is a ${modeText} strategy tuned for ${plan.plan.input.riskTolerance} risk with ${plan.plan.input.mustReturnBufferMin} minutes of return protection.`;
}

export function simulateRisk(plan: { input: PlanInput; blocks: PlanBlock[] }, portSlug: string): ScoreCard {
  const port = portsRegistry[portSlug] ?? portsRegistry.barcelona;
  const bufferBlock = plan.blocks.find((block) => block.type === "buffer");
  const bufferHealth = Math.min(100, Math.round(((bufferBlock?.durationMin ?? 10) / plan.input.mustReturnBufferMin) * 100));
  const transferCount = plan.blocks.filter((block) => block.type === "transfer").length;
  const transferCountRisk = Math.max(30, 95 - transferCount * 12);
  const farLate = plan.blocks.some((block) => block.type === "stop" && toMin(block.startTime) > toMin(plan.input.allAboardTime) - 180 && block.durationMin > 65);
  const distanceRisk = farLate ? 45 : 82;
  const crowdOverlap = plan.blocks.some((block) => block.type === "stop" && port.peakCrowdWindows.some((window) => {
    const [start, end] = window.split("-");
    const minute = toMin(block.startTime);
    return minute >= toMin(start) && minute <= toMin(end);
  }));
  const crowdOverlapRisk = crowdOverlap ? 50 : 83;
  const tenderFrictionRisk = port.dockingModeDefault === "tender" ? 60 : 88;

  const violations: string[] = [];
  if ((bufferBlock?.durationMin ?? 0) < plan.input.mustReturnBufferMin) violations.push("Return buffer lower than requested.");
  if (transferCount > 4) violations.push("Transfer count is high for cruise-day reliability.");
  if (farLate) violations.push("Far stop appears too late for safe return posture.");
  if (port.dockingModeDefault === "tender" && plan.input.mode === "aggressive") violations.push("Aggressive mode + tender operations increases return volatility.");

  const totalScore = Math.round((bufferHealth + transferCountRisk + distanceRisk + crowdOverlapRisk + tenderFrictionRisk) / 5);
  return { bufferHealth, transferCountRisk, distanceRisk, crowdOverlapRisk, tenderFrictionRisk, totalScore, violations };
}

export function generatePortDayPlan(input: PlanInput, portSlug = input.portSlug): PlanOutput {
  const port = portsRegistry[portSlug] ?? portsRegistry.barcelona;
  const seed = `${portSlug}-${input.onboardTime}-${input.allAboardTime}-${input.mode}-${hash(input.interests.join("|"))}`;
  const rand = seeded(seed);

  const selected = [...port.attractionClusters]
    .filter((cluster) => cluster.tags.some((tag) => input.interests.includes(tag)))
    .sort(() => (rand() > 0.5 ? 1 : -1))
    .slice(0, input.mode === "aggressive" ? 5 : input.mode === "conservative" ? 3 : 4);

  let cursor = toMin(input.onboardTime);
  const hardReturn = toMin(input.allAboardTime) - input.mustReturnBufferMin;
  const blocks: PlanBlock[] = [];

  const transportRanked = [...port.transportProfiles].sort((a, b) => a.reliability - b.reliability);
  const firstTransfer = transportRanked[0];
  const firstTransferMin = Math.max(12, firstTransfer.timeMin[0] + (port.dockingModeDefault === "tender" ? 10 : 0));
  blocks.push({
    id: `${port.slug}-start-transfer`,
    title: transferLabel("Terminal", port.corridorZones[1].name, firstTransfer.mode),
    type: "transfer",
    startTime: toTime(cursor),
    endTime: toTime(cursor + firstTransferMin),
    durationMin: firstTransferMin,
    costEUR: Math.max(0, firstTransfer.mode === "walk" ? 0 : 6),
    transitMode: firstTransfer.mode,
    whyThisHere: "Fast reliable start leg protects your highest-value morning window.",
    guidance: `Use official ${firstTransfer.mode} channels to avoid early friction and scams.`,
    runningLateDecision: "If this leg slips by >15m, drop one outer-loop cluster.",
    lock: true,
  });
  cursor += firstTransferMin;

  selected.forEach((cluster, index) => {
    const duration = Math.max(cluster.typicalDuration[0], Math.min(cluster.typicalDuration[1], cluster.typicalDuration[0] + Math.round(rand() * 15)));
    const prev = index === 0 ? port.corridorZones[1].name : selected[index - 1].name;
    const reason = `it aligns with ${input.interests.join(", ")} and ${input.walkingLevel} mobility`;
    blocks.push({
      id: `${port.slug}-${cluster.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      title: cluster.name,
      type: "stop",
      startTime: toTime(cursor),
      endTime: toTime(cursor + duration),
      durationMin: duration,
      costEUR: cluster.costRange[0] + Math.round(rand() * (cluster.costRange[1] - cluster.costRange[0])),
      transitMode: transportRanked[Math.min(index, transportRanked.length - 1)].mode,
      whyThisHere: `${cluster.name} is selected to match your preference stack without breaking return-safe logic.`,
      guidance: stopGuidance(cluster.name, prev, port.typicalTransitRisks[0], `${port.name} Near-Port Fallback Loop`, reason),
      runningLateDecision: `If you are +${15 + index * 5}m behind here, trim this stop by 20m and continue corridor-in.`,
      lock: input.mustDoStops.includes(cluster.name),
    });
    cursor += duration;

    if (index < selected.length - 1) {
      const hopMode = transportRanked[Math.min(index + 1, transportRanked.length - 1)];
      const hopMin = Math.max(10, hopMode.timeMin[0] + Math.round(rand() * 7));
      blocks.push({
        id: `${port.slug}-hop-${index}`,
        title: transferLabel(cluster.name, selected[index + 1].name, hopMode.mode),
        type: "transfer",
        startTime: toTime(cursor),
        endTime: toTime(cursor + hopMin),
        durationMin: hopMin,
        costEUR: hopMode.mode === "walk" ? 0 : 4,
        transitMode: hopMode.mode,
        whyThisHere: "Specific transfer naming keeps the route operational and non-generic.",
        guidance: "Keep this transfer tight; if queues form, pivot to taxi for this leg only.",
        runningLateDecision: "If delay >12m, skip next optional stop and hold return buffer.",
        lock: false,
      });
      cursor += hopMin;
    }
  });

  const buffer = Math.max(20, hardReturn - cursor);
  blocks.push({
    id: `${port.slug}-return-buffer`,
    title: `Return-safe corridor buffer (${port.name})`,
    type: "buffer",
    startTime: toTime(cursor),
    endTime: toTime(cursor + buffer),
    durationMin: buffer,
    costEUR: 0,
    transitMode: port.dockingModeDefault === "tender" ? "ferry" : "walk",
    whyThisHere: "Final protective block absorbs queue, traffic, and boarding uncertainty.",
    guidance: "Head shipward early; treat this window as non-negotiable protection.",
    runningLateDecision: "If this is already consumed, board now and skip all extras.",
    lock: true,
  });

  const antiGenericBlocks = ensureUniqueTitles(blocks).map((block, idx, arr) => {
    if (idx === 0) return block;
    const previous = arr[idx - 1].guidance;
    if (similarityScore(previous, block.guidance) > 0.78) {
      return { ...block, guidance: `${block.guidance} Local nuance: prioritize ${port.corridorZones[0].name} if lines exceed 20 minutes.` };
    }
    return block;
  });

  const plan = { input: { ...input, portSlug }, blocks: antiGenericBlocks, assumptions: [
    `Gangway assumption: ${port.defaultTimeWindows.gangwayOpen}.`,
    `Far outbound cutoff: ${port.defaultTimeWindows.lastOutboundCutoff}.`,
    ...port.safeReturnRules.slice(0, 2),
  ] };
  const score = simulateRisk(plan, portSlug);
  const output: PlanOutput = {
    plan,
    score,
    recommendations: [
      { label: "Reduce farthest stop by 25 min", action: "trim-far-stop" },
      { label: "Swap transit mode", action: "swap-transit" },
      { label: "Move lunch earlier", action: "move-lunch-earlier" },
      { label: "Convert to balanced loop", action: "balanced-loop" },
    ],
    narrative: "",
  };
  output.narrative = generateNarrative(output, port.name);
  return output;
}

export function optimizePlan(plan: PlanOutput["plan"], constraints: { action: "trim-far-stop" | "swap-transit" | "move-lunch-earlier" | "balanced-loop" }) {
  const port = portsRegistry[plan.input.portSlug] ?? portsRegistry.barcelona;
  const next = plan.blocks.map((block) => ({ ...block }));

  if (constraints.action === "trim-far-stop") {
    const target = [...next].reverse().find((block) => block.type === "stop" && !block.lock);
    if (target) target.durationMin = Math.max(30, target.durationMin - 25);
  }

  if (constraints.action === "swap-transit") {
    const better = [...port.transportProfiles].sort((a, b) => a.reliability - b.reliability)[0];
    next.forEach((block) => {
      if (block.type === "transfer") {
        block.transitMode = better.mode;
        block.title = transferLabel("Current leg", "Optimized leg", better.mode);
        block.durationMin = Math.max(10, block.durationMin - 6);
      }
    });
  }

  if (constraints.action === "move-lunch-earlier") {
    const lunch = next.find((block) => block.type === "stop" && /market|food/i.test(block.title));
    if (lunch) lunch.durationMin = Math.max(35, lunch.durationMin - 10);
  }

  if (constraints.action === "balanced-loop") {
    const fallback = port.attractionClusters.find((cluster) => /fallback/i.test(cluster.name));
    if (fallback) {
      const stable = next.filter((block) => block.lock || block.type === "transfer" || block.type === "buffer").slice(0, 5);
      stable.splice(Math.max(2, stable.length - 1), 0, {
        id: `${port.slug}-fallback-optimized`,
        title: fallback.name,
        type: "stop",
        startTime: "00:00",
        endTime: "00:00",
        durationMin: fallback.typicalDuration[0],
        costEUR: fallback.costRange[0],
        transitMode: "walk",
        whyThisHere: "Fallback loop selected to remove outer-leg volatility.",
        guidance: "Stay in near-port corridor and avoid new outbound legs.",
        runningLateDecision: "If still late, board now.",
        lock: false,
      });
      return reflow({ ...plan, blocks: stable });
    }
  }

  return reflow({ ...plan, blocks: next });
}

const reflow = (plan: PlanOutput["plan"]) => {
  let cursor = toMin(plan.input.onboardTime);
  const blocks = plan.blocks.map((block) => {
    const next = { ...block, startTime: toTime(cursor), endTime: toTime(cursor + block.durationMin) };
    cursor += block.durationMin;
    return next;
  });
  return { ...plan, blocks, assumptions: [...plan.assumptions, "Plan optimized and reflowed."] };
};

export const buildAgentResponse = (output: PlanOutput, question: string) => {
  const q = question.toLowerCase();
  const port = portsRegistry[output.plan.input.portSlug]?.name ?? output.plan.input.portSlug;
  if (q.includes("late")) return `For ${port}, if you're +20m behind by midday, apply “${output.recommendations[0].label}” then preserve ${output.plan.blocks.find((b) => b.type === "buffer")?.title}.`;
  if (q.includes("food") || q.includes("lunch")) {
    const food = output.plan.blocks.find((block) => /market|food/i.test(block.title));
    return food ? `Best food anchor is ${food.title} at ${food.startTime}; it sits before peak crowd pressure.` : `Use a corridor-adjacent lunch stop before 13:30 in ${port}.`;
  }
  return `Current ${port} strategy is ${output.plan.input.mode} with score ${output.score.totalScore}. Keep final legs near ${portsRegistry[output.plan.input.portSlug].corridorZones[0].name}.`;
};

export const generatePlan = generatePortDayPlan;

export function buildCruiseDashboard(cruise: Cruise, plansByDayId: Record<string, PlanOutput>): CruiseDashboard {
  const dayScores = cruise.itinerary.map((day) => ({ id: day.id, score: plansByDayId[day.id]?.score.totalScore ?? 0 }));
  const riskDay = [...dayScores].sort((a, b) => a.score - b.score)[0];
  const intensiveRuns = cruise.itinerary.reduce((acc, day, index, arr) => {
    if (day.pace === "intense" && arr[index - 1]?.pace === "intense") return acc + 1;
    return acc;
  }, 0);
  const energyPacingScore = Math.max(30, 100 - intensiveRuns * 12 - cruise.itinerary.filter((day) => day.pace === "intense").length * 5);

  const budgetEstimateTotal = Object.values(plansByDayId).reduce((sum, plan) => sum + plan.plan.blocks.reduce((s, block) => s + block.costEUR, 0), 0);
  const excursionBenchmarkTotal = cruise.itinerary.length * 110;

  return {
    energyPacingScore,
    riskConcentrationDayId: riskDay?.id,
    budgetEstimateTotal,
    excursionBenchmarkTotal,
    savingsEstimateTotal: Math.max(0, excursionBenchmarkTotal - budgetEstimateTotal),
  };
}

export function createPortDayFromPort(portSlug: string, date: string): PortDay {
  const port = portsRegistry[portSlug] ?? portsRegistry.barcelona;
  return {
    id: `${portSlug}-${date}`,
    date,
    portSlug,
    portName: port.name,
    arrivalTime: port.defaultTimeWindows.gangwayOpen,
    onboardTime: port.defaultTimeWindows.gangwayOpen,
    allAboardTime: "18:00",
    dockMode: port.dockingModeDefault,
    walkingPreference: "moderate",
    pace: "normal",
    riskTolerance: "balanced",
    interests: ["food", "culture", "views"],
    locked: false,
    status: "not-planned",
  };
}
