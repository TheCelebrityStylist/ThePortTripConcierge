// app/api/chat/route.js
export const runtime = "edge";

import OpenAI from "openai";

// Local knowledge: your structured port snippets
// Keep both imports if you use both files; remove one if not needed.
import ports from "../../data/ports.json" assert { type: "json" };
import portData from "../../../porttrip.json" assert { type: "json" };

/* =========================
   CONFIG
   ========================= */
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-large";
const MAX_LOCAL_PASSAGES = 14;  // slightly higher for richer grounding
const MAX_WEB_SNIPPETS = 6;
const ALLOW_WEB = (process.env.ALLOW_WEB || "true").toLowerCase() !== "false"; // toggle via env
const USE_EMBEDDINGS = (process.env.USE_EMBEDDINGS || "true").toLowerCase() !== "false";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* =========================
   UTIL: Formatting / Sanitizing
   ========================= */
function sanitizeAnswer(txt) {
  if (!txt) return "";

  // Collapse 3+ blanks -> one blank; remove stray empty bullets.
  txt = txt
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s*[-•]\s*$/gm, "");

  // Demote "1. Transportation Options" style headings into bold labels.
  txt = txt.replace(
    /^\s*\d+\.\s*([A-Z][^\n]{0,60}?):?\s*$(?=\n(?:\s*[-•]|\s*$|\s*#{1,6}\s))/gmi,
    function (_m, h) { return "**" + String(h).trim() + ":**"; }
  );

  // Normalize any accidental H3 hashes followed by blank
  txt = txt.replace(/^#{2,6}\s+/gm, ""); // keep content, drop hashes

  // Renumber each contiguous ordered list 1..N, break on blank/heading/bullet/bold-line.
  const lines = txt.split("\n");
  let inList = false, n = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const m = line.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/);
    const isBreak =
      !line.trim() ||
      /^\s*[-•]\s+/.test(line) ||
      /^#{1,6}\s/.test(line) ||
      /^\*\*.*\*\*:?$/.test(line);

    if (m) {
      if (!inList) { inList = true; n = 1; } else { n++; }
      const indent = m[1] || "";
      const content = m[3] || "";
      lines[i] = indent + n + ". " + content;
    } else if (inList && isBreak) {
      inList = false; n = 0;
    }
  }
  return lines.join("\n");
}

/* =========================
   UTIL: Scoring / Embeddings
   ========================= */
function tokenizeLower(s) {
  return (s || "").toLowerCase().split(/\W+/).filter(Boolean);
}

function keywordScore(q, text) {
  const words = tokenizeLower(q);
  if (!words.length) return 0;
  const hay = (text || "").toLowerCase();
  let s = 0;
  for (let i = 0; i < words.length; i++) {
    if (hay.indexOf(words[i]) !== -1) s += 1;
  }
  return s;
}

async function embed(inputs) {
  const res = await client.embeddings.create({
    model: EMBED_MODEL,
    input: inputs
  });
  return res.data.map(d => d.embedding);
}

function dot(a, b) {
  let s = 0;
  const L = Math.min(a.length, b.length);
  for (let i = 0; i < L; i++) s += a[i] * b[i];
  return s;
}

/* =========================
   UTIL: Web Search (Tavily)
   ========================= */
async function webSearch(query) {
  if (!ALLOW_WEB) return [];
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
  }).catch(() => null);
  if (!resp || !resp.ok) return [];
  const data = await resp.json().catch(() => ({}));
  const items = Array.isArray(data?.results) ? data.results : [];
  return items.slice(0, MAX_WEB_SNIPPETS).map(r => ({
    title: r.title || "",
    url: r.url || "",
    snippet: r.content || r.snippet || ""
  }));
}

/* =========================
   DATA: Merge / Prepare Local Corpus
   ========================= */
const localCorpusRaw = []
  .concat(Array.isArray(ports) ? ports : [])
  .concat(Array.isArray(portData) ? portData : [])
  .filter(Boolean);

const localCorpus = localCorpusRaw.map((row, i) => {
  const port = String(row.port || "").trim();
  const category = String(row.category || row.type || "").trim();
  const snippet = String(row.snippet || row.text || row.note || "").trim();
  const aliases = Array.isArray(row.aliases) ? row.aliases : [];
  const _text = [port, category, snippet].join(" ");
  return { _id: i, port, category, snippet, aliases, _text };
});

const aliasMap = (() => {
  const map = Object.create(null);
  for (let i = 0; i < localCorpus.length; i++) {
    const p = localCorpus[i].port.toLowerCase();
    if (p) map[p] = true;
  }
  return map;
})();

/* =========================
   PROMPT: Cruise-specialized voice
   ========================= */
const SYSTEM =
  "You are PortTrip Concierge, the go-to AI for cruise travelers. " +
  "Write naturally and conversationally—short, dense paragraphs; compact lists only when they help. Avoid filler. " +
  "Never assume the port; if unclear, ask one brief clarifying question first. " +
  "Be specific for cruisers: where shuttles drop, taxi vs metro with typical fares and minutes, walking time from the terminal, ticket costs and whether to prebook, queue hot spots and how to avoid them, mobility/family alternatives, and a realistic back-to-ship buffer. " +
  "Prefer grounded facts from CONTEXT; use WEB only if local info is missing or likely outdated. Cite sources by name (no raw URLs). " +
  "Formatting: single line breaks only; numbered lists must count 1,2,3 without resets; headings should not be numbered. " +
  "If information varies (hours, strikes, shuttles), say so briefly and state how to verify at the port.";

/* =========================
   UTIL: Build context block
   ========================= */
function contextBlock(local, web) {
  const L = local.slice(0, MAX_LOCAL_PASSAGES).map((x, i) => {
    return "• [LOCAL " + (i + 1) + " | " + (x.port || "") + " | " + (x.category || "") + "] " + (x.snippet || "");
  }).join("\n");

  const W = web.slice(0, MAX_WEB_SNIPPETS).map((x, i) => {
    return "• [WEB " + (i + 1) + "] " + (x.title || "") + " — " + (x.snippet || "") + " (" + (x.url || "") + ")";
  }).join("\n");

  return "CONTEXT:\n" + (L || "(no local)") + (W ? "\n\nWEB:\n" + W : "");
}

/* =========================
   PORT DETECTION (lightweight)
   ========================= */
function inferPortHint(q) {
  const t = (q || "").toLowerCase();
  if (!t) return "";
  for (const key in aliasMap) {
    if (t.indexOf(key) !== -1) return key;
  }
  return "";
}

function looksLikeWebNeed(q) {
  const re = /\b(today|latest|now|open|closed|hours?|opening|closing|price|prices|tickets?|fare|schedule|timetable|shuttle|bus|tram|metro|train|ferry|strike|closure|construction|works?|delay|delays?|weather|holiday|event|festival)\b/i;
  return re.test(q || "");
}

/* =========================
   RANK LOCAL PASSAGES
   ========================= */
async function rankLocal(userQuery) {
  // 1) Coarse keyword pull
  const prelim = localCorpus
    .map(r => ({ r, s: keywordScore(userQuery, r._text) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 40)
    .map(x => x.r);

  // 2) Tighten with embeddings if enabled + key present
  if (!USE_EMBEDDINGS || !process.env.OPENAI_API_KEY) {
    return prelim.slice(0, MAX_LOCAL_PASSAGES);
  }
  try {
    const inputs = [userQuery].concat(prelim.map(r => r._text));
    const vecs = await embed(inputs);
    const q = vecs[0];
    const scored = prelim.map((r, i) => ({ r, s: dot(q, vecs[i + 1]) }));
    return scored.sort((a, b) => b.s - a.s).slice(0, MAX_LOCAL_PASSAGES).map(x => x.r);
  } catch {
    return prelim.slice(0, MAX_LOCAL_PASSAGES);
  }
}

/* =========================
   BODY PARSING
   ========================= */
async function parseBody(req) {
  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body?.messages) ? body.messages : [];
  const lastUser = [...history].reverse().find(m => m && m.role === "user");
  const userQuery =
    (typeof body?.query === "string" && body.query.trim()) ||
    (lastUser?.content || "").trim();
  return { body, history, userQuery };
}

/* =========================
   ROUTE
   ========================= */
export async function POST(req) {
  try {
    // Parse request
    const { history, userQuery } = await parseBody(req);
    if (!userQuery) {
      return new Response("Please ask a question (no text received).", { status: 400 });
    }

    // Detect port hint quickly
    const portHint = inferPortHint(userQuery);

    // Select local passages
    const localSelected = await rankLocal(userQuery);

    // Decide on web augmentation
    const needWeb = looksLikeWebNeed(userQuery);
    const web = needWeb ? await webSearch(userQuery) : [];

    // Build messages
    const messages = [
      { role: "system", content: SYSTEM },
      portHint
        ? { role: "system", content: "Port hint from user text: " + portHint }
        : { role: "system", content: "No clear port detected. Ask one brief question to confirm the port before recommending plans." },
      { role: "system", content: "Provide dense, helpful answers. Resist generic filler. Keep paragraphs short. Always include a realistic back-to-ship buffer." },
      { role: "system", content: contextBlock(localSelected, web) },
      ...history,
      { role: "user", content: userQuery }
    ];

    // Ensure API key is present
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Server is missing OPENAI_API_KEY.", { status: 500 });
    }

    // Call model (non-streaming so we can sanitize)
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      stream: false
    });

    let text = completion?.choices?.[0]?.message?.content || "";
    text = sanitizeAnswer(text);

    return new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

    

