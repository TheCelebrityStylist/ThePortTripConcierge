import type { PlanBlock } from "@/app/lib/planner/types";

export type TimelineNodeKind = "stop" | "transfer" | "buffer";

export type TimelineNodeViewModel = {
  id: string;
  blockId: string;
  kind: TimelineNodeKind;
  title: string;
  startTime: string;
  endTime: string;
  durationMin: number;
  costEUR: number;
  transitMode: string;
  summary: string;
  runningLateDecision: string;
  lock: boolean;
  icon: string;
  offsetMinutes: number;
  topPx: number;
  heightPx: number;
  isChanged: boolean;
  isWeakLeg: boolean;
};

export type TimelineViewModel = {
  totalMinutes: number;
  canvasHeight: number;
  corridorStartPx?: number;
  corridorHeightPx?: number;
  nodes: TimelineNodeViewModel[];
};

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const nodeIcon = (block: PlanBlock) => {
  if (block.type === "buffer") return "🛟";
  if (block.type === "transfer") {
    if (block.transitMode === "taxi") return "🚕";
    if (block.transitMode === "metro") return "🚇";
    if (block.transitMode === "bus") return "🚌";
    return "🚶";
  }
  if (/food|market|tapas|lunch/i.test(block.title)) return "🍽️";
  return "✦";
};

const nodeSummary = (block: PlanBlock) => {
  if (block.type === "transfer") return block.guidance;
  if (block.type === "buffer") return block.guidance;
  return block.whyThisHere;
};

const nodeMinHeight = (block: PlanBlock) => {
  if (block.type === "buffer") return 88;
  if (block.type === "transfer") return 32;
  return 72;
};

export function mapPlanToTimelineViewModel({
  blocks,
  dayStart,
  dayEnd,
  changedIds = [],
  weakLegId,
}: {
  blocks: PlanBlock[];
  dayStart: string;
  dayEnd: string;
  changedIds?: string[];
  weakLegId?: string;
}): TimelineViewModel {
  const sorted = [...blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  const startMinutes = toMinutes(dayStart);
  const endMinutes = toMinutes(dayEnd);
  const totalMinutes = Math.max(1, endMinutes - startMinutes);
  const pxPerMinute = 1.65;
  const canvasHeight = Math.max(760, Math.round(totalMinutes * pxPerMinute) + 120);
  const usableHeight = canvasHeight - 80;
  const corridor = sorted.find((block) => block.type === "buffer");

  const nodes = sorted.map((block) => {
    const offsetMinutes = Math.max(0, toMinutes(block.startTime) - startMinutes);
    const topPx = 24 + (offsetMinutes / totalMinutes) * usableHeight;
    const durationHeight = (block.durationMin / totalMinutes) * usableHeight;
    const heightPx = Math.max(nodeMinHeight(block), durationHeight);

    return {
      id: `timeline-${block.id}`,
      blockId: block.id,
      kind: block.type,
      title: block.title,
      startTime: block.startTime,
      endTime: block.endTime,
      durationMin: block.durationMin,
      costEUR: block.costEUR,
      transitMode: block.transitMode,
      summary: nodeSummary(block),
      runningLateDecision: block.runningLateDecision,
      lock: block.lock,
      icon: nodeIcon(block),
      offsetMinutes,
      topPx,
      heightPx,
      isChanged: changedIds.includes(block.id),
      isWeakLeg: weakLegId === block.id,
    } satisfies TimelineNodeViewModel;
  });

  const corridorStartPx = corridor ? nodes.find((node) => node.blockId === corridor.id)?.topPx : undefined;
  const corridorHeightPx = corridor ? nodes.find((node) => node.blockId === corridor.id)?.heightPx : undefined;

  return {
    totalMinutes,
    canvasHeight,
    corridorStartPx,
    corridorHeightPx,
    nodes,
  };
}
