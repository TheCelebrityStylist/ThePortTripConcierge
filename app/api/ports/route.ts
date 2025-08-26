// app/api/ports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** We use fs, so ensure this route runs on the Node.js runtime (not Edge). */
export const runtime = "nodejs";

/* ---------- Types ---------- */
type PortRecord = {
  meta?: {
    port_name?: string;
    region?: string;
  };
  // other fields are allowed but not required
  [k: string]: unknown;
};

type DB = Record<string, PortRecord>;
type PortListItem = { id: string; name: string; region: string };

/* ---------- Data Loader ---------- */
async function loadDB(): Promise<DB> {
  const file = path.join(process.cwd(), "data", "porttrip.json");
  const raw = await readFile(file, "utf-8");
  return JSON.parse(raw) as DB;
}

/* ---------- GET /api/ports?q=...&limit=... ---------- */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase();
    const limit = Math.max(
      1,
      Math.min(200, Number(searchParams.get("limit") || 50))
    );

    const db = await loadDB();

    const list: PortListItem[] = Object.entries(db).map(([id, v]) => ({
      id,
      name: v?.meta?.port_name || id,
      region: v?.meta?.region || "",
    }));

    const filtered = (q
      ? list.filter((p) => p.name.toLowerCase().includes(q))
      : list
    ).slice(0, limit);

    return NextResponse.json(filtered, {
      headers: {
        // cache for a bit; fine for a static JSON dataset
        "Cache-Control":
          "public, max-age=300, s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("ports API error:", err);
    return NextResponse.json(
      { error: "Failed to load ports" },
      { status: 500 }
    );
  }
}

