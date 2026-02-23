"use client";

import type { PlanStop } from "@/app/lib/planner/types";
import StopCard from "./StopCard";

export default function TimelineBoard({ stops, onToggle, onAsk, onMove }: {
  stops: PlanStop[];
  onToggle: (id: string, key: "lockTime" | "lockInclusion") => void;
  onAsk: (id: string, action: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
}) {
  return <div className="space-y-3">{stops.map((stop) => <StopCard key={stop.id} stop={stop} onToggle={onToggle} onAsk={onAsk} onMove={onMove} />)}</div>;
}
