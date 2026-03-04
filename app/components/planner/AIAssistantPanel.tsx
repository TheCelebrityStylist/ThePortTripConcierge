"use client";

import { useMemo, useState } from "react";
import { portsRegistry } from "@/app/lib/ports";
import type { Cruise, PlanOutput, PortDay } from "@/app/lib/planner/types";

type AssistantAction = "trim-far-stop" | "move-lunch-earlier" | "balanced-loop" | "swap-transit";

type Props = {
  cruise: Cruise;
  selectedDay?: PortDay;
  selectedPlan?: PlanOutput;
  mode: "day" | "cruise";
  editingTitle?: string;
  changeLog?: string[];
  onModeChange: (mode: "day" | "cruise") => void;
  onApplyAction: (action: AssistantAction, mode: "day" | "cruise") => void;
};

const actionGroups: Array<{ title: string; chips: Array<{ label: string; action: AssistantAction }> }> = [
  { title: "Safety", chips: [{ label: "Keep me ship-safe", action: "trim-far-stop" }] },
  { title: "Comfort", chips: [{ label: "Make it more relaxed", action: "move-lunch-earlier" }, { label: "Reduce walking", action: "balanced-loop" }] },
  { title: "Highlights", chips: [{ label: "Add signature highlight", action: "swap-transit" }] },
];

export default function AIAssistantPanel({ cruise, selectedDay, selectedPlan, mode, editingTitle, changeLog = [], onModeChange, onApplyAction }: Props) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: "Ask me anything. I can rebalance pace, walking, budget, and return-safety." }]);

  const todayFocus = useMemo(() => {
    if (!selectedDay) return "Pick a day and I will generate a safe first draft.";
    const port = portsRegistry[selectedDay.portSlug];
    if (!port) return "I’ll keep this day balanced for return-safe timing.";
    return `${port.name} (${selectedDay.arrivalTime}-${selectedDay.allAboardTime}) · pace ${selectedDay.pace} · walking ${selectedDay.walkingPreference} · risk ${selectedDay.riskTolerance}.`;
  }, [selectedDay]);

  const apply = (action: AssistantAction) => {
    onApplyAction(action, mode);
    setHistory((prev) => [...prev, { role: "assistant", text: "Applied update. I preserved locks and rebalanced for safer timing." }]);
  };

  const submit = () => {
    if (!message.trim()) return;
    const normalized = message.toLowerCase();
    const picked = normalized.includes("walk") ? "balanced-loop" : normalized.includes("safe") || normalized.includes("buffer") ? "trim-far-stop" : normalized.includes("relax") ? "move-lunch-earlier" : normalized.includes("highlight") ? "swap-transit" : null;

    setHistory((prev) => [...prev, { role: "user", text: message }]);
    if (picked) {
      apply(picked);
      setHistory((prev) => [...prev, { role: "assistant", text: "(1) Plan change summary: updated. (2) What changed: adjusted sequence/transit. (3) Why better: stronger return reliability. (4) Watch out: crowd windows. (5) Fallback: taxi for final leg." }]);
    } else {
      setHistory((prev) => [...prev, { role: "assistant", text: "Try: Make it more relaxed, Reduce walking, Keep me ship-safe." }]);
    }
    setMessage("");
  };

  return (
    <aside className="flex h-full min-h-[60vh] flex-col rounded-2xl bg-slate-900/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">AI Co-Pilot</p>
          <p className="text-[11px] text-slate-400">{cruise.cruiseName}</p>
        </div>
        <div className="flex rounded-full bg-slate-800 p-1 text-[11px]">
          <button className={`rounded-full px-2 py-1 ${mode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`} onClick={() => onModeChange("day")}>This Day</button>
          <button className={`rounded-full px-2 py-1 ${mode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`} onClick={() => onModeChange("cruise")}>Whole Cruise</button>
        </div>
      </div>

      <div className="mb-3 rounded-xl bg-cyan-500/10 p-3 text-sm text-cyan-100">
        <p className="mb-1 text-xs uppercase tracking-wide text-cyan-200/80">Today’s focus</p>
        <p>{todayFocus}</p>
        {editingTitle && <p className="mt-2 rounded bg-slate-950/40 px-2 py-1 text-xs">Editing: {editingTitle}</p>}
      </div>

      <div className="mb-3 space-y-2">
        {actionGroups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 text-[10px] uppercase tracking-[0.15em] text-slate-400">{group.title}</p>
            <div className="flex flex-wrap gap-2">{group.chips.map((chip) => <button key={chip.label} onClick={() => apply(chip.action)} className="rounded-lg bg-slate-800 px-2 py-1.5 text-xs hover:bg-slate-700">{chip.label}</button>)}</div>
          </div>
        ))}
      </div>

      {changeLog.length > 0 && (
        <div className="mb-3 rounded-xl bg-slate-950/40 p-2">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">What changed</p>
          <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-slate-300">{changeLog.slice(0, 4).map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-950/40 p-2">
        {history.map((item, idx) => <div key={`${item.role}-${idx}`} className={`rounded-lg p-2 text-xs ${item.role === "assistant" ? "bg-slate-900 text-slate-200" : "bg-slate-800 text-white"}`}>{item.text}</div>)}
        {selectedPlan && <p className="text-[11px] text-slate-400">Score now: {selectedPlan.score.totalScore}</p>}
      </div>

      <div className="sticky bottom-0 mt-3 flex gap-2 bg-slate-900/90 pt-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ask me anything (e.g. Reduce walking)" className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm" />
        <button onClick={submit} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">Send</button>
      </div>
    </aside>
  );
}
