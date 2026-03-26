"use client";

import type { PlanBlock } from "@/app/lib/planner/types";

const modeIcon = (block: PlanBlock) => {
  if (block.type === "buffer") return "🛟";
  if (block.type === "transfer") return block.transitMode === "taxi" ? "🚕" : block.transitMode === "metro" ? "🚇" : "🚶";
  if (/food|market/i.test(block.title)) return "🍽️";
  return "📍";
};

export default function PlanCard({
  block,
  selected,
  expanded,
  onExpand,
  onLock,
  onConvert,
  onUpdate,
}: {
  block: PlanBlock;
  selected: boolean;
  expanded: boolean;
  onExpand: () => void;
  onLock: () => void;
  onConvert: () => void;
  onUpdate: (next: Partial<PlanBlock>) => void;
}) {
  return (
    <article className={`rounded-[24px] border bg-[#0E182B] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-cyan-300/30 ${selected ? "border-cyan-300/60 ring-1 ring-cyan-300/40" : "border-white/10"}`}>
      <div className="flex items-start justify-between gap-3">
        <button onClick={onExpand} className="flex min-w-0 items-start gap-3 text-left">
          <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm">{modeIcon(block)}</span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{block.title}</p>
            <p className="text-sm text-slate-400">{block.startTime}–{block.endTime}</p>
            <p className="mt-1 line-clamp-1 text-xs text-slate-400">{block.whyThisHere}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-slate-900 px-2 py-1">{block.durationMin}m</span>
              <span className="rounded-full bg-slate-900 px-2 py-1">€{block.costEUR}</span>
              {block.lock && <span className="rounded-full bg-cyan-500/20 px-2 py-1 text-cyan-200">Must-do</span>}
            </div>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <button onClick={onLock} className={`rounded-xl px-3 py-2 text-xs ${block.lock ? "bg-cyan-400 text-slate-900" : "bg-slate-900 text-slate-200"}`}>{block.lock ? "Locked" : "Lock"}</button>
          <details className="relative">
            <summary className="cursor-pointer list-none rounded-xl bg-slate-900 px-3 py-2 text-xs">⋯</summary>
            <div className="absolute right-0 z-20 mt-2 w-36 rounded-xl border border-white/10 bg-slate-900 p-1 text-xs">
              <button onClick={onConvert} className="block w-full rounded-lg px-2 py-1 text-left hover:bg-white/10">Convert</button>
            </div>
          </details>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-900/60 p-3 md:grid-cols-2">
          <label className="text-xs text-slate-300">Title<input value={block.title} onChange={(event) => onUpdate({ title: event.target.value })} className="mt-1 w-full rounded-xl bg-slate-800 p-2" /></label>
          <label className="text-xs text-slate-300">Transit<select value={block.transitMode} onChange={(event) => onUpdate({ transitMode: event.target.value })} className="mt-1 w-full rounded-xl bg-slate-800 p-2"><option>walk</option><option>taxi</option><option>metro</option><option>bus</option><option>tram</option></select></label>
          <label className="text-xs text-slate-300">Duration<input type="number" min={10} value={block.durationMin} onChange={(event) => onUpdate({ durationMin: Number(event.target.value) })} className="mt-1 w-full rounded-xl bg-slate-800 p-2" /></label>
          <label className="text-xs text-slate-300">Cost<input type="number" min={0} value={block.costEUR} onChange={(event) => onUpdate({ costEUR: Number(event.target.value) })} className="mt-1 w-full rounded-xl bg-slate-800 p-2" /></label>
          <label className="text-xs text-slate-300 md:col-span-2">Notes<input value={block.guidance} onChange={(event) => onUpdate({ guidance: event.target.value })} className="mt-1 w-full rounded-xl bg-slate-800 p-2" /></label>
        </div>
      )}
    </article>
  );
}
