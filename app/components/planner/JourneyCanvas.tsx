"use client";

import type { PlanBlock } from "@/app/lib/planner/types";

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

const tone = (block: PlanBlock) => {
  if (block.type === "buffer") return "from-emerald-500/25 to-emerald-400/10 border-emerald-300/40";
  if (block.type === "transfer") return "from-violet-500/25 to-violet-400/10 border-violet-300/40";
  if (/food|market|tapas/i.test(block.title)) return "from-amber-500/25 to-amber-400/10 border-amber-300/40";
  return "from-cyan-500/25 to-cyan-400/10 border-cyan-300/40";
};

export default function JourneyCanvas({
  blocks,
  dayStart,
  dayEnd,
  highlightedIds = [],
  proposal,
  onOpenStop,
}: {
  blocks: PlanBlock[];
  dayStart: string;
  dayEnd: string;
  highlightedIds?: string[];
  proposal?: string;
  onOpenStop: (id: string) => void;
}) {
  const start = toMin(dayStart);
  const end = toMin(dayEnd);
  const total = Math.max(1, end - start);

  return (
    <section className="relative rounded-[28px] border border-white/10 bg-[#0C1528] p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-base font-semibold">Journey canvas</p>
        <p className="text-xs text-slate-400">{dayStart} → {dayEnd}</p>
      </div>

      {proposal && (
        <div className="mb-4 rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-3 text-xs text-cyan-100">
          AI proposal: {proposal}
        </div>
      )}

      <div className="relative h-72 overflow-hidden rounded-2xl bg-slate-950/50">
        <div className="absolute inset-x-0 top-8 h-px bg-white/20" />
        <div className="absolute inset-x-0 top-24 h-px bg-white/10" />
        <div className="absolute inset-x-0 top-40 h-px bg-white/10" />
        <div className="absolute inset-x-0 top-56 h-px bg-white/20" />

        {blocks.map((block, index) => {
          const left = ((toMin(block.startTime) - start) / total) * 100;
          const width = Math.max(12, (block.durationMin / total) * 100);
          const rowTop = 16 + (index % 4) * 52;
          return (
            <button
              key={block.id}
              type="button"
              onClick={() => onOpenStop(block.id)}
              className={`absolute rounded-xl border bg-gradient-to-br px-3 py-2 text-left shadow-[0_14px_30px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] ${tone(block)} ${highlightedIds.includes(block.id) ? "ring-2 ring-cyan-300 animate-pulse" : ""}`}
              style={{ left: `${left}%`, width: `${width}%`, top: rowTop }}
            >
              <p className="truncate text-[11px] text-slate-200">{block.startTime} · {block.durationMin}m</p>
              <p className="truncate text-sm font-semibold">{block.title}</p>
              <p className="truncate text-[11px] text-slate-300">{block.type === "transfer" ? block.transitMode : block.whyThisHere}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
