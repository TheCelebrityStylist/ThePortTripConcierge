// app/api/chat/route.js
export const runtime = "edge";
import ports from "../../data/ports.json" assert { type: "json" };

import OpenAI from "openai";
// JSON import at build time; Next bundler handles this in JS with "assert"
import portData from "../../../porttrip.json" assert { type: "json" };

function sanitizeAnswer(txt) {
  if (!txt) return "";

  // 1) Collapse excessive spacing and stray bullets
  txt = txt
    .replace(/\n{3,}/g, "\n\n")        // 3+ blank lines → single blank line
    .replace(/^\s*[-•]\s*$/gm, "");    // remove blank bullet lines

  // 2) Demote numbered headings like "1. Transportation Options" → "**Transportation Options:**"
  txt = txt.replace(
    /^\s*\d+\.\s*([A-Z][^\n]{0,60}?):?\s*$(?=\n(?:\s*[-•]|\s*$|\s*#{1,6}\s))/gmi,
    (_, h) => `**${h.trim()}:**`
  );

  // 3) Renumber contiguous ordered lists so they count 1,2,3… within each block
  const lines = txt.split("\n");
  let count = 0;
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const m = line.match(/^(\s*)(\d+)[\.\)]\s+(.*)$/); // ordered item
    const isBullet = /^\s*[-•]\s+/.test(line);
    const isBlank = line.trim() === "";

    if (m) {
      if (!inList) { inList = true; count = 1; }
      else { count += 1; }
      const indent = m[1] || "";
      const content = m[3] || "";
      lines[i] = `${indent}${count}. ${content}`;
    } else {
      // leaving an ordered list?
      if (inList && (isBlank || isBullet || /^#{1,6}\s/.test(line) || /^\*\*.*\*\*:?$/.test(line))) {
        inList = false;
        count = 0;
      }
    }
  }

  return lines.join("\n");
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

function detectPortProfile(q) {
  const text = (q || "").toLowerCase();
  for (const key of Object.keys(PORT_PROFILES)) {
    const p = PORT_PROFILES[key];
    if (p.aliases.some(a => text.includes(a))) return { key, data: p };
  }
  return null;
}
const portProfile = detectPortProfile(userQuery);

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

  // High-signal port facts used to deepen answers. Expand anytime.
const PORT_PROFILES = {
  "barcelona": {
    aliases: ["barcelona", "bcn"],
    terminal: "Shuttles usually drop at Columbus Monument (Portal de la Pau).",
    taxis: "Taxi to Sagrada Família ~€12–15 (~15 min). To Plaça Catalunya ~€10–14.",
    metro: "Drassanes (L3) for La Rambla; L2 for Sagrada Família; L4 for Barceloneta.",
    walking: "Ramblas is flat and stroller-friendly; Park Güell has grades; Gothic quarter = cobbles but short distances.",
    tickets: "Sagrada Família basic ~€26; Park Güell monumental zone ~€10; Casa Batlló ~€29–35.",
    tips: "Time Acropolis-style queues? Not needed here, but prebook Sagrada. Watch for pickpockets on La Rambla.",
    buffer: "Aim to be back at the shuttle by 90 min before all-aboard."
  },
  "athens (piraeus)": {
    aliases: ["piraeus", "athens", "athina"],
    terminal: "From LP10/Lion Gate, port bus to Gate E6, then city bus/metro.",
    taxis: "Taxi to Acropolis south entrance ~€20–25 (25–35 min, traffic sensitive).",
    metro: "Piraeus (M1 green) → Monastiraki (change for M3 blue to Acropolis/Fix) ~25–35 min.",
    walking: "Acropolis slopes; elevator at the north side by appointment; Plaka mostly flat.",
    tickets: "Acropolis hill ~€20; combo ticket (Acropolis + sites) ~€30; prebook morning to dodge heat/queues.",
    tips: "Watch for transport strikes; check OASA/Google on the day. South entrance queues are shorter.",
    buffer: "Target back at Piraeus metro by 2 hours before all-aboard."
  },
  "civitavecchia (rome)": {
    aliases: ["civitavecchia", "rome", "roma"],
    terminal: "Free port shuttle to Largo della Pace; local bus to Civitavecchia station.",
    trains: "Regionale to Roma Termini ~70–80 min; to San Pietro ~55–65 min; return earlier than you think.",
    taxis: "Taxi to Rome is expensive (>€150); consider ship tours if timing is tight.",
    walking: "Rome center is flat but distances are large; cluster neighborhoods.",
    tickets: "Colosseum (timed) ~€18–22; Vatican Museums ~€25–30; St Peter’s Basilica free, dome extra.",
    tips: "Book timed entries; pad 30–45 min for station/platform transitions.",
    buffer: "Be on the train back by 3–3.5 h before all-aboard."
  },
  "naples": {
    aliases: ["naples", "napoli"],
    terminal: "Stazione Marittima is walkable to center; ferries to Capri nearby.",
    transport: "Circumvesuviana for Pompeii/Ercolano; hydrofoils to Capri ~45–55 min.",
    tickets: "Pompeii ~€16–19; Capri funicular ~€2 each way; Blue Grotto weather dependent.",
    tips: "Pompeii is hot: bring water; for minimal walking choose Herculaneum (smaller, better preserved).",
    buffer: "Return to the port 90 min before all-aboard; hydrofoils can sell out late."
  },
  "santorini (thira)": {
    aliases: ["santorini", "thira", "fira"],
    terminal: "Tender to old port (Skala); cable car up to Fira (~€6), or donkey path (not recommended).",
    transport: "Buses from Fira to Oia ~25–35 min; taxis limited—pairs with queue spikes.",
    tips: "Queue build around ship waves; go early to Oia, return before peak; sunsets create crush.",
    buffer: "Start cable car down 90–120 min before last tender."
  }
};

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
    

