"use client";

import { useMemo, useState } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const icon = (block: PlanBlock) => {
  if (block.type === "buffer") return "🛟";
  if (block.type === "transfer") return block.transitMode === "taxi" ? "🚕" : block.transitMode === "metro" ? "🚇" : "🚶";
  if (/food|market|tapas|lunch/i.test(block.title)) return "🍽️";
  return "📍";
};

export default function ItineraryFlow({
  blocks,
  highlightedIds = [],
  onOpenStop,
}: {
  blocks: PlanBlock[];
  highlightedIds?: string[];
  onOpenStop: (id: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const sorted = useMemo(() => [...blocks].sort((a, b) => toMin(a.startTime) - toMin(b.startTime)), [blocks]);

  return (
    <section className="rounded-[26px] border border-white/10 bg-[#0D1526] p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-lg font-semibold">Itinerary flow</p>
        <p className="text-xs text-slate-400">Calm sequence with clear cut logic</p>
      </div>

      <div className="relative pl-6">
        <div className="absolute bottom-0 left-2 top-0 w-px bg-gradient-to-b from-cyan-300/50 via-cyan-300/20 to-transparent" />

        <div className="space-y-3">
          {sorted.map((block) => {
            const expanded = expandedId === block.id;
            return (
              <article key={block.id} className={`rounded-2xl border bg-slate-900/65 p-4 transition ${highlightedIds.includes(block.id) ? "border-cyan-300/50 ring-1 ring-cyan-300/40" : "border-white/10"}`}>
                <button
                  type="button"
                  onClick={() => {
                    setExpandedId(expanded ? null : block.id);
                    onOpenStop(block.id);
                  }}
                  className="flex w-full items-start justify-between gap-3 text-left"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-sm">{icon(block)}</span>
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">{block.title}</p>
                      <p className="text-sm text-slate-400">{block.startTime}–{block.endTime} · {block.whyThisHere}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                        <span className="rounded-full bg-slate-800 px-2 py-1">{block.durationMin}m</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">€{block.costEUR}</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">{block.type === "transfer" ? block.transitMode : "on-foot"}</span>
                        {block.lock && <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-200">Must-do</span>}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{expanded ? "Hide" : "Details"}</span>
                </button>

                {expanded && (
                  <div className="mt-3 grid gap-2 rounded-xl bg-slate-950/60 p-3 text-xs text-slate-300 md:grid-cols-2">
                    <p><span className="text-slate-400">Route note:</span> {block.guidance}</p>
                    <p><span className="text-slate-400">If behind:</span> {block.runningLateDecision}</p>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
