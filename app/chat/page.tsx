"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Welcome aboard 👋 I’m your **PortTrip Concierge**.\nTell me your **port** and **time window** (e.g., *Barcelona · 6 hours · 09:00–15:00*), plus any preferences (kids, mobility, budget)."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const chips = useMemo(
    () => [
      "Best 6-hour plan from the cruise terminal",
      "Top 3 sights with minimal walking",
      "Mobility-friendly loop with rest stops",
      "Local food near the port",
      "Kid-friendly afternoon plan",
    ],
    []
  );

  /* ---------------- Display normalizer (fixes spacing + numbering) ---------------- */

  /** Collapse excessive whitespace & clean bullets/blank lines. */
  function collapseSpacing(txt: string) {
    if (!txt) return "";
    // Remove 3+ blank lines -> 1
    txt = txt.replace(/\n{3,}/g, "\n\n");
    // Remove lines that are just bullets/dashes
    txt = txt.replace(/^\s*(?:[-•]|\*\s*)\s*$/gm, "");
    // Trim trailing spaces on each line
    txt = txt.replace(/[ \t]+$/gm, "");
    // Make sure there is never a blank line right before a list item
    txt = txt.replace(/\n{2,}(\s*(?:[-•]|\d+\.)\s+)/g, "\n$1");
    return txt.trim();
  }

  /** Renumber ordered lists so each contiguous block is 1..n */
  function renumberOrderedLists(txt: string) {
    const lines = txt.split("\n");
    let inOL = false;
    let n = 0;

    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Matches "  7. content" or "1) content"
      const m = line.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);
      const isBullet = /^\s*[-•]\s+/.test(line);
      const isBlank = line.trim() === "";
      const isHeading = /^#{1,6}\s/.test(line) || /^\*\*.*\*\*:?$/.test(line);

      if (m) {
        if (!inOL) {
          inOL = true;
          n = 1;
        } else n += 1;

        const indent = m[1] || "";
        const content = m[3] || "";
        out.push(`${indent}${n}. ${content}`);
      } else {
        if (inOL && (isBlank || isBullet || isHeading)) {
          inOL = false;
          n = 0;
        }
        out.push(line);
      }
    }
    return out.join("\n");
  }

  /** Demote lines like "1. Transportation Options" to "**Transportation Options:**" (prevents fake lists). */
  function demoteNumberedHeadings(txt: string) {
    return txt.replace(
      /^\s*\d+\.\s*([A-Z][^\n]{0,60}?):?\s*$(?=\n(?:\s*[-•]|\s*$|\s*#{1,6}\s))/gmi,
      (_, h: string) => `**${h.trim()}:**`
    );
  }

  /** Main normalizer used just before displaying the assistant message. */
  function normalizeForDisplay(txt: string) {
    let t = String(txt || "");
    t = collapseSpacing(t);
    t = demoteNumberedHeadings(t);
    t = renumberOrderedLists(t);
    // final tiny pass: prevent double blank lines after headings
    t = t.replace(/(^|\n)(#{1,6} .+)\n{2,}/g, "$1$2\n");
    return t;
  }

  /* ---------------- Chat actions ---------------- */

  async function sendMessage(text: string) {
    if (!text || loading) return;

    setBanner(null);
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    // Reserve a slot for streaming assistant
    const idx = history.length;
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, history, fallbackGeneral: true }),
      });

      const ct = res.headers.get("content-type") || "";

      // JSON error from server (e.g., validation)
      if (!res.ok && ct.includes("application/json")) {
        const err = await res.json().catch(() => ({}));
        const msg = err?.message || err?.error || "The server rejected the request.";
        setMessages((m) => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: `⚠️ ${msg}` };
          return copy;
        });
        setLoading(false);
        return;
      }

      // Streamed text (edge/stream)
      if (!ct.includes("application/json") && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value);
          setMessages((m) => {
            const copy = [...m];
            copy[idx] = { role: "assistant", content: normalizeForDisplay(acc) };
            return copy;
          });
        }
      } else {
        // Non-stream JSON response
        const data = await res.json().catch(() => ({}));
        const reply =
          data?.reply || data?.answer || data?.content || "Sorry — I couldn’t generate a reply.";
        setMessages((m) => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: normalizeForDisplay(reply) };
          return copy;
        });
      }
    } catch {
      setBanner("Network hiccup. Please try again.");
      setMessages((m) => {
        const copy = [...m];
        copy[idx] = {
          role: "assistant",
          content: "I hit a network error. Try again shortly.",
        };
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    await sendMessage(text);
  }

  function handleChipClick(text: string) {
    // One-tap send
    sendMessage(text);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* deco gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚢</span>
            <div className="text-xl font-semibold tracking-tight sm:text-2xl">
              PortTrip Concierge
            </div>
          </div>
          <a href="/" className="text-sm text-slate-300 hover:text-white/90">
            Back to site
          </a>
        </div>

        {banner && (
          <div className="mb-3 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {banner}
          </div>
        )}

        <div
          ref={scrollerRef}
          className="min-h-[60vh] space-y-5 rounded-[24px] border border-white/15 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-6"
        >
          {messages.map((m, i) => (
            <Bubble key={i} role={m.role} content={m.role === "assistant" ? normalizeForDisplay(m.content) : m.content} />
          ))}
          {loading && <TypingBubble />}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <button
              key={c}
              onClick={() => handleChipClick(c)}
              className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
            >
              {c}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="sticky bottom-0">
          <div className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='Ask anything (e.g., “Barcelona · 6 hours · best plan from the cruise terminal?”)'
              className="flex-1 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-inner placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-60"
            >
              {loading ? "Planning…" : "Ask"}
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-300">
            Tip: include **arrival → all-aboard** time + preferences (kids, mobility, budget) for a sharper plan.
          </p>
        </form>
      </div>
    </div>
  );
}

/* --------------------------------- UI pieces --------------------------------- */

function Bubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>

