"use client";

import { useMemo, useState } from "react";
import type { PlanBlock } from "@/app/lib/planner/types";
import StopDrawer from "./StopDrawer";
import TimeAxis from "./TimeAxis";
import TimelineBlock from "./TimelineBlock";
import { resolveCollisions, shiftBlock, snapValue, toMinutes } from "./timelineUtils";

export default function TimelineBoard({
  blocks,
  dayStart,
  dayEnd,
  onChange,
}: {
  blocks: PlanBlock[];
  dayStart: string;
  dayEnd: string;
  onChange: (next: PlanBlock[]) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftBlocks, setDraftBlocks] = useState<PlanBlock[] | null>(null);

  const viewBlocks = draftBlocks ?? blocks;
  const startMin = toMinutes(dayStart);
  const endMin = toMinutes(dayEnd);
  const totalMin = Math.max(1, endMin - startMin);

  const selected = viewBlocks.find((b) => b.id === selectedId);

  const moveBlock = (base: PlanBlock[], blockId: string, deltaPct: number, event: PointerEvent) => {
    const step = event.shiftKey ? 1 : event.altKey ? 15 : 5;
    return base.map((block) => {
      if (block.id !== blockId || block.lock) return block;
      const deltaMin = (deltaPct / 100) * totalMin;
      const nextStart = snapValue(toMinutes(block.startTime) + deltaMin, step);
      return shiftBlock(block, nextStart, startMin, endMin);
    });
  };

  const resizeBlock = (base: PlanBlock[], blockId: string, deltaPct: number, event: PointerEvent) => {
    const step = event.shiftKey ? 1 : event.altKey ? 15 : 5;
    return base.map((block) => {
      if (block.id !== blockId || block.lock) return block;
      const deltaMin = snapValue((deltaPct / 100) * totalMin, step);
      const durationMin = Math.max(10, Math.min(endMin - toMinutes(block.startTime), block.durationMin + deltaMin));
      const start = toMinutes(block.startTime);
      return {
        ...block,
        durationMin,
        endTime: `${String(Math.floor((start + durationMin) / 60)).padStart(2, "0")}:${String((start + durationMin) % 60).padStart(2, "0")}`,
      };
    });
  };

  const bindDrag = (blockId: string) => (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    const origin = event.clientX;
    const base = draftBlocks ?? blocks;

    const onMove = (moveEvent: PointerEvent) => {
      setDraftBlocks(moveBlock(base, blockId, ((moveEvent.clientX - origin) / 860) * 100, moveEvent));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraftBlocks((pending) => {
        if (!pending) return pending;
        onChange(resolveCollisions(pending, startMin, endMin));
        return null;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const bindResize = (blockId: string) => (event: React.PointerEvent) => {
    event.stopPropagation();
    if (event.button !== 0) return;
    const origin = event.clientX;
    const base = draftBlocks ?? blocks;

    const onMove = (moveEvent: PointerEvent) => {
      setDraftBlocks(resizeBlock(base, blockId, ((moveEvent.clientX - origin) / 860) * 100, moveEvent));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDraftBlocks((pending) => {
        if (!pending) return pending;
        onChange(resolveCollisions(pending, startMin, endMin));
        return null;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const board = useMemo(
    () =>
      viewBlocks.map((block) => {
        const leftPct = ((toMinutes(block.startTime) - startMin) / totalMin) * 100;
        const widthPct = (block.durationMin / totalMin) * 100;
        return { block, leftPct, widthPct };
      }),
    [viewBlocks, startMin, totalMin]
  );

  return (
    <div className="space-y-3 pb-20 sm:pb-0">
      <TimeAxis start={dayStart} end={dayEnd} />
      <div className="relative h-28 overflow-x-auto rounded-xl border border-white/10 bg-slate-950/70" data-testid="timeline-board">
        <div className="relative h-full min-w-[860px]">
          <div
            className="absolute bottom-2 h-6 rounded bg-cyan-500/10"
            style={{ left: `${Math.max(0, ((endMin - 90 - startMin) / totalMin) * 100)}%`, width: `${Math.min(100, (90 / totalMin) * 100)}%` }}
          />
          {board.map(({ block, leftPct, widthPct }) => (
            <TimelineBlock
              key={block.id}
              block={block}
              leftPct={leftPct}
              widthPct={widthPct}
              selected={selectedId === block.id}
              onSelect={() => setSelectedId(block.id)}
              onDragPointerDown={bindDrag(block.id)}
              onResizePointerDown={bindResize(block.id)}
            />
          ))}
        </div>
      </div>

      <StopDrawer
        open={!!selectedId}
        block={selected}
        onClose={() => setSelectedId(null)}
        onEdit={(field, value) => {
          if (!selected) return;
          onChange(viewBlocks.map((block) => (block.id === selected.id ? { ...block, [field]: value } : block)));
        }}
        onDelete={() => {
          if (!selected) return;
          onChange(viewBlocks.filter((block) => block.id !== selected.id));
          setSelectedId(null);
        }}
      />
    </div>
  );
}
