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
  onModeChange: (mode: "day" | "cruise") => void;
  onApplyAction: (action: AssistantAction, mode: "day" | "cruise") => void;
};

const actionMap: Array<{ label: string; action: AssistantAction }> = [
  { label: "Optimize walking", action: "balanced-loop" },
  { label: "Increase buffer safety", action: "trim-far-stop" },
  { label: "Make it more relaxed", action: "move-lunch-earlier" },
  { label: "Add signature highlight", action: "swap-transit" },
];

export default function AIAssistantPanel({ cruise, selectedDay, selectedPlan, mode, onModeChange, onApplyAction }: Props) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Array<{ role: "assistant" | "user"; text: string }>>([
    { role: "assistant", text: "I’m watching your day in real time. Ask for pace, buffer, or walking adjustments." },
  ]);

  const todayFocus = useMemo(() => {
    if (!selectedDay) return "Pick a day and I’ll draft a calm, return-safe game plan.";
    const port = portsRegistry[selectedDay.portSlug];
    if (!port) return `This day has a ${selectedDay.arrivalTime}–${selectedDay.allAboardTime} window. We can keep it efficient and low-stress.`;
    const corridor = port.corridorZones[0]?.name ?? "near-port corridor";
    return `${port.name} is ${port.dockingModeDefault === "tender" ? "a tender" : "a docked"} call today. With a ${selectedDay.arrivalTime}–${selectedDay.allAboardTime} window, we can explore confidently and still protect return buffer near ${corridor}.`;
  }, [selectedDay]);

  const submit = () => {
    if (!message.trim()) return;
    const normalized = message.toLowerCase();
    const picked = normalized.includes("walk")
      ? "balanced-loop"
      : normalized.includes("buffer") || normalized.includes("safe")
      ? "trim-far-stop"
      : normalized.includes("relax") || normalized.includes("pace")
      ? "move-lunch-earlier"
      : normalized.includes("highlight") || normalized.includes("signature")
      ? "swap-transit"
      : null;

    setHistory((prev) => [...prev, { role: "user", text: message }]);
    if (picked) {
      onApplyAction(picked, mode);
      setHistory((prev) => [...prev, { role: "assistant", text: "Done. I applied that adjustment and kept your return-safe posture intact." }]);
    } else {
      setHistory((prev) => [...prev, { role: "assistant", text: "I can tune this instantly. Try: optimize walking, increase buffer safety, or make it more relaxed." }]);
    }
    setMessage("");
  };

  return (
    <aside className="flex h-full flex-col rounded-2xl bg-slate-900/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">Your Cruise Co-Pilot</p>
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
      </div>

      <div className="mb-3 grid grid-cols-2 gap-2">
        {actionMap.map((chip) => (
          <button key={chip.action} onClick={() => onApplyAction(chip.action, mode)} className="rounded-lg bg-slate-800 px-2 py-2 text-xs hover:bg-slate-700">{chip.label}</button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-950/40 p-2">
        {history.map((item, idx) => (
          <div key={idx} className={`rounded-lg p-2 text-xs ${item.role === "assistant" ? "bg-slate-900 text-slate-200" : "bg-slate-800 text-white"}`}>{item.text}</div>
        ))}
        {selectedPlan && <p className="text-[11px] text-slate-400">Current score: {selectedPlan.score.totalScore}</p>}
      </div>

      <div className="mt-3 flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ask your co-pilot..." className="w-full rounded-xl bg-slate-800 px-3 py-2 text-sm" />
        <button onClick={submit} className="rounded-xl bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">Send</button>
      </div>
    </aside>
  );
}
