"use client";

import { useState } from "react";

export default function AgentChat({ onAsk }: { onAsk: (message: string) => string }) {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);

  const submit = () => {
    if (!message.trim()) return;
    const reply = onAsk(message.trim());
    setHistory((prev) => [...prev, { role: "user", text: message.trim() }, { role: "assistant", text: reply }]);
    setMessage("");
  };

  return (
    <div className="space-y-3 pb-20 sm:pb-0">
      <div className="flex gap-2">
        <input value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-lg bg-slate-800 p-2 text-sm" placeholder="Ask about delays, lunch timing, or lower walking..." />
        <button onClick={submit} className="rounded-lg bg-cyan-400 px-3 text-slate-900">Ask</button>
      </div>
      <div className="space-y-2">
        {history.map((entry, idx) => (
          <div key={idx} className={`rounded-lg p-2 text-sm ${entry.role === "assistant" ? "bg-slate-900/80" : "bg-slate-800"}`}>{entry.text}</div>
        ))}
      </div>
    </div>
  );
}
