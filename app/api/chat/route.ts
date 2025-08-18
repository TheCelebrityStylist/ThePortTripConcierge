// app/api/chat/route.ts
import { NextRequest } from "next/server";
import OpenAI from "openai";
import portData from "../../../porttrip.json"; // requires "resolveJsonModule": true in tsconfig

export const runtime = "edge";

/* ---------------------------- CONFIG ---------------------------- */
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_LOCAL_PASSAGES = 12;
const MAX_WEB_SNIPPETS = 6;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* --------------------------- HELPERS ---------------------------- */

// Very small keyword score (fast prefilter)
function keywordScore(q: string, text: string): number {
  const words = q.toLowerCase().split(/\W+/).filter(Boolean);
  const hay = text.toLowerCase();
  let score = 0;
  for (const w of words) if (hay.includes(w)) score += 1;
  return score;
}

// OpenAI embeddings for a semantic rerank
async function embed(texts: string[]): Promise<number[][]> {
  const res = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: texts
  });
  return res.data.map((d) => d.embedding as number[]);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// Optional web lookup (Tavily). If no TAVILY_API_KEY, returns []
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
    title: r.title || "",
    url: r.url || "",
    snippet: (r.content || r.snippet || "").toString()
  }));
}

// Persona / system style (kept as plain quoted string)
const SYSTEM =
  "You are PortTrip Concierge, a warm, expert cruise assistant. " +
  "Style: conversational, proactive, crisp. Avoid generic filler. " +
  "When you give plans, keep timing tight, include costs if known, " +
  "and always include a ship-return buffer. " +
  "Ask one brief clarifying question when the ask is underspecified. " +
  "Prefer grounded facts from the provided CONTEXT. Use WEB facts only " +
  "when local context is missing or clearly out of date. If you are unsure, " +
  "say so briefly and suggest how to check at the port.";

// Build compact CONTEXT block from local + web
function contextBlock(local: any[], web: any[]) {
  const L = local
    .slice(0, MAX_LOCAL_PASSAGES)
    .map((x: any, i: number) => {
      const port = (x.port || "").toString();
      const cat = (x.category || "").toString();
      const snip = (x.snippet || "").toString();
      return "• [LOCAL " + (i + 1) + " | " + port + " | " + cat + "] " + snip;
    })
    .join("\n");

  const W = web
    .slice(0, MAX_WEB_SNIPPETS)
    .map((x: any, i: number) => {
      const title = (x.title || "").toString();
      const snip = (x.snippet || "").toString();
      const url = (x.url || "").toString();
      return "• [WEB " + (i + 1) + "] " + title + " — " + snip + " (" + url + ")";
    })
    .join("\n");

  let out = "CONTEXT:\n" + (L || "(no local)");
  if (W) out += "\n\nWEB:\n" + W;
  return out;
}

/* ---------------------------- ROUTE ----------------------------- */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const history = (body?.messages || body?.history || []) as {
      role: "user" | "assistant" | "system";
      content: string;
    }[];

    // Latest user query
    const userLast = [...history].reverse().find((m) => m.role === "user");
    const userQuery = (userLast?.content || "").toString();

    // Local pool from porttrip.json (expected array of { port, category?, snippet })
    const localPool = (Array.isArray(portData) ? portData : []) as Array<{
      port: string;
      category?: string;
      snippet: string;
    }>;

    const annotated = localPool.map((row, i) => ({
      ...row,
      _id: i,
      _text: (row.port || "") + " " + (row.category || "") + " " + (row.snippet || "")
    }));

    // 1) Keyword prefilter
    const byKeyword = annotated
      .map((r) => ({ r, score: keywordScore(userQuery, r._text) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 32)
      .map((x) => x.r);

    // 2) Embedding rerank (if it fails, fall back to keyword hits)
    let localSelected = byKeyword;
    try {
      const [qEmb, ...candEmb] = await embed([userQuery, ...byKeyword.map((r) => r._text)]);
      const scored = byKeyword.map((r, idx) => ({ r, s: dot(qEmb, candEmb[idx]) }));
      localSelected = scored.sort((a, b) => b.s - a.s).slice(0, MAX_LOCAL_PASSAGES).map((x) => x.r);
    } catch {
      localSelected = byKeyword.slice(0, MAX_LOCAL_PASSAGES);
    }

    // 3) Decide if a web lookup is helpful
    const needWeb = /today|latest|open|closed|price|schedule|shuttle|ferry|strike|weather|holiday|changed|closure|ticket/i.test(
      userQuery
    );
    const web = needWeb ? await webSearch(userQuery) : [];

    // 4) Compose messages for the model
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content:
          "You will receive a CONTEXT block with local database excerpts and possibly web snippets. " +
          "Prefer local facts; use web facts sparingly and cite briefly (name the source/place, no raw URLs)."
      },
      { role: "system", content: contextBlock(localSelected, web) },
      ...history
    ];

    // 5) Stream response
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
          // @ts-ignore — OpenAI SDK returns an AsyncIterable for streamed parts
          for await (const part of stream) {
            const delta = (part as any)?.choices?.[0]?.delta?.content || "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch {
          controller.enqueue(encoder.encode("\n\n(Streaming interrupted.)"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}

