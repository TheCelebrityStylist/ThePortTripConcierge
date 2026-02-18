"use client";

import { useMemo } from "react";

type Props = {
  allAboardTime: string;
  recommendedBufferMinutes: number;
  tenderDelayMinutes?: number;
};

export default function ReturnToShipSafetyTimer({ allAboardTime, recommendedBufferMinutes, tenderDelayMinutes = 0 }: Props) {
  const { mustReturnBy, risk } = useMemo(() => {
    const [h, m] = allAboardTime.split(":").map(Number);
    const total = h * 60 + m - recommendedBufferMinutes - tenderDelayMinutes;
    const safeTotal = Math.max(0, total);
    const hh = String(Math.floor(safeTotal / 60)).padStart(2, "0");
    const mm = String(safeTotal % 60).padStart(2, "0");

    const totalBuffer = recommendedBufferMinutes + tenderDelayMinutes;
    const risk = totalBuffer >= 105 ? "Low" : totalBuffer >= 75 ? "Medium" : "High";
    return { mustReturnBy: `${hh}:${mm}`, risk };
  }, [allAboardTime, recommendedBufferMinutes, tenderDelayMinutes]);

  return (
    <section className="rounded-2xl border border-cyan-300/20 bg-cyan-500/10 p-4">
      <h3 className="text-lg font-semibold">Return-to-Ship Safety Timer</h3>
      <p className="mt-2 text-sm text-slate-200">Must return by <strong>{mustReturnBy}</strong> for all-aboard at {allAboardTime}.</p>
      <div className="mt-3 flex gap-2 text-xs">
        <span className="rounded-full bg-white/10 px-3 py-1">Buffer: {recommendedBufferMinutes} min</span>
        <span className="rounded-full bg-white/10 px-3 py-1">Tender delay: {tenderDelayMinutes} min</span>
        <span className="rounded-full bg-white/10 px-3 py-1">Risk: {risk}</span>
      </div>
    </section>
  );
}
