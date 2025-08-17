"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Ask me anything about your port day." }
  ]);
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            // system instruction (optional; keeps API simple)
            { role: "system", content: "You are PortTrip Concierge. Be concise, practical, and step-by-step." },
            // prior turns + new user message
            ...messages.map(({ role, content }) => ({ role, content })),
            userMsg
          ]
        })
      });

      const data = await res.json();
      const reply = (data?.reply as string) || data?.error || "No reply.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <main className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-2xl p-6">
        <h1 className="text-3xl font-bold">🚢 PortTrip Concierge</h1>
        <p className="text-gray-600 mt-1">Ask about any cruise port—what to do, logistics, tips.</p>

        <div className="mt-6 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-3 rounded border ${
                m.role === "user" ? "bg-white" : "bg-blue-50 border-blue-100"
              }`}
            >
              <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                {m.role === "user" ? "You" : "Concierge"}
              </div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <input
            className="flex-1 p-3 border rounded focus:outline-none focus:ring focus:ring-blue-200 bg-white"
            placeholder="e.g., Best 6-hour plan in Athens from the cruise port?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 rounded bg-blue-600 text-white disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>
      </div>
    </main>
  );
}
