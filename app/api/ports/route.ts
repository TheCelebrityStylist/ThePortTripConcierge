import { promises as fs } from "fs";
import path from "path";

async function loadDB() {
  const file = path.join(process.cwd(), "data", "porttrip.json");
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw);
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").toLowerCase();

  const db = await loadDB();
  const list = Object.entries(db).map(([id, v]) => ({
    id,
    name: v?.meta?.port_name || id,
    region: v?.meta?.region || ""
  }));

  const filtered = q
    ? list.filter(p => p.name.toLowerCase().includes(q))
    : list.slice(0, 50);

  return new Response(JSON.stringify(filtered), {
    headers: { "Content-Type": "application/json" }
  });
}

