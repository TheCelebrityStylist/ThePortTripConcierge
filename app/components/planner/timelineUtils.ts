import type { PlanBlock } from "@/app/lib/planner/types";

export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

export const toTime = (minutes: number) => {
  const clamped = Math.max(0, Math.round(minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const snapValue = (value: number, step: number) => Math.round(value / step) * step;

export const resolveCollisions = (blocks: PlanBlock[], dayStart: number, dayEnd: number) => {
  const sorted = [...blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  let cursor = dayStart;

  return sorted.map((block) => {
    const start = Math.max(cursor, toMinutes(block.startTime));
    const end = Math.min(dayEnd, start + block.durationMin);
    cursor = end;
    return { ...block, startTime: toTime(start), endTime: toTime(end), durationMin: Math.max(10, end - start) };
  });
};

export const shiftBlock = (block: PlanBlock, nextStart: number, dayStart: number, dayEnd: number) => {
  const duration = Math.max(10, block.durationMin);
  const start = Math.max(dayStart, Math.min(nextStart, dayEnd - duration));
  const end = start + duration;
  return { ...block, startTime: toTime(start), endTime: toTime(end) };
};
