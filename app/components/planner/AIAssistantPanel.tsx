"use client";

import { useMemo, useState } from "react";
import { portsRegistry } from "@/app/lib/ports";
import { buildChatContext } from "@/app/lib/planner/chatContextBuilder";
import { detectChatIntent } from "@/app/lib/planner/chatActions";
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
};

type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; summary: string; why: string[]; applyNow: Array<{ label: string; intent: PlannerIntent }>; fallback?: string };

const quickIntents: Array<{ label: string; intent: PlannerIntent; group: string }> = [
  { label: "Keep me ship-safe", intent: "make-safer", group: "Safety" },
  { label: "I’m 30 minutes behind", intent: "running-late", group: "Safety" },
  { label: "Reduce walking", intent: "reduce-walking", group: "Comfort" },
  { label: "Family-friendly", intent: "family-friendly", group: "Comfort" },
  { label: "Make it cheaper", intent: "make-cheaper", group: "Budget" },
  { label: "Add food stop", intent: "add-food-stop", group: "Budget" },
  { label: "Add signature highlight", intent: "add-signature-highlight", group: "Highlights" },
  { label: "Weather-safe", intent: "weather-safe", group: "Highlights" },
];

export default function AIAssistantPanel({ cruise, selectedDay, selectedPlan, mode, editingTitle, changeLog = [], onModeChange, onApplyIntent }: Props) {
  const [message, setMessage] = useState("");
  const [dockToast, setDockToast] = useState("");
  const [thinking, setThinking] = useState(false);
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      role: "assistant",
      summary: "I’m your cruise co-pilot. I can optimize walking, safety, budget, highlights, or recovery mode in one click.",
      why: ["I use your live itinerary state.", "I preserve locked / must-do stops."],
      applyNow: [
        { label: "Keep me ship-safe", intent: "make-safer" },
        { label: "Reduce walking", intent: "reduce-walking" },
      ],
    },
  ]);

  const chatContext = useMemo(() => buildChatContext({ cruise, selectedDay, selectedPlan, scope: mode }), [cruise, selectedDay, selectedPlan, mode]);

  const todayFocus = useMemo(() => {
    if (!selectedDay) return "Pick a day and I’ll craft a return-safe plan.";
    const port = portsRegistry[selectedDay.portSlug];
    if (!port) return "Balancing time, walking, and risk for this selected day.";
    return `${port.name}: ${selectedDay.arrivalTime}-${selectedDay.allAboardTime}. Pace ${selectedDay.pace}, walking ${selectedDay.walkingPreference}.`;
  }, [selectedDay]);

  const applyIntent = (intent: PlannerIntent, label: string) => {
    onApplyIntent(intent, mode);
    setDockToast(`Applied: ${label}`);
    setTimeout(() => setDockToast(""), 1400);
  };

  const submit = async () => {
    if (!message.trim()) return;
    const userText = message.trim();
    setHistory((prev) => [...prev, { role: "user", text: userText }]);
    setMessage("");
    setThinking(true);

    const intentResult = detectChatIntent(userText);
    const response = formatChatResponse({ context: chatContext, intent: intentResult.intent, confidence: intentResult.confidence });
    const live = await researchPortContext(selectedDay?.portSlug);
    const enriched = {
      ...response,
      why: [...response.why, `${live.source === "live" ? "Live context" : "Fallback context"}: ${live.summary}`],
    };
    setHistory((prev) => [...prev, { role: "assistant", ...enriched }]);
    setThinking(false);
  };

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-[24px] border border-white/10 bg-[#0D1526] p-6">
      <div className="shrink-0">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] uppercase tracking-[0.14em] text-cyan-200/80">Co-Pilot Dock</p>
          <span className={`rounded-full px-2 py-1 text-[10px] ${selectedPlan && selectedPlan.score.totalScore >= 75 ? "bg-emerald-500/20 text-emerald-200" : "bg-amber-500/20 text-amber-200"}`}>{selectedPlan && selectedPlan.score.totalScore >= 75 ? "Ship-safe" : "Watch risk"}</span>
        </div>
        <p className="line-clamp-2 text-sm text-slate-200">{todayFocus}</p>
        {editingTitle && <p className="mt-2 rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">Context: Editing {editingTitle}</p>}
      </div>

      <div className="my-4 grid shrink-0 grid-cols-2 gap-2">
        {quickIntents.map((chip) => (
          <button key={chip.label} onClick={() => applyIntent(chip.intent, chip.label)} className="rounded-xl border border-white/10 bg-slate-900/60 px-2 py-2 text-xs hover:border-cyan-300/40 hover:bg-slate-800">
            {chip.label}
          </button>
        ))}
      </div>

      {changeLog.length > 0 && (
        <div className="mb-3 shrink-0 rounded-2xl bg-slate-900/60 p-3">
          <p className="text-[10px] uppercase tracking-[0.14em] text-slate-400">What changed</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">{changeLog.slice(0, 4).map((line) => <li key={line}>{line}</li>)}</ul>
        </div>
      )}

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl bg-slate-950/50 p-3">
        {history.map((item, idx) =>
          item.role === "user" ? (
            <div key={`u-${idx}`} className="ml-auto max-w-[90%] rounded-2xl bg-cyan-500/20 px-3 py-2 text-sm text-cyan-100">{item.text}</div>
          ) : (
            <div key={`a-${idx}`} className="mr-auto max-w-[95%] rounded-2xl bg-slate-800 px-3 py-2 text-sm text-slate-100">
              <p>{item.summary}</p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-300">{item.why.slice(0, 4).map((line) => <li key={line}>{line}</li>)}</ul>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.applyNow.map((action) => (
                  <button key={action.label} onClick={() => applyIntent(action.intent, action.label)} className="rounded-full border border-white/20 bg-slate-900 px-2 py-1 text-[11px] hover:border-cyan-300/60">
                    {action.label}
                  </button>
                ))}
              </div>
              {item.fallback && <p className="mt-2 text-xs text-cyan-100">Fallback: {item.fallback}</p>}
            </div>
          )
        )}
        {thinking && <p className="text-xs text-slate-400">Thinking… evaluating route safety and itinerary constraints.</p>}
        {selectedPlan && <p className="text-[11px] text-slate-400">Plan score: {selectedPlan.score.totalScore}</p>}
      </div>

      {dockToast && <p className="mt-2 shrink-0 rounded-xl bg-cyan-500/20 px-3 py-2 text-xs text-cyan-100">{dockToast}</p>}

      <div className="mt-3 shrink-0 border-t border-white/10 bg-[#0D1526] pt-3">
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
