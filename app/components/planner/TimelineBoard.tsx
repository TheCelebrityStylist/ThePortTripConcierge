"use client";

import type { PlannedStop } from "@/app/lib/planner/types";
import StopCard from "./StopCard";

export default function TimelineBoard({ stops, onEdit, onMove }: {
  stops: PlannedStop[];
  onEdit: (id: string, field: keyof PlannedStop, value: string | number | boolean) => void;
  onMove: (from: number, to: number) => void;
}) {
  return (
    <div className="space-y-3 pb-20 sm:pb-0">
      {stops.map((stop, index) => (
        <StopCard key={stop.id} stop={stop} index={index} onEdit={onEdit} onMove={onMove} />
      ))}
    </div>
  );
}
