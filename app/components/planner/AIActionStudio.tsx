"use client";

import { useMemo, useState } from "react";
import type { PlannerIntent } from "@/app/lib/planner/planMutations";
import type { Cruise, PlanOutput, PortDay } from "@/app/lib/planner/types";

type ChatMessage = { role: "user" | "assistant"; text: string };

export default function AIActionStudio({
  cruise,
  selectedDay,
  selectedPlan,
  mode,
  changeLog,
  onModeChange,
  onApplyIntent,
  onSubmitPrompt,
}: {
  cruise: Cruise;
  selectedDay?: PortDay;
  selectedPlan?: PlanOutput;
  mode: "day" | "cruise";
  changeLog: string[];
  onModeChange: (mode: "day" | "cruise") => void;
  onApplyIntent: (intent: PlannerIntent, mode: "day" | "cruise") => void;
  onSubmitPrompt: (prompt: string, mode: "day" | "cruise") => Promise<{ summary: string; why: string[] } | null>;
}) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [busy, setBusy] = useState(false);

  const metrics = useMemo(() => {
    if (!selectedPlan) return { walking: 0, budget: 0, fragility: "No plan", safety: 0 };
    return {
      walking: selectedPlan.plan.blocks.filter((block) => block.transitMode === "walk").length,
      budget: selectedPlan.plan.blocks.reduce((sum, block) => sum + block.costEUR, 0),
      fragility: selectedPlan.score.violations[0] ?? "Stable",
      safety: selectedPlan.score.bufferHealth,
    };
  }, [selectedPlan]);

  const actions: Array<{ label: string; intent: PlannerIntent }> = [
    { label: "Keep me ship-safe", intent: "make-safer" },
    { label: "I’m 30 minutes behind", intent: "running-late" },
    { label: "Reduce walking", intent: "reduce-walking" },
    { label: "Weather-safe", intent: "weather-safe" },
    { label: "Add food stop", intent: "add-food-stop" },
    { label: "Make it cheaper", intent: "make-cheaper" },
    { label: "Family-friendly", intent: "family-friendly" },
  ];

  const submit = async () => {
    if (!message.trim()) return;
    const prompt = message.trim();
    setHistory((items) => [...items, { role: "user", text: prompt }]);
    setMessage("");
    setBusy(true);
    const response = await onSubmitPrompt(prompt, mode);
    const assistantText = response ? [response.summary, ...response.why.slice(0, 2)].join(" ") : "Applied requested change.";
    setHistory((items) => [...items, { role: "assistant", text: assistantText }]);
    setBusy(false);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/10 bg-[#0D1526]/95 p-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">AI Action Studio</p>
        <div className="rounded-full bg-slate-900 p-1 text-[11px]">
          <button onClick={() => onModeChange("day")} className={`rounded-full px-2 py-1 ${mode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>This day</button>
          <button onClick={() => onModeChange("cruise")} className={`rounded-full px-2 py-1 ${mode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Whole cruise</button>
        </div>
      </div>
      <p className="text-xs text-slate-300">{selectedDay ? `${selectedDay.portName || selectedDay.portSlug} · ${selectedDay.arrivalTime}-${selectedDay.allAboardTime}` : cruise.cruiseName}</p>
      <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300">
        <span className="rounded bg-slate-900 px-2 py-1">Walking {metrics.walking}</span>
        <span className="rounded bg-slate-900 px-2 py-1">Budget €{metrics.budget}</span>
        <span className="rounded bg-slate-900 px-2 py-1">Safety {metrics.safety}</span>
        <span className="rounded bg-slate-900 px-2 py-1">Fragile {metrics.fragility}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        {actions.map((action) => (
          <button key={action.label} onClick={() => onApplyIntent(action.intent, mode)} className="rounded-xl border border-white/10 bg-slate-900/70 px-2 py-2 text-left">{action.label}</button>
        ))}
      </div>

      <div className="mt-3 rounded-xl bg-slate-900/50 p-2 text-xs text-slate-300">
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">What changed</p>
        {(changeLog.length ? changeLog : ["No changes yet."]).slice(0, 4).map((line) => <p key={line}>• {line}</p>)}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl bg-slate-950/35 p-2 text-xs">
        {history.length === 0 && <p className="text-slate-400">Try: “Make today cheaper but keep the best stop.”</p>}
        {history.map((item, index) => <p key={index} className={item.role === "user" ? "text-cyan-200" : "text-slate-200"}>{item.role === "user" ? "You: " : "AI: "}{item.text}</p>)}
        {busy && <p className="text-slate-400">Applying…</p>}
      </div>

      <div className="mt-3">
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask the AI to improve this day…" className="h-20 w-full rounded-xl bg-slate-900 p-2 text-sm" />
        <button onClick={submit} className="mt-2 w-full rounded-xl bg-cyan-400 py-2 text-sm font-semibold text-slate-900">Apply</button>
      </div>
    </aside>
  );
}
