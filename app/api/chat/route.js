// app/api/chat/route.js
export const runtime = "edge";

import OpenAI from "openai";

// ---------- Local knowledge ----------
import ports from "../../data/ports.json" assert { type: "json" };
import portData from "../../../porttrip.json" assert { type: "json" };

/* =======================================
   CONFIG
   ======================================= */
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || "text-embedding-3-large";
const MAX_LOCAL_PASSAGES = 14;
const MAX_WEB_SNIPPETS = 6;
const ALLOW_WEB = (process.env.ALLOW_WEB || "true").toLowerCase() !== "false";
const USE_EMBEDDINGS = (process.env.USE_EMBEDDINGS || "true").toLowerCase() !== "false";

// Stripe price plan semantics (Pro=25/month, Unlimited=∞)
const PRO_LIMIT = 25;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* =======================================
   SMALL UTILS
   ======================================= */
function monthKey(d = new Date()) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getCookie(req, name) {
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : "";
}

function setCookie(headers, name, value, opts = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  if (opts.path) parts.push(`Path=${opts.path}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure) parts.push(`Secure`);
  if (opts.httpOnly) parts.push(`HttpOnly`);
  headers.append("Set-Cookie", parts.join("; "));
}

function tokenizeLower(s) {
  return (s || "").toLowerCase().split(/\W+/).filter(Boolean);
}
function keywordScore(q, text) {
  const words = tokenizeLower(q);
  if (!words.length) return 0;
  const hay = (text || "").toLowerCase();
  let s = 0;
  for (let i = 0; i < words.length; i++) if (hay.indexOf(words[i]) !== -1) s += 1;
  return s;
}
async function embed(inputs) {
  const res = await client.embeddings.create({ model: EMBED_MODEL, input: inputs });
  return res.data.map(d => d.embedding);
}
function dot(a, b) {
  let s = 0;
  const L = Math.min(a.length, b.length);
  for (let i = 0; i < L; i++) s += a[i] * b[i];
  return s;
}

/* =======================================
   STRIPE HELPERS (Edge-safe via REST)
   ======================================= */
const STRIPE_BASE = "https://api.stripe.com/v1";

async function stripeGET(path) {
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }
  });
  if (!res.ok) throw new Error(`Stripe GET ${path} failed: ${res.status}`);
  return res.json();
}
async function stripePOST(path, form) {
  const body = new URLSearchParams(form);
  const res = await fetch(`${STRIPE_BASE}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    body
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Stripe POST ${path} failed: ${res.status} :: ${t}`);
  }
  return res.json();
}

async function readStripeUsage(customerId) {
  // returns { plan, used, month, limit }
  const c = await stripeGET(`/customers/${customerId}`);
  const md = c.metadata || {};
  const cur = monthKey();
  let used = parseInt(md.used || "0", 10) || 0;
  const month = md.month || cur;
  const plan = (md.plan || "pro").toLowerCase(); // "pro" | "unlimited"
  const limit = plan === "unlimited" ? Infinity : PRO_LIMIT;

  // auto-reset if month changed
  if (month !== cur) {
    used = 0;
    await stripePOST(`/customers/${customerId}`, {
      "metadata[month]": cur,
      "metadata[used]": "0",
      "metadata[plan]": plan
    });
  }
  return { plan, used, month: cur, limit };
}

async function bumpStripeUsage(customerId, prevUsed) {
  await stripePOST(`/customers/${customerId}`, {
    "metadata[used]": String(prevUsed + 1)
  });
}

/* =======================================
   Formatting / Sanitizing
   ======================================= */
function sanitizeAnswer(txt) {
  if (!txt) return "";
  txt = txt.replace(/\n{3,}/g, "\n\n").replace(/^\s*[-•]\s*$/gm, "");
  txt = txt.replace(
    /^\s*\d+\.\s*([A-Z][^\n]{0,60}?):?\s*$(?=\n(?:\s*[-•]|\s*$|\s*#{1,6}\s))/gmi,
    (_m, h) => `**${String(h).trim()}:**`
  );
  txt = txt.replace(/^#{2,6}\s+/gm, "");

  const lines = txt.split("\n");
  let inList = false, n = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\s*)(\d+)[\.)]\s+(.*)$/);
    const isBreak =
      !line.trim() ||
      /^\s*[-•]\s+/.test(line) ||
      /^#{1,6}\s/.test(line) ||
      /^\*\*.*\*\*:?$/.test(line);

    if (m) {
      if (!inList) { inList = true; n = 1; } else { n++; }
      const indent = m[1] || "";
      const content = m[3] || "";
      lines[i] = `${indent}${n}. ${content}`;
    } else if (inList && isBreak) {
      inList = false; n = 0;
    }
  }
  return lines.join("\n");
}

/* =======================================
   Web Search (Tavily)
   ======================================= */
async function webSearch(query) {
  if (!ALLOW_WEB || !process.env.TAVILY_API_KEY) return [];
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

/* =======================================
   Merge / Prepare Local Corpus
   ======================================= */
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

/* =======================================
   Cruise-specialized system prompt
   ======================================= */
const SYSTEM =
  "You are PortTrip Concierge, the go-to AI for cruise travelers. " +
  "Write naturally and conversationally—short, dense paragraphs; compact lists only when they help. Avoid filler. " +
  "Never assume the port; if unclear, ask one brief clarifying question first. " +
  "Be specific for cruisers: where shuttles drop, taxi vs metro with typical fares and minutes, walking time from the terminal, ticket costs and whether to prebook, queue hot spots and how to avoid them, mobility/family alternatives, and a realistic back-to-ship buffer. " +
  "Prefer grounded facts from CONTEXT; use WEB only if local info is missing or likely outdated. Cite sources by name (no raw URLs). " +
  "Formatting: single line breaks only; numbered lists must count 1,2,3 without resets; headings should not be numbered. " +
  "If information varies (hours, strikes, shuttles), say so briefly and state how to verify at the port.";

/* =======================================
   Context builder
   ======================================= */
function contextBlock(local, web) {
  const L = local.slice(0, MAX_LOCAL_PASSAGES).map((x, i) =>
    `• [LOCAL ${i + 1} | ${x.port || ""} | ${x.category || ""}] ${x.snippet || ""}`
  ).join("\n");

  const W = web.slice(0, MAX_WEB_SNIPPETS).map((x, i) =>
    `• [WEB ${i + 1}] ${x.title || ""} — ${x.snippet || ""} (${x.url || ""})`
  ).join("\n");

  return "CONTEXT:\n" + (L || "(no local)") + (W ? "\n\nWEB:\n" + W : "");
}

/* =======================================
   Port hint / rank local
   ======================================= */
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

async function rankLocal(userQuery) {
  const prelim = localCorpus
    .map(r => ({ r, s: keywordScore(userQuery, r._text) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 40)
    .map(x => x.r);

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

/* =======================================
   Body parsing
   ======================================= */
async function parseBody(req) {
  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body?.messages) ? body.messages : [];
  const lastUser = [...history].reverse().find(m => m && m.role === "user");
  const userQuery =
    (typeof body?.query === "string" && body.query.trim()) ||
    (lastUser?.content || "").trim();
  return { body, history, userQuery };
}

/* =======================================
   USAGE GATING (free cookie OR Stripe customer)
   - Anonymous: cookie pt_free_used="<monthKey>:<count>"
   - Authenticated: cookies pt_customer="<stripe_customer_id>", pt_plan optional
   ======================================= */
function readFreeCookie(req) {
  const v = getCookie(req, "pt_free_used"); // e.g. "2025-08:2"
  if (!v) return { month: monthKey(), used: 0 };
  const [m, cnt] = v.split(":");
  const cur = monthKey();
  if (m !== cur) return { month: cur, used: 0 };
  return { month: cur, used: parseInt(cnt || "0", 10) || 0 };
}

function readStripeCustomer(req) {
  const cid = getCookie(req, "pt_customer"); // set by your checkout success
  const planCookie = (getCookie(req, "pt_plan") || "").toLowerCase(); // optional
  return cid ? { customerId: cid, planCookie } : null;
}

/* =======================================
   ROUTE
   ======================================= */
export async function POST(req) {
  // Prepare response headers (for setting cookies if needed)
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Server is missing OPENAI_API_KEY.", { status: 500, headers });
    }

    // Parse request
    const { history, userQuery } = await parseBody(req);
    if (!userQuery) {
      return new Response("Please ask a question (no text received).", { status: 400, headers });
    }

    // Determine user type
    const stripeAuth = readStripeCustomer(req);
    let limit = 3; // default for anonymous
    let used = 0;
    let isUnlimited = false;
    let isStripe = false;

    if (stripeAuth && process.env.STRIPE_SECRET_KEY) {
      isStripe = true;
      const usage = await readStripeUsage(stripeAuth.customerId);
      used = usage.used;
      limit = usage.limit === Infinity ? Number.POSITIVE_INFINITY : usage.limit;
      isUnlimited = usage.limit === Infinity;
      // If over limit → block
      if (!isUnlimited && used >= limit) {
        const payload = JSON.stringify({
          error: "You’ve reached your monthly Pro limit. Upgrade to Unlimited to keep planning.",
          code: "LIMIT_REACHED"
        });
        return new Response(payload, { status: 402, headers: new Headers({ "Content-Type": "application/json" }) });
      }
    } else {
      // Anonymous cookie gating
      const f = readFreeCookie(req);
      used = f.used;
      limit = 3;
      if (used >= limit) {
        const payload = JSON.stringify({
          error: "Free plan includes 3 chats/month. Upgrade to Pro for 25 or Unlimited for infinite.",
          code: "FREE_LIMIT_REACHED"
        });
        return new Response(payload, { status: 402, headers: new Headers({ "Content-Type": "application/json" }) });
      }
    }

    // RAG selection
    const portHint = inferPortHint(userQuery);
    const localSelected = await rankLocal(userQuery);
    const needWeb = looksLikeWebNeed(userQuery);
    const web = needWeb ? await webSearch(userQuery) : [];

    // Messages to model
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

    // Model call (non-stream to sanitize)
    const completion = await client.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.6,
      stream: false
    });

    let text = completion?.choices?.[0]?.message?.content || "";
    text = sanitizeAnswer(text);

    // Increment usage AFTER success
    if (isStripe) {
      if (!isUnlimited) {
        await bumpStripeUsage(stripeAuth.customerId, used);
      }
    } else {
      const mk = monthKey();
      const next = `${mk}:${used + 1}`;
      setCookie(headers, "pt_free_used", next, {
        path: "/",
        // month-long (roughly); cookie is just a soft gate on anonymous use
        maxAge: 60 * 60 * 24 * 31,
        sameSite: "Lax",
        secure: true
      });
    }

    return new Response(text, { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: new Headers({ "Content-Type": "application/json" })
    });
  }
}


    

