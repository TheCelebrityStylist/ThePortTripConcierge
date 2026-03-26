"use client";

import QuickAddDayRow from "./QuickAddDayRow";
import PrimaryActionButton from "./PrimaryActionButton";

type Props = {
  mode: "single-port" | "full-cruise";
  daysCount: number;
  onModeChange: (mode: "single-port" | "full-cruise") => void;
  onQuickAdd: (payload: { portSlug: string; portName: string; arrivalTime: string; allAboardTime: string }) => void;
  onGenerateFirst: () => void;
  onGenerateWhole: () => void;
};

export default function PlanSetupStrip({ mode, daysCount, onModeChange, onQuickAdd, onGenerateFirst, onGenerateWhole }: Props) {
  return (
    <section className="space-y-3 rounded-2xl bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.15em] text-cyan-200/80">Start your cruise</p>
      <div className="flex items-center gap-2 rounded-full bg-slate-800 p-1 text-xs w-fit">
        <button onClick={() => onModeChange("single-port")} className={`rounded-full px-3 py-1 ${mode === "single-port" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Single Port</button>
        <button onClick={() => onModeChange("full-cruise")} className={`rounded-full px-3 py-1 ${mode === "full-cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Full Cruise</button>
      </div>

      <QuickAddDayRow onAdd={onQuickAdd} />

      <div className="flex flex-wrap items-center gap-2">
        <PrimaryActionButton label="Generate my first day" onClick={onGenerateFirst} disabled={daysCount === 0} />
        {daysCount >= 2 && <button onClick={onGenerateWhole} className="rounded-xl bg-slate-800 px-4 py-2 text-sm">Generate whole cruise</button>}
      </div>
    </section>
  );
}
