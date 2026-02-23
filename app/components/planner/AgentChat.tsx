"use client";

import { useState } from "react";
import type { AgentSuggestion, PlannerAgentResponse } from "@/app/lib/planner/types";

export default function AgentChat({ requestPayload, onApplySuggestion, onReply }: {
  requestPayload: (message: string) => Record<string, unknown>;
  onApplySuggestion: (s: AgentSuggestion) => void;
  onReply: (response: PlannerAgentResponse) => void;
}) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [latest, setLatest] = useState<PlannerAgentResponse | null>(null);

  const ask = async () => {
    if (!message.trim()) return;
    setLoading(true);
    const res = await fetch("/api/planner/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestPayload(message)),
    });
    const data = await res.json() as PlannerAgentResponse;
    setLatest(data);
    onReply(data);
    setLoading(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm" placeholder="Ask for swaps, less walking, lunch ideas..." />
        <button onClick={ask} className="rounded-lg bg-cyan-400 px-3 text-slate-900">{loading ? "..." : "Ask"}</button>
      </div>
      {latest && (
        <div className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
          <p className="whitespace-pre-wrap text-sm">{latest.assistantMessage}</p>
          <div className="mt-3 space-y-2">
            {latest.suggestions.map((s) => (
              <div key={s.id} className="rounded-lg bg-slate-800 p-2 text-sm">
                <p className="font-medium">{s.title}</p>
                <p className="text-slate-300">{s.description}</p>
                <button onClick={() => onApplySuggestion(s)} className="mt-2 rounded bg-cyan-400 px-2 py-1 text-xs text-slate-900">Add to plan</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
