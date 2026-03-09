"use client";

import { useMemo, useState } from "react";
import { portsRegistry } from "@/app/lib/ports";
import { buildChatContext } from "@/app/lib/planner/chatContextBuilder";
import { parseIntent } from "@/app/lib/planner/mutations/parseIntent";
import { formatChatResponse } from "@/app/lib/planner/chatResponseFormatter";
import { researchPortContext } from "@/app/lib/planner/researchPortContext";
import type { PlannerIntent } from "@/app/lib/planner/planMutations";
import type { Cruise, PlanOutput, PortDay } from "@/app/lib/planner/types";

type Props = {
  cruise: Cruise;
  selectedDay?: PortDay;
  selectedPlan?: PlanOutput;
  mode: "day" | "cruise";
  editingTitle?: string;
  changeLog?: string[];
  onModeChange: (mode: "day" | "cruise") => void;
  onApplyIntent: (intent: PlannerIntent, mode: "day" | "cruise") => void;
  onSubmitPrompt?: (prompt: string, mode: "day" | "cruise") => Promise<{ summary: string; why: string[]; applyNow: Array<{ label: string; intent: PlannerIntent }>; fallback?: string } | null>;
};

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; summary: string; why: string[]; applyNow: Array<{ label: string; intent: PlannerIntent }>; fallback?: string };

const quickIntents: Array<{ label: string; intent: PlannerIntent }> = [
  { label: "Keep me ship-safe", intent: "make-safer" },
  { label: "I’m 30 minutes behind", intent: "running-late" },
  { label: "Reduce walking", intent: "reduce-walking" },
  { label: "Make it cheaper", intent: "make-cheaper" },
  { label: "Add food stop", intent: "add-food-stop" },
  { label: "Weather-safe", intent: "weather-safe" },
];

export default function AIAssistantPanel({ cruise, selectedDay, selectedPlan, mode, editingTitle, changeLog = [], onModeChange, onApplyIntent, onSubmitPrompt }: Props) {
  const [message, setMessage] = useState("");
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const chatContext = useMemo(() => buildChatContext({ cruise, selectedDay, selectedPlan, scope: mode }), [cruise, selectedDay, selectedPlan, mode]);

  const todayFocus = useMemo(() => {
    if (!selectedDay) return "Pick a day and I’ll craft a return-safe plan.";
    const port = portsRegistry[selectedDay.portSlug];
    return `${port?.name || selectedDay.portSlug}: ${selectedDay.arrivalTime}-${selectedDay.allAboardTime}.`;
  }, [selectedDay]);

  const submit = async () => {
    if (!message.trim()) return;
    const userText = message.trim();
    setHistory((prev) => [...prev, { role: "user", text: userText }]);
    setMessage("");
    setThinking(true);

    const parsed = parseIntent(userText);
    if (parsed.intent) onApplyIntent(parsed.intent, mode);

    const fromParent = onSubmitPrompt ? await onSubmitPrompt(userText, mode) : null;
    const fallback = formatChatResponse({ context: chatContext, intent: parsed.intent, confidence: parsed.confidence });
    const live = await researchPortContext(selectedDay?.portSlug);
    const msg = fromParent ?? { ...fallback, why: [...fallback.why, `${live.source}: ${live.summary}`] };
    setHistory((prev) => [...prev, { role: "assistant", ...msg }]);
    setThinking(false);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/10 bg-[#0D1526] p-6">
      <div className="shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-cyan-100">Co-Pilot Studio</p>
          <div className="rounded-full bg-slate-900 p-1 text-xs">
            <button onClick={() => onModeChange("day")} className={`rounded-full px-2 py-1 ${mode === "day" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>This day</button>
            <button onClick={() => onModeChange("cruise")} className={`rounded-full px-2 py-1 ${mode === "cruise" ? "bg-cyan-400 text-slate-900" : "text-slate-300"}`}>Whole cruise</button>
          </div>
        </div>
        <p className="text-xs text-slate-300">{todayFocus}</p>
        {selectedPlan && <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] text-slate-300"><span className="rounded bg-slate-900 px-2 py-1">Walk load {selectedPlan.plan.blocks.filter((b) => b.transitMode === "walk").length}</span><span className="rounded bg-slate-900 px-2 py-1">Safety {selectedPlan.score.bufferHealth}</span><span className="rounded bg-slate-900 px-2 py-1">Fragile {selectedPlan.score.violations[0] || "none"}</span><span className="rounded bg-slate-900 px-2 py-1">Budget €{selectedPlan.plan.blocks.reduce((s,b)=>s+b.costEUR,0)}</span></div>}
        {editingTitle && <p className="mt-1 text-xs text-slate-400">Editing: {editingTitle}</p>}
      </div>

      <div className="my-3 grid shrink-0 grid-cols-2 gap-2">
        {quickIntents.map((chip) => (
          <button key={chip.label} onClick={() => onApplyIntent(chip.intent, mode)} className="rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 text-xs">{chip.label}</button>
        ))}
      </div>

      {changeLog.length > 0 && <div className="mb-2 rounded-xl bg-slate-900/60 p-2 text-xs text-slate-300">{changeLog.slice(0, 3).map((line) => <p key={line}>• {line}</p>)}</div>}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-950/50 p-3">
        {history.map((item, idx) => item.role === "user" ? (
          <div key={idx} className="ml-auto max-w-[90%] rounded-2xl bg-cyan-500/20 px-3 py-2 text-sm">{item.text}</div>
        ) : (
          <div key={idx} className="max-w-[92%] rounded-2xl bg-slate-900 px-3 py-2 text-sm">
            <p className="font-medium">{item.summary}</p>
            {item.why.map((w) => <p key={w} className="text-xs text-slate-300">• {w}</p>)}
            <div className="mt-2 flex flex-wrap gap-2">{item.applyNow.map((action) => <button key={action.label} onClick={() => onApplyIntent(action.intent, mode)} className="rounded-full border border-cyan-300/40 px-2 py-1 text-xs">{action.label}</button>)}</div>
          </div>
        ))}
        {thinking && <p className="text-xs text-slate-400">Thinking…</p>}
      </div>

      <div className="mt-3 shrink-0">
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Ask for changes: reduce walking, add food, make cheaper…" className="h-20 w-full rounded-2xl bg-slate-900 p-3 text-sm" />
        <button onClick={submit} className="mt-2 w-full rounded-2xl bg-cyan-400 py-2 text-sm font-semibold text-slate-900">Apply with AI</button>
      </div>
    </aside>
  );
}
