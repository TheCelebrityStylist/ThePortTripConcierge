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

const actionMap: Array<{ label: string; action: AssistantAction; hint: string }> = [
  { label: "Reduce walking", action: "balanced-loop", hint: "Keeps route close to port corridor." },
  { label: "Move lunch earlier", action: "move-lunch-earlier", hint: "Avoids noon crowd spikes." },
  { label: "Swap activity", action: "trim-far-stop", hint: "Cuts the furthest leg for reliability." },
  { label: "Faster transfers", action: "swap-transit", hint: "Prioritizes high reliability transport." },
];

export default function AIAssistantPanel({ cruise, selectedDay, selectedPlan, mode, onModeChange, onApplyAction }: Props) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Array<{ role: "assistant" | "user"; text: string }>>([
    { role: "assistant", text: "Ask: ‘optimize for minimal walking’ or tap a suggestion chip to update your plan instantly." },
  ]);

  const profileCue = useMemo(() => {
    if (!selectedDay) return "Set a day to get personalized cues.";
    const port = portsRegistry[selectedDay.portSlug];
    if (!port) return "Pick a port to unlock local risk cues.";
    return `${port.name}: ${port.dockingModeDefault === "tender" ? "Tender operations" : "Docked arrival"}. Watch ${port.typicalTransitRisks[0]?.toLowerCase() ?? "transfer bottlenecks"}. Keep final leg near ${port.corridorZones[0]?.name ?? "the terminal corridor"}.`;
  }, [selectedDay]);

  const why = selectedPlan
    ? `Why this works: score ${selectedPlan.score.totalScore}. Current risk is ${selectedPlan.score.violations[0] ?? "well-buffered return posture"}.`
    : "Why this works: we sequence stops to protect return buffer and reduce transfer volatility.";

  const submit = () => {
    if (!message.trim()) return;
    const normalized = message.toLowerCase();
    const picked = normalized.includes("walking")
      ? "balanced-loop"
      : normalized.includes("lunch")
      ? "move-lunch-earlier"
      : normalized.includes("swap")
      ? "trim-far-stop"
      : normalized.includes("transfer")
      ? "swap-transit"
      : null;

    setHistory((prev) => [...prev, { role: "user", text: message }]);

    if (picked) {
      onApplyAction(picked, mode);
      const label = actionMap.find((chip) => chip.action === picked)?.label ?? "update";
      setHistory((prev) => [...prev, { role: "assistant", text: `Applied: ${label}. ${why}` }]);
    } else {
      setHistory((prev) => [...prev, { role: "assistant", text: `I can apply schedule edits now. Try: reduce walking, move lunch earlier, or faster transfers. ${why}` }]);
    }

    setMessage("");
  };

  return (
    <aside className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">AI Travel Agent</p>
          <p className="text-[11px] text-slate-400">{cruise.cruiseName}</p>
        </div>
        <div className="flex rounded-full bg-slate-800 p-1 text-[11px]">
          <button className={`rounded-full px-2 py-1 ${mode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`} onClick={() => onModeChange("day")}>This Day</button>
          <button className={`rounded-full px-2 py-1 ${mode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`} onClick={() => onModeChange("cruise")}>Whole Cruise</button>
        </div>
      </div>

      <div className="mb-3 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-2 text-xs text-cyan-100">
        <p className="font-medium">Personalized cue</p>
        <p>{profileCue}</p>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {actionMap.map((chip) => (
          <button key={chip.action} onClick={() => onApplyAction(chip.action, mode)} className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-700" title={chip.hint}>
            {chip.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-slate-950/60 p-2">
        {history.map((item, idx) => (
          <div key={idx} className={`rounded-md p-2 text-xs ${item.role === "assistant" ? "bg-slate-900 text-slate-200" : "bg-slate-800 text-white"}`}>{item.text}</div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Ask for edits..." className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm" />
        <button onClick={submit} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">Send</button>
      </div>
      <p className="mt-2 text-[11px] text-slate-400">{why}</p>
    </aside>
  );
}
