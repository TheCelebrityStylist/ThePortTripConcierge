// app/api/chat/route.js
export const runtime = "nodejs";

import OpenAI from "openai";
import { promises as fs } from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- helpers (RAG from data/porttrip.json) ----
function slugify(s = "") {
  return s.toLowerCase().normalize("NFKD").replace(/[^\w]+/g, "-").replace(/^-+|-+$/g, "");
}

async function loadDB() {
  const file = path.join(process.cwd(), "data", "porttrip.json");
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw);
}

function findPortId(db, query = "") {
  const q = slugify(query);
  if (db[q]) return q;
  for (const [id, obj] of Object.entries(db)) {
    const name = obj?.meta?.port_name || "";
    if (slugify(name) === q || name.toLowerCase().includes(query.toLowerCase())) return id;
  }
  return null;
}

function systemPrompt() {
  return [
    "You are PortTrip Concierge — an on-demand cruise port assistant.",
    "Ground your answers ONLY on the provided PORT CONTEXT plus general travel know-how.",
    "If something is missing from context, say so briefly and give a safe workaround.",
    "Output format:",
    "1) Best option (one sentence).",
    "2) Step-by-step instructions (walk/transport/tickets).",
    "3) Time & cost (minutes + €).",
    "4) Safety buffer (when to head back).",
    "5) Optional upgrades (scenic, kid-friendly, mobility-friendly, food nearby).",
    "Tone: calm, local-savvy, decisive. Include 'be back on board by X' when relevant.",
  ].join("\n");
}

function buildContext(portObj) {
  if (!portObj) return "No port context.";
  const m = portObj.meta || {};
  const parts = [];
  parts.push(`PORT: ${m.port_name || "Unknown"}`);
  if (m.description) parts.push(`DESCRIPTION: ${m.description}`);
  if (portObj.highlights) parts.push(`ATTRACTION HIGHLIGHTS (HTML): ${portObj.highlights}`);
  if (portObj.beyond) parts.push(`BEYOND THE HIGHLIGHTS (HTML): ${portObj.beyond}`);
  if (portObj.food) parts.push(`LOCAL FOOD (HTML): ${portObj.food}`);
  if (portObj.unique_experiences) parts.push(`UNIQUE EXPERIENCES (HTML): ${portObj.unique_experiences}`);
  if (portObj.customs_notes) parts.push(`CUSTOMS (HTML): ${portObj.customs_notes}`);
  if (portObj.safety_notes) parts.push(`SAFETY (HTML): ${portObj.safety_notes}`);
  const em = portObj.emergency_contacts || {};
  parts.push(`EMERGENCY: EU 112; Fire: ${em.fire ?? "n/a"}`);
  return parts.join("\n\n");
}

// ---- ROUTE: streaming text back to the browser ----
export async function POST(req) {
  try {
    const { history = [], portHint = "", fallbackGeneral = false } = await req.json();
    // history is an array of {role, content} from the client

    const db = await loadDB();

    // try to infer the port from hint or the last user message
    const lastUser = [...history].reverse().find((m) => m.role === "user")?.content || "";
    let portId = portHint ? findPortId(db, portHint) : null;
    if (!portId && lastUser) {
      for (const [id, obj] of Object.entries(db)) {
        const name = obj?.meta?.port_name || "";
        if (name && lastUser.toLowerCase().includes(name.toLowerCase())) { portId = id; break; }
      }
    }
    const portObj = portId ? db[portId] : null;

    const messages = [
      { role: "system", content: systemPrompt() },
      {
        role: "user",
        content: [
          portObj
            ? `PORT CONTEXT:\n${buildContext(portObj)}`
            : (fallbackGeneral ? "PORT CONTEXT: (unknown port — answer generally for cruise passengers)" : "PORT CONTEXT: (unknown)"),
          "\n---\n",
          "DIALOGUE:",
          ...history.map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        ].join("\n")
      }
    ];

    // stream tokens from OpenAI
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      stream: true,
      messages
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of stream) {
            const token = part?.choices?.[0]?.delta?.content || "";
            if (token) controller.enqueue(encoder.encode(token));
          }
        } catch (e) {
          controller.error(e);
          return;
        }
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no" // nginx/proxy hint
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
}
