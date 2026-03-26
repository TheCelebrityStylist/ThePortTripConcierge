"use client";

import type { PlanBlock } from "@/app/lib/planner/types";

type Props = {
  block: PlanBlock;
  leftPct: number;
  widthPct: number;
  selected: boolean;
  onSelect: () => void;
  onDragPointerDown: (event: React.PointerEvent) => void;
  onResizePointerDown: (event: React.PointerEvent) => void;
};

const tone = (type: PlanBlock["type"]) => {
  if (type === "transfer") return "bg-sky-500/30 border-sky-300/50";
  if (type === "buffer") return "bg-emerald-500/30 border-emerald-300/50";
  return "bg-violet-500/25 border-violet-300/50";
};

export default function TimelineBlock({ block, leftPct, widthPct, selected, onSelect, onDragPointerDown, onResizePointerDown }: Props) {
  return (
    <div
      className={`absolute top-3 h-20 rounded-xl border ${tone(block.type)} ${selected ? "ring-2 ring-cyan-300" : ""} ${block.lock ? "opacity-80" : ""}`}
      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: 48 }}
      onClick={onSelect}
      onPointerDown={block.lock ? undefined : onDragPointerDown}
      role="button"
      tabIndex={0}
    >
      <div className="px-2 py-1">
        <p className="truncate text-xs font-semibold">{block.title}</p>
        <p className="text-[10px] text-slate-200/80">{block.startTime}–{block.endTime}</p>
      </div>
      {!block.lock && <div className="absolute bottom-0 right-0 h-full w-2 cursor-ew-resize rounded-r-xl bg-white/20" onPointerDown={onResizePointerDown} />}
    </div>
  );
}
