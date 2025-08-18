// app/api/chat/route.js
export const runtime = "edge";
import ports from "../../data/ports.json" assert { type: "json" };

import OpenAI from "openai";
// JSON import at build time; Next bundler handles this in JS with "assert"
import portData from "../../../porttrip.json" assert { type: "json" };

function collapseSpacing(txt) {
  if (!txt) return "";
  // Replace 3+ blank lines with a single blank line
  txt = txt.replace(/\n{3,}/g, "\n\n");
  // Remove stray bullet-only lines
  txt = txt.replace(/^\s*[-•]\s*$/gm, "");
  return txt;
}

function collapseSpacing(txt) {
  if (!txt) return "";
  // Replace 3+ blank lines with a single blank line
  txt = txt.replace(/\n{3,}/g, "\n\n");
  // Remove stray bullet-only lines
  txt = txt.replace(/^\s*[-•]\s*$/gm, "");
  return txt;
}

// Turn numbered headings like "1. Transportation Options" into bold headings (not numbered)
function demoteNumberedHeadings(txt) {
  if (!txt) return "";
  return txt.replace(
    /^\s*\d+\.\s*([A-Z][^\n]{0,60}?):?\s*$(?=\n(?:\s*[-•]|\s*$|\s*#{1,6}\s))/gmi,
    (_, h) => `**${h.trim()}:**`
  );
}

// Renumber contiguous ordered lists so they count 1,2,3… within each block
function renumberOrderedLists(txt) {
  if (!txt) return "";
  const lines = txt.split("\n");
  let count = 0;
  let inList = false;

  const out = lines.map(line => {
    const m = line.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);
    const isBullet = line.match(/^\s*[-•]\s+/);
    const isBlank = line.trim() === "";

    if (m) { // ordered item
      if (!inList) { inList = true; count = 1; }
      else { count += 1; }
      const indent = m[1] || "";
      const content = m[3] || "";
      return `${indent}${count}. ${content}`;
    } else {
      // leaving list?
      if (inList && (isBlank || isBullet || /^#{1,6}\s/.test(line) || /^\*\*.*\*\*$/.test(line))) {
        inList = false; count = 0;
      }
      return line;
    }
  });

  return out.join("\n");
}

function sanitizeAnswer(txt) {
  return renumberOrderedLists(demoteNumberedHeadings(collapseSpacing(txt)));
}

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
  "You are PortTrip Concierge, the go-to AI for cruise travelers. " +
  "Your role: feel like a knowledgeable local guide who deeply understands cruise logistics. " +
  "Be conversational, detailed, and human-like—like a seasoned traveler sharing insider advice. " +
  "Write naturally and conversationally (short paragraphs, compact lists only when they help). Avoid generic filler. " +
  "IMPORTANT: Never assume a city/port. If the port cannot be inferred with high confidence, ask one short clarifying question first. " +
  "Adapt your structure naturally: use short paragraphs, or compact lists only when they make sense. " +
  "Avoid generic filler. Always provide details specific to cruisers: terminal layout, shuttle habits, taxi vs metro options with typical fares, walking times to town, safety tips, and family/mobility considerations. " +
  "Add cultural and practical context when relevant (local food, customs, how locals move around). " +
  "Keep answers tight but specific: if a shuttle runs 'sometimes', say when and how to confirm; if a taxi costs 'about €10–15', state the range. " +
  "Always recommend a realistic back-to-ship buffer, even if not asked. " +
  "Prefer grounded facts from CONTEXT; use WEB data only if info is missing or could be outdated. Cite sources by name, never by raw URL. " +
  "Formatting rules: no double blank lines, single line breaks only. If you use numbered or bullet lists, make sure numbering is correct and bullets stay compact. " +
  "If uncertain, say so briefly and suggest how to check at the port. " +
  "Prioritize specifics for cruisers: terminal shuttles, taxi/metro choices with typical fares, walking time from the terminal, mobility/family tips, and a realistic back-to-ship buffer. " +
  "Prefer grounded facts from CONTEXT; use WEB data only if local context is missing/outdated. Cite sources by name, never as raw URLs. " +
  "Formatting rules: single line breaks only (no double blank lines). If you produce a numbered list, numbering must be 1, 2, 3… with no resets. " +
  "If info is uncertain or varies (hours, strikes, shuttles), say so briefly and suggest how to verify at the port.\n";
  

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

    const localPool = Array.isArray(ports) ? ports : [];
    // ---- Port hint from the user's text (never assume if not clear)
    const knownPorts = [...new Set(localPool.map(x => (x.port || "").toLowerCase()))];
    function inferPortHint(q) {
    const ql = (q || "").toLowerCase();
    for (const p of knownPorts) {
    if (p && ql.includes(p)) return p;
    }
    return "";
    }
    const portHint = inferPortHint(userQuery);

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
      // Encourage local grounding first (your ports.json + any DB later)
      { role: "system", content: "You will receive CONTEXT with local port snippets and sometimes WEB snippets. Prefer local facts first." },
      // Provide port hint or force a clarification if none
      ...(portHint
        ? [{ role: "system", content: "Port hint from user text: " + portHint }]
        : [{ role: "system", content: "No clear port found in the user text. Ask one short question to confirm the port before recommending plans." }]),
      // Your existing context builder stays the same — add it here
      { role: "system", content: contextBlock(localSelected, web) },
      // Finally the user's message/history
      ...history
    ];

    // Get a single completion (non-stream) so we can sanitize the final text
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      stream: false
    });
    
    let text = completion.choices?.[0]?.message?.content || "";
    text = sanitizeAnswer(text);
    
    return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err) }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    

