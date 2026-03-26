"use client";

import { useMemo } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";
import { mapPlanToTimelineViewModel } from "./timeline/mapPlanToTimelineViewModel";

const endMarkerTone = {
  dot: "border-emerald-100 bg-emerald-400 shadow-[0_0_0_10px_rgba(16,185,129,0.14)]",
};

const nodeTone = (kind: "stop" | "transfer" | "buffer", isWeakLeg: boolean) => {
  if (kind === "buffer") {
    return {
      dot: "border-emerald-100 bg-emerald-400 shadow-[0_0_0_10px_rgba(16,185,129,0.14)]",
      panel: "border-emerald-300/25 bg-emerald-500/10",
      label: "text-emerald-100",
      meta: "bg-emerald-400/10 text-emerald-50",
    };
  }
  if (kind === "transfer") {
    return {
      dot: "border-slate-300/70 bg-slate-700",
      panel: "border-white/8 bg-slate-950/28",
      label: "text-slate-300",
      meta: "bg-slate-900/65 text-slate-200",
    };
  }
  if (isWeakLeg) {
    return {
      dot: "border-amber-100 bg-amber-400 shadow-[0_0_0_10px_rgba(245,158,11,0.12)]",
      panel: "border-amber-300/25 bg-amber-500/10",
      label: "text-amber-100",
      meta: "bg-amber-400/10 text-amber-50",
    };
  }
  return {
    dot: "border-cyan-100 bg-cyan-400 shadow-[0_0_0_10px_rgba(34,211,238,0.12)]",
    panel: "border-white/10 bg-[#101A2D]",
    label: "text-cyan-100",
    meta: "bg-slate-900/65 text-slate-100",
  };
};

export default function TimelineHero({
  blocks,
  dayStart,
  dayEnd,
  changedIds = [],
  diffLabel,
  weakLegId,
  onOpenStop,
}: {
  blocks: PlanBlock[];
  dayStart: string;
  dayEnd: string;
  changedIds?: string[];
  diffLabel?: string;
  weakLegId?: string;
  onOpenStop: (id: string) => void;
}) {
  const timeline = useMemo(() => mapPlanToTimelineViewModel({ blocks, dayStart, dayEnd, changedIds, weakLegId }), [blocks, changedIds, dayStart, dayEnd, weakLegId]);

  return (
    <section className="rounded-[34px] border border-white/10 bg-[#0C1526] px-6 py-6 shadow-[0_32px_90px_rgba(2,8,24,0.32)]">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Timeline Hero</p>
          <p className="mt-2 text-xl font-semibold text-slate-100">A vertical journey from arrival to all aboard.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-slate-300">
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1">{dayStart} arrival</span>
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1">{dayEnd} all aboard</span>
          <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1">{timeline.totalMinutes} min route</span>
        </div>
      </div>

      {diffLabel && (
        <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-400/8 px-4 py-3 text-sm text-cyan-50">
          <p className="font-medium">{diffLabel}</p>
        </div>
      )}

      <div className="relative mt-6 overflow-hidden rounded-[28px] border border-white/8 bg-slate-950/30 px-4 py-5 md:px-6">
        {timeline.corridorStartPx !== undefined && timeline.corridorHeightPx !== undefined && (
          <div
            className="pointer-events-none absolute left-[102px] right-4 rounded-[24px] border border-emerald-300/20 bg-emerald-500/8 md:left-[154px]"
            style={{ top: timeline.corridorStartPx - 10, height: timeline.corridorHeightPx + 20 }}
          />
        )}

        <div className="pointer-events-none absolute bottom-12 left-[117px] top-8 hidden w-px bg-gradient-to-b from-cyan-300/70 via-slate-500/25 to-emerald-300/80 md:block" />

        <div className="relative" style={{ height: timeline.canvasHeight }}>
          <div className="absolute left-0 top-0 flex w-full items-start gap-4 md:gap-6">
            <div className="w-[88px] pt-1 text-right md:w-[120px]">
              <p className="text-sm font-semibold text-slate-100">{dayStart}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Arrival</p>
            </div>
            <div className="hidden md:block">
              <div className="mt-1 h-4 w-4 rounded-full border border-cyan-100 bg-cyan-400 shadow-[0_0_0_10px_rgba(34,211,238,0.12)]" />
            </div>
            <div className="pt-0.5">
              <p className="text-sm font-medium text-slate-100">Arrive in port and clear the terminal.</p>
              <p className="mt-1 text-xs text-slate-400">The timeline below is spaced by actual clock time, not by list order.</p>
            </div>
          </div>

          {timeline.nodes.map((node) => {
            const tone = nodeTone(node.kind, node.isWeakLeg);
            return (
              <div key={node.id} className="absolute left-0 right-0 flex gap-4 md:gap-6" style={{ top: node.topPx }}>
                <div className="w-[88px] pt-1 text-right md:w-[120px]">
                  <p className="text-sm font-semibold text-slate-100">{node.startTime}</p>
                  <p className="text-[11px] text-slate-400">{node.durationMin}m</p>
                </div>

                <div className="hidden w-4 md:flex md:justify-center">
                  <div className={`mt-2 h-4 w-4 rounded-full border ${tone.dot}`} />
                </div>

                <button
                  type="button"
                  onClick={() => onOpenStop(node.blockId)}
                  className={`relative flex-1 rounded-[24px] border px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-cyan-300/30 ${tone.panel} ${node.isChanged ? "ring-2 ring-cyan-300/70" : ""}`}
                  style={{ height: node.heightPx }}
                >
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] uppercase tracking-[0.2em] ${tone.label}`}>{node.kind === "buffer" ? "Return-safe corridor" : node.kind === "transfer" ? `${node.transitMode} transfer` : "Stop"}</span>
                          {node.lock && <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">Must-do</span>}
                          {node.isWeakLeg && <span className="rounded-full border border-amber-300/25 bg-amber-400/10 px-2 py-0.5 text-[10px] text-amber-100">Weak leg</span>}
                          {node.isChanged && <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100">Updated</span>}
                        </div>
                        <p className="mt-2 text-lg font-semibold text-slate-100">{node.icon} {node.title}</p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{node.summary}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2 text-[11px]">
                        <span className={`rounded-full px-3 py-1 ${tone.meta}`}>{node.startTime}–{node.endTime}</span>
                        <span className={`rounded-full px-3 py-1 ${tone.meta}`}>€{node.costEUR}</span>
                        <span className={`rounded-full px-3 py-1 ${tone.meta}`}>{node.kind === "transfer" ? node.transitMode : `${node.durationMin}m`}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-white/8 pt-3 text-xs text-slate-400">
                      <span>{node.runningLateDecision}</span>
                      <span>Open inspector</span>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          <div className="absolute bottom-0 left-0 flex w-full items-end gap-4 md:gap-6">
            <div className="w-[88px] pb-1 text-right md:w-[120px]">
              <p className="text-sm font-semibold text-slate-100">{dayEnd}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">All aboard</p>
            </div>
            <div className="hidden md:block">
              <div className={`mb-1 h-4 w-4 rounded-full border ${endMarkerTone.dot}`} />
            </div>
            <div className="pb-1">
              <p className="text-sm font-medium text-slate-100">Finish inside the ship-safe return corridor.</p>
              <p className="mt-1 text-xs text-slate-400">The day closes with a clearly protected final return, not another stop card.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
