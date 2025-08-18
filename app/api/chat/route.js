// app/api/chat/route.js
export const runtime = "edge";

import OpenAI from "openai";
// JSON import at build time; Next bundler handles this in JS with "assert"
import portData from "../../../porttrip.json" assert { type: "json" };

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_LOCAL_PASSAGES = 12;
const MAX_WEB_SNIPPETS = 6;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- helpers (no TS, no backticks) ----------
function keywordScore(q, text) {
  const words = (q || "").toLowerCase().split(/\W+/).filter(Boolean);
  const hay = (text || "").toLowerCase();
  let s = 0;
  for (const w of words) if (hay.includes(w)) s += 1;
  return s;
}

async function embed(texts) {
  const res = await client.embeddings.create({
    model: "text-embedding-3-large",
    input: texts
  });
  return res.data.map((d) => d.embedding);
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

async function webSearch(query) {
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
  const items = data.results || [];
  return items.slice(0, MAX_WEB_SNIPPETS).map((r, i) => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.content || r.snippet || ""
  }));
}

const SYSTEM =
  "You are PortTrip Concierge, a warm, expert cruise assistant. " +
  "Your goal is to feel like a knowledgeable local guide who understands cruise logistics. " +
  "Write naturally and conversationally—choose the structure that best answers the user (short paragraphs or compact lists when they help). " +
  "Avoid generic filler. Prioritize specifics useful to cruisers: terminal shuttles, taxi/metro choices and typical costs, walking time from the port, mobility and family tips, and a realistic back-to-ship buffer. " +
  "Prefer grounded facts from the provided CONTEXT; use WEB facts only when local context is missing or clearly out of date. Cite sources by name (no raw URLs). " +
  "Ask one brief clarifying question only if essential.\n" +
  "\n" +
  "Formatting guidance:\n" +
  "- Use single line breaks (no double-blank-line spacing). \n" +
  "- When you include a numbered list, it must count 1, 2, 3… correctly. \n" +
  "- Keep bullets compact; switch back to prose when a list would feel stiff. \n" +
  "- If information is uncertain or varies (hours, strikes, shuttles), say so briefly and suggest how to verify at the port.\n";

function contextBlock(local, web) {
  const L = local
    .slice(0, MAX_LOCAL_PASSAGES)
    .map(function (x, i) {
      var port = (x.port || "").toString();
      var cat = (x.category || "").toString();
      var snip = (x.snippet || "").toString();
      return "• [LOCAL " + (i + 1) + " | " + port + " | " + cat + "] " + snip;
    })
    .join("\n");

  const W = web
    .slice(0, MAX_WEB_SNIPPETS)
    .map(function (x, i) {
      var title = (x.title || "").toString();
      var snip = (x.snippet || "").toString();
      var url = (x.url || "").toString();
      return "• [WEB " + (i + 1) + "] " + title + " — " + snip + " (" + url + ")";
    })
    .join("\n");

  var out = "CONTEXT:\n" + (L || "(no local)");
  if (W) out += "\n\nWEB:\n" + W;
  return out;
}

// ---------- route (JS, Edge, streaming) ----------
export async function POST(req) {
  try {
    const body = await req.json();
    const history = body && (body.messages || body.history) ? (body.messages || body.history) : [];

    const userLast = [...history].reverse().find((m) => m.role === "user");
    const userQuery = (userLast && userLast.content) ? String(userLast.content) : "";

    const localPool = Array.isArray(portData) ? portData : [];
    const annotated = localPool.map((row, i) => ({
      ...row,
      _id: i,
      _text: (row.port || "") + " " + (row.category || "") + " " + (row.snippet || "")
    }));

    const byKeyword = annotated
      .map((r) => ({ r, score: keywordScore(userQuery, r._text) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 32)
      .map((x) => x.r);

    let localSelected = byKeyword;
    try {
      const embInputs = [userQuery].concat(byKeyword.map((r) => r._text));
      const embeddings = await embed(embInputs);
      const qEmb = embeddings[0];
      const cand = embeddings.slice(1);
      const scored = byKeyword.map((r, idx) => ({ r, s: dot(qEmb, cand[idx]) }));
      localSelected = scored.sort((a, b) => b.s - a.s).slice(0, MAX_LOCAL_PASSAGES).map((x) => x.r);
    } catch {
      localSelected = byKeyword.slice(0, MAX_LOCAL_PASSAGES);
    }

  
    const needWeb = /\b(today|latest|now|open|closed|hours?|opening|closing|price|prices|tickets?|fare|schedule|timetable|shuttle|bus|tram|metro|train|ferry|strike|closure|construction|works?|delay|delays?|weather|holiday|event|festival)\b/i.test( userQuery
    );
    const forceWeb = /\b(web:|check online|verify online|use web|search web)\b/i.test(userQuery);
    const blockWeb = /\b(no web|offline only|local only)\b/i.test(userQuery);
    const web = (!blockWeb && (needWeb || forceWeb)) ? await webSearch(userQuery) : [];

    const messages = [
      { role: "system", content: SYSTEM },
      {
        role: "system",
        content:
          "You will receive a CONTEXT block with local database excerpts and possibly web snippets. " +
          "Prefer local facts; use web facts sparingly and cite briefly (name the place/source, no raw URLs)."
      },
      { role: "system", content: contextBlock(localSelected, web) }
    ].concat(history);

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
          // OpenAI SDK returns an async iterable for streamed parts
          // eslint-disable-next-line no-restricted-syntax
          for await (const part of stream) {
            const delta =
              (part && part.choices && part.choices[0] && part.choices[0].delta && part.choices[0].delta.content) ||
              "";
            if (delta) controller.enqueue(encoder.encode(delta));
          }
        } catch (e) {
          controller.enqueue(encoder.encode("\n\n(Streaming interrupted.)"));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(readable, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}


