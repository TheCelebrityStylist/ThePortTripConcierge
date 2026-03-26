"use client";

import { toMinutes, toTime } from "./timelineUtils";

export default function TimeAxis({ start, end }: { start: string; end: string }) {
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  const slots: string[] = [];
  for (let m = startMin; m <= endMin; m += 60) slots.push(toTime(m));

  return (
    <div className="relative mb-2 h-8 rounded-lg bg-slate-900/80">
      {slots.map((slot, idx) => (
        <div key={slot} className="absolute top-1 text-[10px] text-slate-400" style={{ left: `${(idx / Math.max(1, slots.length - 1)) * 100}%`, transform: "translateX(-50%)" }}>
          {slot}
        </div>
      ))}
    </div>
  );
}
