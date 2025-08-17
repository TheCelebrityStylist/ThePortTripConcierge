"use client";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };
type Port = { id: string; name: string; region?: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! Tell me your port and time window (e.g., “Barcelona, 6 hours 9:00–15:00”)." }
  ]);
  const [input, setInput] = useState("");
  const [portHint, setPortHint] = useState("");
  const [suggestions, setSuggestions] = useState<Port[]>([]);
  const [showSug, setShowSug] = useState(false);
  const [loading, setLoading] = useState(false);
  const outRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    outRef.current?.scrollTo({ top: outRef.current.scrollHeight });
  }, [messages]);

  // fetch port suggestions as user types
  useEffect(() => {
    const q = portHint.trim();
    let active = true;
    if (!q) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/ports?q=${encodeURIComponent(q)}`);
        const data = (await res.json()) as Port[];
        if (active) setSuggestions(data.slice(0, 8));
      } catch { /* ignore */ }
    }, 150);
    return () => { active = false; clearTimeout(t); };
  }, [portHint]);

  async function send() {
    if (!input.trim() || loading) return;
    const user: Msg = { role: "user", content: input.trim() };
    setMessages(m => [...m, user]);
    setInput("");
    setLoading(true);

    // placeholder assistant for streaming
    const idx = messages.length + 1;
    setMessages(m => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: [...messages, user],
          portHint: portHint || "",
          fallbackGeneral: true
        })
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No stream");

      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value);
        setMessages(m => {
          const copy = [...m];
          copy[idx] = { role: "assistant", content: acc };
          return copy;
        });
      }

      // simple follow-up prompts to gather key info
      const lower = acc.toLowerCase();
      const needsWhen = !/hours|h:|am|pm|\d{1,2}:\d{2}/.test(input.toLowerCase());
      const needsMobility = !/(wheelchair|mobility|stroller)/.test(lower);
      const chips: string[] = [];
      if (needsWhen) chips.push("I have 5 hours, 10:00–15:00");
      if (needsMobility) chips.push("We need mobility-friendly stops");
      if (chips.length) {
        setMessages(m => [...m, { role: "assistant", content: "Quick add-ons: " + chips.map(c => `“${c}”`).join(" · ") }]);
      }
    } catch (e: any) {
      setMessages(m => [...m, { role: "assistant", content: "Error: " + e.message }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send();
  }

  return (
    <main className="min-h-screen bg-[#f6f7fb] flex justify-center">
      <div className="w-full max-w-3xl p-6">
        <header className="flex items-center gap-2">
          <span className="text-2xl">🚢</span>
          <h1 className="text-2xl font-semibold">PortTrip Concierge</h1>
        </header>
        <p className="text-gray-600 mt-1">Interactive, tailored answers grounded in your port database.</p>

        {/* chat window */}
        <div ref={outRef} className="mt-5 bg-white border border-gray-200 rounded-2xl p-4 h-[56vh] overflow-auto space-y-3 shadow-sm">
          {messages.map((m, i) => (
            <div
              key={i}
              className={m.role === "user"
                ? "ml-auto max-w-[85%] bg-blue-600 text-white p-3 rounded-2xl rounded-br-sm"
                : "mr-auto max-w-[90%] bg-gray-50 border border-gray-200 p-3 rounded-2xl rounded-bl-sm"}
            >
              <div className="text-xs opacity-70 mb-1">{m.role === "user" ? "You" : "Concierge"}</div>
              <div className="whitespace-pre-wrap">{m.content}</div>
            </div>
          ))}
        </div>

        {/* port hint with autocomplete */}
        <div className="relative mt-3">
          <input
            className="w-full p-3 border rounded-xl bg-white"
            placeholder="Optional: Port (start typing… e.g., Barc…)"
            value={portHint}
            onChange={(e) => { setPortHint(e.target.value); setShowSug(true); }}
            onFocus={() => setShowSug(true)}
            onBlur={() => setTimeout(() => setShowSug(false), 150)}
          />
          {showSug && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow">
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  onMouseDown={() => { setPortHint(s.name); setShowSug(false); }}
                >
                  {s.name} <span className="text-gray-500 text-sm">· {s.region || ""}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* composer */}
        <form onSubmit={onSubmit} className="mt-2 flex gap-2">
          <input
            className="flex-1 p-3 border rounded-xl bg-white"
            placeholder='Ask anything (e.g., “Best 6-hour plan from the cruise terminal?”)'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Thinking…" : "Ask"}
          </button>
        </form>
      </div>
    </main>
  );
}
