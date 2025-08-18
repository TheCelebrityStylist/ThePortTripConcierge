import { NextRequest } from "next/server";
import OpenAI from "openai";

// ---- Load your local port data (JSON at project root) ----
import portData from "../../../porttrip.json";

// ---- Model + knobs ----
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_LOCAL_PASSAGES = 12;
const MAX_WEB_SNIPPETS = 6;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --------- Helpers ---------

// Very small tokenizer-ish split
function chunks(s: string, size = 500): string[] {
  const parts: string[] = [];
  for (let i = 0; i < s.length; i += size) parts.push(s.slice(i, i + size));
  return parts;
}

// Keyword score (cheap + fast); favors exact port hits
function keywordScore(q: string, text: string): number {
  const words = q.toLowerCase().split(/\W+/).filter(Boolean);
  const hay = text.toLowerCase();
  let score = 0;
  for (const w of words) {
    if (hay.includes(w)) score += 1;
  }
  return score;
}

// Embed with OpenAI for semantic rerank
async function embed(texts: string[]) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: texts
  });
  return res.data.map((d) => d.embedding);
}

function dot(a: number[], b: number[]) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// Tavily web search (simple, good defaults)
async function webSearch(query: string) {
  if (!process.env.TAVILY_API_KEY) return [];
  const resp = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: "advanced",
      max_results: 8,
      include_answer: false,
      include_raw_content: false
    })
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  const items: any[] = data.results || [];
  return items.slice(0, MAX_WEB_SNIPPETS).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.content || r.snippet || ""
  }));
}

// Build the system prompt (tone + guardrails)
const SYSTEM = `You are PortTrip Concierge, a warm, expert cruise assistant.
Style: conversational, proactive, crisp. Avoid generic filler.
When you give plans, keep timing tight, include costs if known, and a ship-return buffer.
Always ask 1 brief clarifying question if the user's ask is underspecified.
Prioritize grounded facts from provided CONTEXT. Use WEB facts only when local context is missing
or clearly out of date. If you are not sure, say so briefly and suggest how to check at the port.

If user asks outside cruising, answer, but keep it brief and helpful. Avoid speculation.`;

// Compose a compact context block from local + web
function contextBlock(local: any[], web: any[]) {
  const L = local
    .slice(0, MAX_LOCAL_PASSAGES)
    .map((x, i) => `• [LOCAL ${i + 1} | ${x.port} | ${x.category}] ${x.snippet}`)
    .join("\n");

  const W = web
    .slice(0, MAX_WEB_SNIPPETS)
    .map((x, i) => `• [WEB ${i + 1}] ${x.title} — ${x.snippet} (${x.url})`)
    .join("\n");

  return `CONTEXT:\n${L || "(no local)"}\n${W ? "\nWEB:\n" + W : ""}`;
}

// --------- The route (streams text/plain) ---------
export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    // Accept either {messages} or {history}
    const history = (body?.messages || body?.history || []) as { role: "user" | "assistant" | "system"; content: string }[];

    // Latest user query
    const userLast = [...history].reverse().find((m) => m.role === "user");
    const userQuery = userLast?.content || "";

    // Try to detect a port hint (very light)
    const portHintMatch = userQuery.match(/\b([A-Z][a-z]+(?:\s\([A-Z][a-z]+\))?)\b/);
    const portHint = portHintMatch?.[1];

    // 1) Gather candidate passages from your local JSON
    const localPool = (Array.isArray(portData) ? portData : []) as Array<{ port: string; category?: string; snippet: string }>;
    const annotated = localPool.map((row, i) => ({
      ...row,
      _id: i,
      _text: `${row.port} ${row.category || ""} ${row.snippet}`
    }));

    // Keyword pre-filter
    const byKeyword = annotated
      .map((r) => ({ r, score: keywordScore(userQuery + " " + (portHint || ""), r._text) + (portHint && r.port.includes(portHint) ? 2 : 0) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 32)
      .map((x) => x.r);

    // Embedding rerank
    let localSelected = byKeyword;
    try {
      const [qEmb, ...candEmb] = await embed([userQuery, ...byKeyword.map((r) => r._text)]);
      const scored = byKeyword.map((r, idx) => ({ r, s: dot(qEmb, candEmb[idx]) }));
      localSelected = scored.sort((a, b) => b.s - a.s).slice(0, MAX_LOCAL_PASSAGES).map((x) => x.r);
    } catch {
      // If embedding fails (quota/offline), keep keyword hits
      localSelected = byKeyword.slice(0, MAX_LOCAL_PASSAGES);
    }

    // 2) Web lookup only if we seem to lack details or the user asks for "latest / open / today / prices"
    const needWeb = /today|latest|open|closed|price|schedule|shuttle|ferry|strike|weather|holiday|changed/i.test(userQuery);
    const web = needWeb ? await webSearch(userQuery) : [];

    // 3) Build the conversation we’ll send to OpenAI
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content:
          "You will receive a CONTEXT block with local database excerpts and possibly web snippets. Prefer local facts; use web facts sparingly and cite briefly (name the place, no raw URLs)."
      },
      {
        role: "system",
        content: contextBlock(localSelected, web)
      },
      ...history.map((m) => ({ role: m.role, content: m.content } as OpenAI.ChatCompletionMessageParam))
    ];

    // 4) Stream the response
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      stream: true
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const delta = part.choices?.[0]?.delta?.content || "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (e: any) {
          controller.enqueue(encoder.encode(`\n\n(Streaming interrupted.)`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

