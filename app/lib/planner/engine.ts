import { portsRegistry } from "@/app/data/ports";
import type { InterestTag, PlanBlock, PlanInput, PlanOutput, Port, ScoreCard } from "./types";

const toMin = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
const toTime = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

const seedInt = (seed: string) => Array.from(seed).reduce((acc, c) => (acc * 33 + c.charCodeAt(0)) % 2147483647, 97);
const seeded = (seed: string) => {
  let x = seedInt(seed);
  return () => {
    x = (x * 48271) % 2147483647;
    return x / 2147483647;
  };
};

const uniqueByTitle = (blocks: PlanBlock[]) => {
  const seen = new Set<string>();
  return blocks.filter((block) => {
    const key = block.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const interestMatch = (tags: InterestTag[], selected: InterestTag[]) => tags.some((tag) => selected.includes(tag));

const routeMode = (port: Port, input: PlanInput) => {
  if (input.mode === "conservative") return "Conservative corridor";
  if (input.mode === "aggressive") return "Far-leg first";
  if (input.mode === "weather-safe") return "Indoor-first fallback";
  if (input.mode === "mobility-easy") return "Low-walk loop";
  return port.dockingMode === "tender" ? "Tender-aware balanced loop" : "Balanced loop";
};

const describeStop = (port: Port, title: string, from: string, watchOut: string, fallback: string, preferenceReason: string, mode: string) =>
  `You’ll spend this block at ${title} with a ${mode.toLowerCase()} strategy. From ${from}, use ${mode.includes("Low-walk") ? "taxi-first routing" : "the quickest available connection"} and keep transitions deliberate. Watch for ${watchOut.toLowerCase()} in this window, and if you lose 20+ minutes, switch to ${fallback}. This stop fits because ${preferenceReason}.`;

export function generatePlan(input: PlanInput): PlanOutput {
  const port = portsRegistry[input.portSlug] ?? portsRegistry.barcelona;
  const seed = `${input.portSlug}-${input.mode}-${input.allAboardTime}-${input.mustReturnBufferMin}-${input.interests.join("|")}-${input.pace}-${input.walkingLevel}-${input.budgetSensitivity}`;
  const rng = seeded(seed);
  const modeLabel = routeMode(port, input);

  const candidateStops = [...port.attractionClusters]
    .filter((stop) => interestMatch(stop.tags, input.interests))
    .sort((a, b) => (rng() > 0.5 ? 1 : -1));

  const selected = candidateStops.slice(0, input.mode === "aggressive" ? 5 : input.mode === "conservative" ? 3 : 4);
  const now = toMin(input.onboardTime);
  const hardReturn = toMin(input.allAboardTime) - input.mustReturnBufferMin;
  let cursor = now;

  const blocks: PlanBlock[] = [];

  const transferLead = port.transportProfiles.sort((a, b) => a.reliabilityRank - b.reliabilityRank)[0];
  const firstTransferDuration = Math.max(12, transferLead.typicalTimeMin[0] + (port.dockingMode === "tender" ? 8 : 0));
  blocks.push({
    id: `${port.slug}-transfer-start`,
    title: `${transferLead.mode.toUpperCase()} corridor: terminal to city core`,
    type: "transfer",
    startTime: toTime(cursor),
    endTime: toTime(cursor + firstTransferDuration),
    durationMin: firstTransferDuration,
    costEUR: transferLead.costRangeEUR[0],
    transitMode: transferLead.mode,
    whyThisHere: "Fastest reliable start leg to avoid wasting the first operational hour.",
    guidance: `Board at controlled stand only; avoid unmetered solicitations.`,
    runningLateDecision: "If queue exceeds 15m, jump to backup mode from transport profile rank #2.",
    lock: true,
  });
  cursor += firstTransferDuration;

  selected.forEach((stop, index) => {
    const duration = Math.max(stop.typicalDurationMin[0], Math.min(stop.typicalDurationMin[1], stop.typicalDurationMin[0] + Math.round(rng() * 20)));
    const transferMode = port.transportProfiles[Math.min(index % port.transportProfiles.length, 3)];
    const transferDuration = Math.max(10, transferMode.typicalTimeMin[0] + Math.round(rng() * 10));

    const preferenceReason = `it aligns with your ${input.interests.join(", ")} priorities and ${input.walkingLevel} walking tolerance`;
    blocks.push({
      id: stop.id,
      title: stop.name,
      type: "stop",
      startTime: toTime(cursor),
      endTime: toTime(cursor + duration),
      durationMin: duration,
      costEUR: stop.costRangeEUR[0] + Math.round(rng() * (stop.costRangeEUR[1] - stop.costRangeEUR[0])),
      transitMode: transferMode.mode,
      whyThisHere: `${stop.cluster} chosen to satisfy ${input.interests.join("/")} while protecting return rhythm.`,
      guidance: describeStop(port, stop.name, index === 0 ? "the arrival corridor" : selected[index - 1]?.name ?? "the prior stop", stop.watchOut, `${port.displayName} Near-Port Fallback Loop`, preferenceReason, modeLabel),
      runningLateDecision: `If ${index + 1} checkpoint is +${15 + index * 5}m late, trim this block by 20m and continue on corridor route.`,
      lock: input.mustDoStops.includes(stop.name),
    });
    cursor += duration;

    if (index < selected.length - 1) {
      blocks.push({
        id: `${stop.id}-transfer`,
        title: `${transferMode.mode.toUpperCase()} link: ${stop.cluster} → ${selected[index + 1].cluster}`,
        type: "transfer",
        startTime: toTime(cursor),
        endTime: toTime(cursor + transferDuration),
        durationMin: transferDuration,
        costEUR: transferMode.costRangeEUR[0],
        transitMode: transferMode.mode,
        whyThisHere: "Explicit transfer leg keeps timing realistic and non-generic.",
        guidance: `Keep boarding/payment ready. If delay starts stacking, skip to return corridor early.`,
        runningLateDecision: "If transfer slips by >12m, drop the next optional cluster.",
        lock: false,
      });
      cursor += transferDuration;
    }
  });

  const remaining = Math.max(20, hardReturn - cursor);
  blocks.push({
    id: `${port.slug}-return-buffer`,
    title: `Return-safe corridor buffer (${port.displayName})`,
    type: "buffer",
    startTime: toTime(cursor),
    endTime: toTime(cursor + remaining),
    durationMin: remaining,
    costEUR: 0,
    transitMode: port.dockingMode === "tender" ? "ferry" : "walk",
    whyThisHere: "Protected final leg to absorb queue/traffic variance before all-aboard.",
    guidance: `Use this time to re-stage at terminal approach and clear security calmly.`,
    runningLateDecision: "If already behind here, skip all optional activity and board immediately.",
    lock: true,
  });

  const normalized = uniqueByTitle(blocks);
  const score = simulatePlan({ input, blocks: normalized, assumptions: [`Route model: ${modeLabel}`, `Docking mode: ${port.dockingMode}`, `Peak windows: ${port.peakCrowdWindows.join(" / ")}`] }, port, input);

  return {
    plan: {
      input,
      blocks: normalized,
      assumptions: [
        `Gangway open assumed at ${port.defaultTimeWindows.gangwayOpen}.`,
        `Last far outbound cutoff: ${port.defaultTimeWindows.lastOutboundCutoff}.`,
        ...port.returnSafeRules.hardRules,
      ],
    },
    score,
    recommendations: [
      { label: "Reduce farthest stop by 25 min", action: "trim-far-stop" },
      { label: "Swap transit mode to higher reliability", action: "swap-transit" },
      { label: "Move lunch earlier to avoid queues", action: "move-lunch-earlier" },
      { label: "Convert to balanced loop near corridor", action: "balanced-loop" },
    ],
    narrative: `Here’s how your ${port.displayName} day flows: start fast off the ship, hit one anchor early, layer in cluster-based stops matched to ${input.interests.join(", ")}, then collapse toward a protected return corridor before all-aboard. This is a ${modeLabel.toLowerCase()} profile tuned for ${input.riskTolerance} risk tolerance with ${input.mustReturnBufferMin} minutes buffered.`,
  };
}

export function simulatePlan(plan: { input: PlanInput; blocks: PlanBlock[]; assumptions?: string[] }, port: Port, input: PlanInput): ScoreCard {
  const violations: string[] = [];
  const returnBlock = plan.blocks.find((block) => block.type === "buffer");
  const bufferHealth = Math.min(100, Math.round(((returnBlock?.durationMin ?? 0) / input.mustReturnBufferMin) * 100));

  const farLate = plan.blocks.some((block) => block.type === "stop" && toMin(block.startTime) > toMin(input.allAboardTime) - 180 && block.durationMin > 60);
  const distanceRisk = farLate ? 42 : 82;

  const transferCount = plan.blocks.filter((block) => block.type === "transfer").length;
  const transferCountRisk = Math.max(30, 92 - transferCount * 12);

  const crowdOverlap = plan.blocks.some((block) => port.peakCrowdWindows.some((window) => {
    const [start, end] = window.split("-");
    const minute = toMin(block.startTime);
    return minute >= toMin(start) && minute <= toMin(end) && block.type === "stop";
  }));
  const crowdOverlapRisk = crowdOverlap ? 48 : 80;

  const tenderFrictionRisk = port.dockingMode === "tender" ? 58 : 88;

  if ((returnBlock?.durationMin ?? 0) < input.mustReturnBufferMin) violations.push("Buffer below requested threshold.");
  if (transferCount > 4) violations.push("Transfer count too high for cruise day reliability.");
  if (farLate) violations.push("Late far-leg activity increases miss-ship exposure.");
  if (port.dockingMode === "tender" && input.mode === "aggressive") violations.push("Aggressive mode at tender port needs stricter return trigger.");

  const totalScore = Math.round((bufferHealth + distanceRisk + transferCountRisk + crowdOverlapRisk + tenderFrictionRisk) / 5);
  return { bufferHealth, distanceRisk, transferCountRisk, crowdOverlapRisk, tenderFrictionRisk, totalScore, violations };
}

export function optimizePlan(plan: { input: PlanInput; blocks: PlanBlock[]; assumptions: string[] }, constraints: { action: "trim-far-stop" | "swap-transit" | "move-lunch-earlier" | "balanced-loop" }, port?: Port) {
  const activePort = port ?? portsRegistry[plan.input.portSlug] ?? portsRegistry.barcelona;
  const blocks = plan.blocks.map((block) => ({ ...block }));

  if (constraints.action === "trim-far-stop") {
    const candidate = [...blocks].reverse().find((block) => block.type === "stop" && !block.lock);
    if (candidate) candidate.durationMin = Math.max(30, candidate.durationMin - 25);
  }

  if (constraints.action === "swap-transit") {
    const better = activePort.transportProfiles.sort((a, b) => a.reliabilityRank - b.reliabilityRank)[0];
    blocks.forEach((block) => {
      if (block.type === "transfer") {
        block.transitMode = better.mode;
        block.title = `${better.mode.toUpperCase()} transfer: optimized connection`;
        block.durationMin = Math.max(10, block.durationMin - 6);
      }
    });
  }

  if (constraints.action === "move-lunch-earlier") {
    const lunch = blocks.find((block) => block.type === "stop" && block.title.toLowerCase().includes("market"));
    if (lunch) lunch.durationMin = Math.max(35, lunch.durationMin - 10);
  }

  if (constraints.action === "balanced-loop") {
    const keep = blocks.filter((block) => block.lock || block.type === "buffer" || block.type === "transfer").slice(0, 6);
    const fallback = activePort.attractionClusters.find((cluster) => cluster.name.includes("Fallback"));
    if (fallback) {
      keep.splice(Math.max(2, keep.length - 1), 0, {
        id: `${fallback.id}-optimized`,
        title: fallback.name,
        type: "stop",
        startTime: "00:00",
        endTime: "00:00",
        durationMin: fallback.typicalDurationMin[0],
        costEUR: fallback.costRangeEUR[0],
        transitMode: "walk",
        whyThisHere: "Closer loop selected to remove outer-leg volatility.",
        guidance: `Stay in corridor; skip all distant legs.`,
        runningLateDecision: "If still late, proceed directly to terminal.",
        lock: false,
      });
    }
    return reflow({ ...plan, blocks: keep }, activePort, plan.input);
  }

  return reflow({ ...plan, blocks }, activePort, plan.input);
}

function reflow(plan: { input: PlanInput; blocks: PlanBlock[]; assumptions: string[] }, port: Port, input: PlanInput) {
  let cursor = toMin(input.onboardTime);
  const withTimes = plan.blocks.map((block) => {
    const next = { ...block, startTime: toTime(cursor), endTime: toTime(cursor + block.durationMin) };
    cursor += block.durationMin;
    return next;
  });
  const score = simulatePlan({ input, blocks: withTimes }, port, input);
  return {
    ...plan,
    blocks: withTimes,
    assumptions: [...plan.assumptions, `Optimization applied: ${new Date().toISOString()}`],
    score,
  };
}

export function buildAgentResponse(plan: PlanOutput, question: string) {
  const q = question.toLowerCase();
  if (q.includes("late")) {
    return `You are currently running a score of ${plan.score.totalScore}. If you're 20+ minutes late by midpoint, immediately apply “${plan.recommendations[0].label}”, then head to ${plan.plan.blocks.find((b) => b.type === "buffer")?.title}.`;
  }
  if (q.includes("lunch") || q.includes("food")) {
    const foodStop = plan.plan.blocks.find((block) => block.title.toLowerCase().includes("market") || block.title.toLowerCase().includes("food"));
    return foodStop
      ? `Your best food anchor is ${foodStop.title} at ${foodStop.startTime}. It sits before peak crowd pressure and keeps return safety intact.`
      : "Use a corridor-adjacent food stop before 13:30 to avoid queue drag and protect your return buffer.";
  }
  return `Based on ${plan.plan.input.portSlug}, your ${plan.plan.input.mode} strategy, and current risks (${plan.score.violations.join(" ") || "none critical"}), keep your final two blocks corridor-adjacent and avoid adding a new far leg late.`;
}
