"use client";

import type { PlanBlock } from "@/app/lib/planner/types";
import StopCard from "./StopCard";

export default function TimelineBoard({ blocks, onEdit, onMove }: {
  blocks: PlanBlock[];
  onEdit: (id: string, field: keyof PlanBlock, value: string | number | boolean) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="space-y-3 pb-20 sm:pb-0">
      {blocks.map((block, index) => <StopCard key={block.id} block={block} index={index} onEdit={onEdit} onMove={onMove} />)}
    </div>
  );
}
