"use client";

import { useMemo } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const blockTone = (block: PlanBlock) => {
  if (block.type === "buffer") return "border-emerald-300/40 bg-emerald-500/10";
  if (block.type === "transfer") return "border-slate-500/40 bg-slate-700/30";
  if (/food|market|tapas|lunch/i.test(block.title)) return "border-amber-300/40 bg-amber-500/10";
  return "border-cyan-300/40 bg-cyan-500/10";
};

export default function VisualRouteBoard({
  blocks,
  dayStart,
  dayEnd,
  changedIds = [],
  diffLabel,
  onOpenStop,
}: {
  blocks: PlanBlock[];
  dayStart: string;
  dayEnd: string;
  changedIds?: string[];
  diffLabel?: string;
  onOpenStop: (id: string) => void;
}) {
  const sorted = useMemo(() => [...blocks].sort((a, b) => toMin(a.startTime) - toMin(b.startTime)), [blocks]);
  const start = toMin(dayStart);
  const end = toMin(dayEnd);
  const total = Math.max(1, end - start);

  return (
    <section className="rounded-[28px] border border-white/10 bg-[#0D1526] p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold">Route board</p>
        <p className="text-xs text-slate-400">{dayStart} → {dayEnd}</p>
      </div>

      {diffLabel && <div className="mb-4 rounded-2xl border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-100">{diffLabel}</div>}

      <div className="relative rounded-2xl bg-slate-950/45 p-5">
        <div className="relative h-1 rounded bg-white/15" />
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {sorted.map((block) => {
            const offset = ((toMin(block.startTime) - start) / total) * 100;
            return (
              <button
                key={block.id}
                type="button"
                onClick={() => onOpenStop(block.id)}
                className={`min-w-[220px] rounded-2xl border p-3 text-left shadow-[0_14px_34px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 ${blockTone(block)} ${changedIds.includes(block.id) ? "ring-2 ring-cyan-300" : ""}`}
                style={{ marginLeft: `${Math.max(0, Math.min(offset, 16))}%` }}
              >
                <p className="text-[11px] text-slate-300">{block.startTime}–{block.endTime}</p>
                <p className="truncate text-sm font-semibold">{block.title}</p>
                <p className="mt-1 line-clamp-2 text-xs text-slate-300">{block.whyThisHere}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
