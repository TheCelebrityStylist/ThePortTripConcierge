// app/api/chat/route.js
export const runtime = "nodejs";

import OpenAI from "openai";
import ports from "../../data/ports.json" assert { type: "json" };
import portData from "../../../porttrip.json" assert { type: "json" };
import cruiseDb from "../../data/cruise-db.json" assert { type: "json" };
import { runTavilyCruiseResearch } from "./tavily";

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const PRO_LIMIT = 25;
function getOpenAIClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey: key });
}
const STRIPE_BASE = "https://api.stripe.com/v1";

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
  if (opts.secure) parts.push("Secure");
  headers.append("Set-Cookie", parts.join("; "));
}
async function stripeGET(path) {
  const res = await fetch(`${STRIPE_BASE}${path}`, { headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` } });
  if (!res.ok) throw new Error(`Stripe GET ${path} failed: ${res.status}`);
  return res.json();
}
async function stripePOST(path, form) {
  const body = new URLSearchParams(form);
  const res = await fetch(`${STRIPE_BASE}${path}`, { method: "POST", headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` }, body });
  if (!res.ok) throw new Error(`Stripe POST ${path} failed: ${res.status}`);
  return res.json();
}
async function readStripeUsage(customerId) {
  const c = await stripeGET(`/customers/${customerId}`);
  const md = c.metadata || {};
  const cur = monthKey();
  let used = parseInt(md.used || "0", 10) || 0;
  const month = md.month || cur;
  const plan = (md.plan || "pro").toLowerCase();
  const limit = plan === "unlimited" ? Infinity : PRO_LIMIT;
  if (month !== cur) {
    used = 0;
    await stripePOST(`/customers/${customerId}`, { "metadata[month]": cur, "metadata[used]": "0", "metadata[plan]": plan });
  }
  return { used, limit };
}
async function bumpStripeUsage(customerId, prevUsed) {
  await stripePOST(`/customers/${customerId}`, { "metadata[used]": String(prevUsed + 1) });
}

function parseUserInput(userQuery, body) {
  const raw = userQuery || "";
  const cruiseContext = body?.cruiseContext || {};
  const personalization = body?.personalization || {};

  let port = "";
  const candidates = (cruiseDb?.ports || []).map((p) => p.name);
  const lower = raw.toLowerCase();
  for (const c of candidates) {
    if (lower.includes(c.toLowerCase())) {
      port = c;
      break;
    }
  }
  if (!port) {
    const leading = raw.split(/[·|,-]/)[0]?.trim();
    if (leading && leading.length < 40) port = leading;
  }

  const timeRange = raw.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  const arrivalTime = cruiseContext.arrivalTime || (timeRange ? timeRange[1] : "08:00");
  let allAboardTime = cruiseContext.allAboardTime || (timeRange ? addMinutes(timeRange[2], 30) : "16:30");

  const durationMatch = raw.match(/(\d+)\s*hours?/i);
  const requestedHours = durationMatch ? Number(durationMatch[1]) : undefined;

  return {
    port,
    arrivalTime,
    allAboardTime,
    cruiseLine: cruiseContext.cruiseLine || "Unknown line",
    shipName: cruiseContext.shipName || "Unknown ship",
    dockType: cruiseContext.dockType || "dock",
    terminalName: cruiseContext.terminalName || "Unknown terminal",
    requestedHours,
    preferences: personalization,
    raw,
  };
}

function addMinutes(hhmm, mins) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const hh = String(Math.max(0, Math.floor(total / 60))).padStart(2, "0");
  const mm = String(((total % 60) + 60) % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function resolvePortFromDb(portName) {
  const rows = cruiseDb?.ports || [];
  const lower = (portName || "").toLowerCase();
  return rows.find((p) => p.name.toLowerCase() === lower || (p.aliases || []).some((a) => lower.includes(a.toLowerCase()))) || rows[0];
}

function extractLocalContext(portName) {
  const snippets = [];
  const corpusRows = []
    .concat(Array.isArray(ports) ? ports : [])
    .concat(Array.isArray(portData) ? portData : Object.values(portData || {}));
  const match = (portName || "").toLowerCase();

  for (const row of corpusRows) {
    const joined = JSON.stringify(row).toLowerCase();
    if (!match || joined.includes(match)) snippets.push(JSON.stringify(row));
    if (snippets.length >= 8) break;
  }
  return snippets;
}

function computeRiskAndBudget(input, dbPort, liveResearch) {
  const trafficRisk = (dbPort.high_risk_traffic_hours || []).some((w) => {
    const [s, e] = w.split("-");
    const ret = toMinutes(addMinutes(input.allAboardTime, -75));
    return ret >= toMinutes(s) && ret <= toMinutes(e);
  }) ? 20 : 8;

  const tenderRisk = (input.dockType === "tender" || dbPort.tender) ? 22 : 5;
  const liveRisk = liveResearch?.strikeDetected ? 25 : liveResearch?.closureDetected ? 12 : 6;
  const timeWindow = Math.max(0, toMinutes(input.allAboardTime) - toMinutes(input.arrivalTime));
  const timeRisk = timeWindow < 360 ? 22 : timeWindow < 480 ? 14 : 8;

  const score = Math.min(100, trafficRisk + tenderRisk + liveRisk + timeRisk);
  const riskLevel = score >= 65 ? "High" : score >= 40 ? "Medium" : "Low";

  const tenderDelay = input.dockType === "tender" || dbPort.tender ? 20 : 0;
  const safeReturn = addMinutes(input.allAboardTime, -(75 + tenderDelay));

  const ticket = (dbPort.attractions || []).slice(0, 2).reduce((s, a) => s + (a.entrance_fee_eur || 0), 0);
  const transport = dbPort.distance_to_city_center_km > 2 ? 24 : 14;
  const food = input.preferences?.luxuryMode ? 48 : input.preferences?.budgetMode ? 18 : 28;
  const misc = 8;
  const diy = ticket + transport + food + misc;
  const ship = 119;

  return {
    score,
    riskLevel,
    safeReturn,
    buffers: {
      traffic: 30,
      portCongestion: 25,
      tender: tenderDelay,
    },
    budget: { shipExcursion: ship, diy, savings: Math.max(0, ship - diy), transport, food, tickets: ticket, misc },
  };
}

function buildSystemPrompt() {
  return [
    "You are a cruise logistics planner. You optimize for time safety, return risk, and realistic pacing. Never give generic advice.",
    "Priority order: 1) PortTrip Database, 2) Live Tavily research, 3) reasoning for gaps.",
    "Tone: analytical and confident. Do not use filler phrases like 'Enjoy your time'.",
    "MANDATORY OUTPUT FORMAT:",
    "1) Port Summary Snapshot (dock type, distance to city center, typical travel time, risk level today, must return by time)",
    "2) Time-Optimized Itinerary Table with explicit blocks (start-end, transit, transport + cost + minutes, duration, why this order)",
    "3) Budget Comparison (ship excursion, DIY estimate, savings)",
    "4) Return-to-Ship Safety Logic (all-aboard, safe return, detailed buffers, risk explanation)",
    "5) Hidden Local Add-On (20-minute optional stop near terminal)",
    "Always include route order reasoning and realistic transport details.",
  ].join(" ");
}

function buildItinerarySeed(dbPort, input) {
  const attrs = (dbPort.attractions || []).slice(0, 3).sort((a, b) => a.distance_from_terminal_km - b.distance_from_terminal_km);
  const blocks = [];
  let t = input.arrivalTime;
  for (const a of attrs) {
    const transit = dbPort.distance_to_city_center_km > 2 ? { mode: "Taxi", cost: 25, minutes: 20 } : { mode: "Walk/Taxi", cost: 12, minutes: 12 };
    const start = t;
    const end = addMinutes(start, transit.minutes + a.average_visit_time_minutes);
    blocks.push({
      start,
      end,
      stop: a.name,
      duration: a.average_visit_time_minutes,
      travel: transit,
      why: "Clustered by distance and scheduled before peak crowds.",
      walkingDifficulty: a.walking_difficulty || "moderate",
    });
    t = end;
  }
  return blocks;
}

async function parseBody(req) {
  const body = await req.json().catch(() => ({}));
  const history = Array.isArray(body?.messages) ? body.messages : [];
  const lastUser = [...history].reverse().find((m) => m && m.role === "user");
  const userQuery = (typeof body?.query === "string" && body.query.trim()) || (lastUser?.content || "").trim();
  return { body, history, userQuery };
}

function readFreeCookie(req) {
  const v = getCookie(req, "pt_free_used");
  if (!v) return { month: monthKey(), used: 0 };
  const [m, cnt] = v.split(":");
  const cur = monthKey();
  if (m !== cur) return { month: cur, used: 0 };
  return { month: cur, used: parseInt(cnt || "0", 10) || 0 };
}

export async function POST(req) {
  const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8" });
  try {
    if (!process.env.OPENAI_API_KEY) return new Response("Server is missing OPENAI_API_KEY.", { status: 500, headers });

    const { body, history, userQuery } = await parseBody(req);
    if (!userQuery) return new Response("Please ask a question (no text received).", { status: 400, headers });

    // Keep Stripe/payment gating untouched semantically.
    const stripeCustomer = getCookie(req, "pt_customer");
    let used = 0;
    let isStripe = false;
    let isUnlimited = false;

    if (stripeCustomer && process.env.STRIPE_SECRET_KEY) {
      isStripe = true;
      const usage = await readStripeUsage(stripeCustomer);
      used = usage.used;
      isUnlimited = usage.limit === Infinity;
      if (!isUnlimited && used >= usage.limit) {
        return new Response(JSON.stringify({ error: "You’ve reached your monthly Pro limit. Upgrade to Unlimited to keep planning.", code: "LIMIT_REACHED" }), {
          status: 402,
          headers: new Headers({ "Content-Type": "application/json" }),
        });
      }
    } else {
      const free = readFreeCookie(req);
      used = free.used;
      if (used >= 3) {
        return new Response(JSON.stringify({ error: "Free plan includes 3 chats/month. Upgrade to Pro for 25 or Unlimited for infinite.", code: "FREE_LIMIT_REACHED" }), {
          status: 402,
          headers: new Headers({ "Content-Type": "application/json" }),
        });
      }
    }

    const structured = parseUserInput(userQuery, body);
    const dbPort = resolvePortFromDb(structured.port);
    const localContext = extractLocalContext(dbPort.name);
    const liveResearch = await runTavilyCruiseResearch({ port: dbPort.name, dateLabel: "today" });

    const computed = computeRiskAndBudget(structured, dbPort, liveResearch);
    const itinerarySeed = buildItinerarySeed(dbPort, structured);

    const messages = [
      { role: "system", content: buildSystemPrompt() },
      {
        role: "system",
        content: JSON.stringify({
          structuredInput: structured,
          dbPort,
          liveResearchSummary: liveResearch.summary,
          liveResearchItems: liveResearch.items,
          computed,
          itinerarySeed,
          localContext,
        }),
      },
      ...history,
      { role: "user", content: userQuery },
    ];

    const completion = await getOpenAIClient().chat.completions.create({ model: MODEL, messages, temperature: 0.2, stream: false });
    let text = completion?.choices?.[0]?.message?.content || "";

    if (!/Port Summary Snapshot/i.test(text)) {
      text = [
        "Port Summary Snapshot",
        `- Dock type: ${structured.dockType}`,
        `- Distance to city center: ${dbPort.distance_to_city_center_km} km`,
        `- Typical transfer time: ${dbPort.average_transfer_time_minutes} min`,
        `- Risk level today: ${computed.riskLevel}`,
        `- Must return by: ${computed.safeReturn}`,
        "",
        text,
      ].join("\n");
    }

    if (isStripe) {
      if (!isUnlimited) await bumpStripeUsage(stripeCustomer, used);
    } else {
      setCookie(headers, "pt_free_used", `${monthKey()}:${used + 1}`, { path: "/", maxAge: 60 * 60 * 24 * 31, sameSite: "Lax", secure: true });
    }

    return new Response(text, { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: new Headers({ "Content-Type": "application/json" }) });
  }
}
