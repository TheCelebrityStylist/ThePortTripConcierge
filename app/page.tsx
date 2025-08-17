"use client";

import { useEffect, useRef, useState } from "react";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function Page() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Hi! I’m your PortTrip Concierge. Tell me your port + time window (e.g., “Barcelona, 6 hours 09:00–15:00”) and what you like."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next })
      });
      const data = await res.json();
      const replyText =
        typeof data?.reply === "string"
          ? data.reply
          : (data?.answer as string) || data?.error || "Sorry — I couldn’t generate a reply.";
      setMessages([...next, { role: "assistant", content: replyText }]);
    } catch (err: any) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: "I hit an error reaching the server. Please try again in a moment."
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quickChips = [
    "Best 6-hour plan",
    "Top 3 sights, minimal walking",
    "Mobility-friendly loop",
    "Local food near the port",
    "Kid-friendly afternoon"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-100 flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🚢</span>
          <h1 className="text-xl sm:text-2xl font-semibold">PortTrip Concierge</h1>
          <span className="ml-auto text-xs text-slate-500">beta</span>
        </div>
      </header>

      {/* MAIN CHAT CARD */}
      <main className="max-w-4xl mx-auto w-full px-5 py-5 flex-1 flex flex-col gap-3">
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4"
          style={{ minHeight: "58vh" }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <TypingBubble />}
        </div>

        {/* QUICK CHIPS */}
        <div className="flex flex-wrap gap-2">
          {quickChips.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              className="text-sm px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
            >
              {c}
            </button>
          ))}
        </div>

        {/* COMPOSER */}
        <form
          onSubmit={handleSend}
          className="sticky bottom-0 bg-transparent"
        >
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything (e.g., “Best 6-hour plan from the cruise terminal?”)'
              className="flex-1 p-3 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

/* ------------------- UI PARTS ------------------- */

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div className={`flex items-start gap-2 max-w-[85%]`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm select-none">
            PT
          </div>
        )}
        <div
          className={`px-4 py-3 whitespace-pre-wrap rounded-2xl shadow-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-sm"
          }`}
        >
          {content}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm select-none">
          PT
        </div>
        <div className="px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 rounded-bl-sm">
          <Dots />
        </div>
      </div>
    </div>
  );
}

function Dots() {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.2s]" /
