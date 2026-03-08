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
  { title: "Budget", chips: [{ label: "Swap transit mode", action: "swap-transit" }] },
  { title: "Highlights", chips: [{ label: "Add signature highlight", action: "swap-transit" }] },
];

export default function AIAssistantPanel({ cruise, selectedDay, selectedPlan, mode, editingTitle, changeLog = [], onModeChange, onApplyAction }: Props) {
  const [message, setMessage] = useState("");
  const [dockToast, setDockToast] = useState("");
  const [history, setHistory] = useState<Array<{ role: "assistant" | "user"; text: string }>>([{ role: "assistant", text: "I’m your cruise co-pilot. Ask for pacing, comfort, safety, or budget optimization." }]);

  const todayFocus = useMemo(() => {
    if (!selectedDay) return "Pick a day and I’ll craft a return-safe plan.";
    const port = portsRegistry[selectedDay.portSlug];
    if (!port) return "Balancing time, walking, and risk for this selected day.";
    return `${port.name}: ${selectedDay.arrivalTime}-${selectedDay.allAboardTime}. Pace ${selectedDay.pace}, walking ${selectedDay.walkingPreference}, risk ${selectedDay.riskTolerance}.`;
  }, [selectedDay]);

  const apply = (action: AssistantAction, label: string) => {
    onApplyAction(action, mode);
    setDockToast(`Applied: ${label}`);
    setTimeout(() => setDockToast(""), 1500);
    setHistory((prev) => [...prev, { role: "assistant", text: "Done. I updated your plan while preserving lock/must-do stops." }]);
  };

  const submit = () => {
    if (!message.trim()) return;
    const normalized = message.toLowerCase();
    const picked: { action: AssistantAction; label: string } | null = normalized.includes("walk") ? { action: "balanced-loop", label: "Reduce walking" } : normalized.includes("safe") || normalized.includes("buffer") ? { action: "trim-far-stop", label: "Keep me ship-safe" } : normalized.includes("relax") ? { action: "move-lunch-earlier", label: "Make it more relaxed" } : normalized.includes("highlight") ? { action: "swap-transit", label: "Add signature highlight" } : null;

    setHistory((prev) => [...prev, { role: "user", text: message }]);
    if (picked) {
      apply(picked.action, picked.label);
      setHistory((prev) => [...prev, { role: "assistant", text: "What changed: adjusted sequencing, reduced volatility, and improved return-safe confidence." }]);
    } else {
      setHistory((prev) => [...prev, { role: "assistant", text: "Try one of the quick intents above for instant updates." }]);
    }
    setMessage("");
  };

  return (
    <aside className="flex h-full flex-col rounded-[24px] border border-white/10 bg-[#0D1526] p-6">
      <div className="mb-4">
        <p className="text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Co-Pilot Dock</p>
        <p className="text-lg font-semibold">{cruise.cruiseName}</p>
      </div>

      <div className="mb-4 rounded-2xl border border-white/10 bg-slate-900/60 p-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.14em] text-cyan-200/80">Today’s focus</p>
          <span className="rounded-full bg-emerald-500/20 px-2 py-1 text-[10px] text-emerald-200">Safety high</span>
        </div>
        <p className="line-clamp-2 text-sm text-slate-200">{todayFocus}</p>
        {editingTitle && <p className="mt-2 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">Context: Editing {editingTitle}</p>}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {actionGroups.map((group) => group.chips.map((chip) => (
          <button key={`${group.title}-${chip.label}`} onClick={() => apply(chip.action, chip.label)} className="rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 text-xs hover:border-cyan-300/40 hover:bg-slate-800">{chip.label}</button>
        )))}
      </div>

      {changeLog.length > 0 && (
        <div className="mb-3 rounded-2xl bg-slate-900/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">What changed</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">{changeLog.slice(0, 4).map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-950/50 p-3">
        {history.map((item, idx) => (
          <div key={`${item.role}-${idx}`} className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${item.role === "assistant" ? "mr-auto bg-slate-800 text-slate-100" : "ml-auto bg-cyan-500/20 text-cyan-100"}`}>
            {item.text}
          </div>
        ))}
        {selectedPlan && <p className="text-[11px] text-slate-400">Plan score: {selectedPlan.score.totalScore}</p>}
      </div>

      {dockToast && <p className="mt-2 rounded-xl bg-cyan-500/20 px-3 py-2 text-xs text-cyan-100">{dockToast}</p>}

      <div className="sticky bottom-0 mt-3 border-t border-white/10 bg-[#0D1526] pt-3">
        <div className="mb-2 flex rounded-full bg-slate-900 p-1 text-xs">
          <button className={`flex-1 rounded-full px-2 py-1 ${mode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`} onClick={() => onModeChange("day")}>This Day</button>
          <button className={`flex-1 rounded-full px-2 py-1 ${mode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`} onClick={() => onModeChange("cruise")}>Whole Cruise</button>
        </div>
        <div className="flex gap-2">
          <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ask me anything" className="h-11 w-full rounded-2xl border border-white/10 bg-slate-900 px-3 text-sm" />
          <button onClick={submit} className="h-11 rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-900">Send</button>
        </div>
      </div>
    </aside>
  );
}
