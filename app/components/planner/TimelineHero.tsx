"use client";

import { useMemo } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";

const toMinutes = (value: string) => {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
};

const transitLabel = (block: PlanBlock) => {
  if (block.type === "buffer") return "Return-safe corridor";
  if (block.type === "transfer") return `${block.transitMode} transfer`;
  return block.lock ? "Locked stop" : "Stop";
};

const itemTone = (block: PlanBlock, isWeakLeg: boolean) => {
  if (block.type === "buffer") {
    return {
      rail: "bg-emerald-300/70",
      dot: "border-emerald-200 bg-emerald-400 shadow-[0_0_0_8px_rgba(16,185,129,0.15)]",
      panel: "border-emerald-300/30 bg-emerald-500/10",
      eyebrow: "text-emerald-100",
    };
  }
  if (block.type === "transfer") {
    return {
      rail: "bg-slate-500/80",
      dot: "border-slate-200/80 bg-slate-700",
      panel: "border-white/8 bg-slate-950/35",
      eyebrow: "text-slate-300",
    };
  }
  if (isWeakLeg) {
    return {
      rail: "bg-amber-300/80",
      dot: "border-amber-100 bg-amber-400 shadow-[0_0_0_8px_rgba(245,158,11,0.12)]",
      panel: "border-amber-300/30 bg-amber-500/10",
      eyebrow: "text-amber-100",
    };
  }
  return {
    rail: "bg-cyan-300/80",
    dot: "border-cyan-100 bg-cyan-400 shadow-[0_0_0_8px_rgba(34,211,238,0.12)]",
    panel: "border-white/10 bg-[#101A2D]",
    eyebrow: "text-cyan-100",
  };
};

const blockSummary = (block: PlanBlock) => {
  if (block.type === "transfer") return block.guidance;
  if (block.type === "buffer") return block.guidance;
  return block.whyThisHere;
};

export default function TimelineHero({
  blocks,
  dayStart,
  dayEnd,
  changedIds = [],
  weakLegId,
  onOpenStop,
}: {
  blocks: PlanBlock[];
  dayStart: string;
  dayEnd: string;
  changedIds?: string[];
  weakLegId?: string;
  onOpenStop: (id: string) => void;
}) {
  const sorted = useMemo(() => [...blocks].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime)), [blocks]);
  const totalMinutes = Math.max(1, toMinutes(dayEnd) - toMinutes(dayStart));
  const corridorBlock = [...sorted].reverse().find((block) => block.type === "buffer");

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#0D1526] px-6 py-6 shadow-[0_30px_80px_rgba(2,8,24,0.28)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Timeline Hero</p>
          <p className="mt-2 text-xl font-semibold text-slate-100">A clear route from arrival to all aboard.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1">{dayStart} arrival</span>
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1">{dayEnd} all aboard</span>
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1">{totalMinutes} min day window</span>
        </div>
      </div>

      {corridorBlock && (
        <div className="mt-5 rounded-2xl border border-emerald-300/25 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-50">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-medium">Return-safe corridor protected.</p>
              <p className="text-xs text-emerald-100/80">{corridorBlock.startTime}–{corridorBlock.endTime} held back for queues, traffic, and boarding friction.</p>
            </div>
            <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-100">Buffer {corridorBlock.durationMin}m</span>
          </div>
        </div>
      )}

      <div className="relative mt-6">
        <div className="pointer-events-none absolute left-[95px] top-2 hidden h-[calc(100%-24px)] w-px bg-gradient-to-b from-cyan-300/60 via-slate-500/30 to-emerald-300/70 md:block" />

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/8 bg-slate-950/25 px-4 py-3 md:grid-cols-[76px_1fr] md:items-center md:px-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Start</div>
            <div>
              <p className="text-sm font-medium text-slate-100">Arrive in port and clear the terminal.</p>
              <p className="mt-1 text-xs text-slate-400">Use this as the anchor for everything that follows in the route.</p>
            </div>
          </div>

          {sorted.map((block, index) => {
            const isWeakLeg = weakLegId === block.id;
            const tone = itemTone(block, isWeakLeg);
            const changed = changedIds.includes(block.id);
            const previousEnd = index === 0 ? toMinutes(dayStart) : toMinutes(sorted[index - 1].endTime);
            const spacing = Math.max(0, toMinutes(block.startTime) - previousEnd);

            return (
              <div key={block.id} className="grid grid-cols-1 gap-3 md:grid-cols-[76px_30px_minmax(0,1fr)] md:gap-4">
                <div className="pt-2 text-left md:text-right">
                  <p className="text-sm font-semibold text-slate-100">{block.startTime}</p>
                  <p className="text-[11px] text-slate-400">{block.durationMin}m</p>
                  {spacing > 0 && <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-slate-500">+{spacing}m gap</p>}
                </div>

                <div className="hidden items-start justify-center md:flex">
                  <div className="flex h-full w-full flex-col items-center">
                    <div className={`mt-2 h-3 w-3 rounded-full border ${tone.dot}`} />
                    {index < sorted.length - 1 && <div className={`mt-2 w-px flex-1 ${tone.rail}`} />}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStop(block.id)}
                  className={`rounded-[26px] border px-5 py-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 ${tone.panel} ${changed ? "ring-2 ring-cyan-300/70" : ""}`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[11px] uppercase tracking-[0.2em] ${tone.eyebrow}`}>{transitLabel(block)}</span>
                        {block.lock && <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">Must-do</span>}
                        {isWeakLeg && <span className="rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-100">Weak leg</span>}
                        {changed && <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">Updated</span>}
                      </div>
                      <p className="mt-2 text-lg font-semibold text-slate-100">{block.title}</p>
                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{blockSummary(block)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2 text-[11px] text-slate-300 md:max-w-[220px] md:justify-end">
                      <span className="rounded-full bg-slate-950/55 px-3 py-1">{block.startTime}–{block.endTime}</span>
                      <span className="rounded-full bg-slate-950/55 px-3 py-1">€{block.costEUR}</span>
                      <span className="rounded-full bg-slate-950/55 px-3 py-1">{block.type === "transfer" ? block.transitMode : "on route"}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-slate-400">
                    <span>{block.runningLateDecision}</span>
                    <span>Open inspector</span>
                  </div>
                </button>
              </div>
            );
          })}

          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-white/8 bg-slate-950/25 px-4 py-3 md:grid-cols-[76px_1fr] md:items-center md:px-5">
            <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Finish</div>
            <div>
              <p className="text-sm font-medium text-slate-100">All aboard by {dayEnd}.</p>
              <p className="mt-1 text-xs text-slate-400">The route tapers into the ship-safe corridor so the day ends calmly, not in a rush.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
