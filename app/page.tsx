"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------- Types ---------------- */
type Role = "user" | "assistant";
type ChatMsg = { role: Role; content: string };

/* ---------------- Page ---------------- */
export default function Page() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: "assistant",
      content:
        "Welcome aboard 👋 I’m your **PortTrip Concierge**.\n\nTell me your **port** and **time window** (e.g., *Barcelona · 6 hours · 09:00–15:00*) and any preferences (kids, mobility, budget)."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  const scrollerRef = useRef<HTMLDivElement>(null);

  // Smooth autoscroll on new content
  useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  const chips = useMemo(
    () => [
      "Best 6-hour plan from the cruise terminal",
      "Top 3 sights with minimal walking",
      "Mobility-friendly loop with rest stops",
      "Local food near the port",
      "Kid-friendly afternoon plan"
    ],
    []
  );

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setBanner(null);

    const history = [...messages, { role: "user" as const, content: text }];
    setMessages(history);
    setInput("");
    setLoading(true);

    // Placeholder assistant bubble for streaming
    const placeholderIndex = history.length;
    setMessages([...history, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Be compatible with both {messages} and {history} server handlers
        body: JSON.stringify({ messages: history, history, fallbackGeneral: true })
      });

      const ct = res.headers.get("content-type") || "";
      // JSON error? show friendly note
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

      // STREAM path (text/plain/no JSON)
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
            copy[placeholderIndex] = { role: "assistant", content: acc };
            return copy;
          });
        }
      } else {
        // NON-STREAM path (JSON)
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
    } catch (err) {
      setBanner("Network hiccup. Please try again.");
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
    <div className="min-h-screen bg-gradient-to-b from-[#f9fbff] via-[#f4f7ff] to-[#eef2ff] flex flex-col">
      {/* Top Nav */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🚢</span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">PortTrip Concierge</h1>
          <span className="ml-auto text-xs text-slate-500">beta</span>
        </div>
      </nav>

      {/* Body */}
      <main className="max-w-5xl mx-auto w-full px-5 py-5 flex-1 flex flex-col gap-3">
        {banner && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-900 px-3 py-2 text-sm">
            {banner}
          </div>
        )}

        {/* Chat Window */}
        <div
          ref={scrollerRef}
          className="flex-1 overflow-y-auto rounded-[20px] bg-white/70 border border-slate-200 shadow-[0_6px_24px_rgba(15,23,42,0.06)] p-4 space-y-5"
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
              className="text-sm px-3 py-1.5 rounded-full border border-slate-200 bg-white/70 hover:bg-white shadow-sm"
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
              className="flex-1 p-3 rounded-xl bg-white/90 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 shadow"
            >
              {loading ? "Planning…" : "Ask"}
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Tip: Include **arrival → all-aboard** time and preferences (kids, mobility, budget) for a sharper plan.
          </p>
        </form>
      </main>

      {/* Footer */}
      <footer className="px-5 py-6 text-center text-[11px] text-slate-400">
        © {new Date().getFullYear()} PortTrip Concierge · Made for fast, safe port days
      </footer>
    </div>
  );
}

/* ---------------- UI Pieces ---------------- */

function Bubble({ role, content }: { role: Role; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}>
      <div className="flex items-start gap-3 max-w-[85%]">
        {!isUser && (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold select-none shadow">
            PT
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl backdrop-blur ${
            isUser
              ? "bg-blue-600 text-white shadow-md rounded-br-sm"
              : "bg-white/80 text-slate-900 border border-slate-200 shadow-sm rounded-bl-sm"
          }`}
          style={{ wordBreak: "break-word" }}
        >
          <Markdown text={content} />
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xs font-semibold select-none shadow">
          PT
        </div>
        <div className="px-4 py-3 rounded-2xl bg-white/80 border border-slate-200 shadow-sm rounded-bl-sm">
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

/* ---------------- Tiny Markdown renderer (no deps) ----------------
   Supports: **bold**, *italic*, bullet lists (-, •), numbered lists, 
   and newlines. Keeps it safe with very limited HTML.             */
function Markdown({ text }: { text: string }) {
  const html = useMemo(() => {
    if (!text) return "";
    let t = text;

    // Escape < and >
    t = t.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Bold **...**
    t = t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    // Italic *...*
    t = t.replace(/\*(.+?)\*/g, "<em>$1</em>");

    // Lists: lines starting with -, • or digits.
    const lines = t.split(/\n/);
    const out: string[] = [];
    let inUL = false;
    let inOL = false;
    const closeLists = () => {
      if (inUL) out.push("</ul>"), (inUL = false);
      if (inOL) out.push("</ol>"), (inOL = false);
    };

    for (const line of lines) {
      const ulMatch = line.match(/^\s*(?:-|\u2022)\s+(.*)$/); // - or •
      const olMatch = line.match(/^\s*(\d+)\.\s+(.*)$/);

      if (ulMatch) {
        if (!inUL) closeLists(), out.push("<ul class='list-disc pl-5 space-y-1'>"), (inUL = true);
        out.push(`<li>${ulMatch[1]}</li>`);
      } else if (olMatch) {
        if (!inOL) closeLists(), out.push("<ol class='list-decimal pl-5 space-y-1'>"), (inOL = true);
        out.push(`<li>${olMatch[2]}</li>`);
      } else if (line.trim() === "") {
        closeLists();
        out.push("<br/>");
      } else {
        closeLists();
        out.push(`<p>${line}</p>`);
      }
    }
    closeLists();

    return out.join("\n");
  }, [text]);

  // eslint-disable-next-line react/no-danger
  return <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}
