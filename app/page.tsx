"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Types ---------- */
type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

/* ---------- Page ---------- */
export default function Page() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Welcome aboard 👋 I’m your PortTrip Concierge. Tell me your **port** and **time window** (e.g., “Barcelona · 6 hours · 09:00–15:00”), plus any preferences (kids, mobility, food)."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // smooth autoscroll whenever messages change
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  // quick suggestion chips
  const chips = useMemo(
    () => [
      "Best 6-hour plan",
      "Top 3 sights, minimal walking",
      "Mobility-friendly loop",
      "Local food near the port",
      "Kid-friendly afternoon",
      "Hidden gems within 30 min"
    ],
    []
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setErrorBanner(null);
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    // Create a placeholder assistant bubble for streaming
    const placeholderIndex = next.length;
    setMessages([...next, { role: "assistant", content: "" }]);

    try {
      // Try streaming first (works with your streaming /api/chat)
      let streamed = false;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Backends we've used: either expect {history,...} or {messages}.
        // We'll send both keys to be compatible.
        body: JSON.stringify({ history: next, messages: next, fallbackGeneral: true })
      });

      const ct = res.headers.get("content-type") || "";

      // If server returned JSON error, surface it nicely
      if (!res.ok && ct.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message ||
          err?.error ||
          "The server rejected the request. Please try again in a moment.";
        setMessages((m) => {
          const copy = [...m];
          copy[placeholderIndex] = {
            role: "assistant",
            content: `⚠️ ${msg}`
          };
          return copy;
        });
        setLoading(false);
        return;
      }

      // STREAMING: content-type is usually text/plain or no JSON
      if (!ct.includes("application/json") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        streamed = true;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value);
          setMessages((m) => {
            const copy = [...m];
            copy[placeholderIndex] = { role: "assistant", content: acc };
            return copy;
          });
        }
      }

      // NON-STREAMING fallback: backend returned JSON with {reply} or {answer}
      if (!streamed) {
        const data = await res.json().catch(() => ({}));
        const reply =
          (data?.reply as string) ||
          (data?.answer as string) ||
          data?.content ||
          "Sorry — I couldn’t generate a reply.";

        setMessages((m) => {
          const copy = [...m];
          copy[placeholderIndex] = { role: "assistant", content: reply };
          return copy;
        });
      }
    } catch (err: any) {
      setErrorBanner("Network hiccup. Please try again.");
      setMessages((m) => {
        const copy = [...m];
        copy[placeholderIndex] = {
          role: "assistant",
          content: "I hit a network error. Try again in a moment."
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#f3f6ff] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🚢</span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            PortTrip Concierge
          </h1>
          <span className="ml-auto text-xs text-slate-500">beta</span>
        </div>
      </header>

      {/* Body */}
      <main className="max-w-5xl mx-auto w-full px-5 py-5 flex-1 flex flex-col gap-3">
        {/* Banner */}
        {errorBanner && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
            {errorBanner}
          </div>
        )}

        {/* Chat window */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4"
          style={{ minHeight: "58vh" }}
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.content} />
          ))}
          {loading && <TypingBubble />}
        </div>

        {/* Quick chips */}
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => setInput(c)}
              className="text-sm px-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50"
            >
              {c}
            </button>
          ))}
        </div>

        {/* Composer */}
        <form onSubmit={handleSend} className="sticky bottom-0">
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything (e.g., “Barcelona · 6 hours · best plan from the cruise terminal?”)'
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
          <p className="text-[11px] text-slate-500 mt-2">
            Tip: Include your **arrival→all-aboard time** and **preferences** (kids, mobility, budget).
          </p>
        </form>
      </main>

      {/* Footer */}
      <footer className="px-5 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} PortTrip Concierge · Made for fast, safe port days
      </footer>
    </div>
  );
}

/* ---------- UI Parts ---------- */

function Bubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div className="flex items-start gap-2 max-w-[85%]">
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold select-none shadow-sm">
            PT
          </div>
        )}
        <div
          className={`px-4 py-3 whitespace-pre-wrap rounded-2xl shadow-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-slate-50 text-slate-900 border border-slate-200 rounded-bl-sm"
          }`}
          style={{ wordBreak: "break-word" }}
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
        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold select-none shadow-sm">
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
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.2s]" />
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce [animation-delay:-0.1s]" />
      <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
    </div>
  );
}
