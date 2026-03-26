"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  user_id: string;
  port: string;
  arrival_time: string;
  all_aboard_time: string;
  risk_score: number;
  updated_at: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me").then((r) => r.json());
      if (!me.user) {
        window.location.href = "/login";
        return;
      }
      setUser(me.user);
      const data = await fetch("/api/itineraries").then((r) => r.json());
      setRows(data.filter((x: Row) => x.user_id === me.user.id || x.user_id === "guest"));
    })();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/itineraries/${id}`, { method: "DELETE" });
    setRows((r) => r.filter((x) => x.id !== id));
  }

  async function duplicate(id: string) {
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    const created = await fetch("/api/itineraries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...row, itinerary_json: { blocks: [] } }),
    }).then((r) => r.json());
    setRows((r) => [created, ...r]);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-semibold">My Cruise Plans</h1>
        <p className="mt-2 text-slate-300">{user ? `Signed in as ${user.email}` : "Loading…"}</p>
        <div className="mt-6 space-y-3">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="font-medium">{row.port}</p>
              <p className="text-sm text-slate-300">Time window: {row.arrival_time}–{row.all_aboard_time} · Risk: {row.risk_score}</p>
              <p className="text-xs text-slate-400">Last edited: {new Date(row.updated_at).toLocaleString()}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/plan/${row.id}`} className="rounded bg-white/10 px-3 py-1 text-sm">Edit</Link>
                <button onClick={() => duplicate(row.id)} className="rounded bg-white/10 px-3 py-1 text-sm">Duplicate</button>
                <button onClick={() => remove(row.id)} className="rounded bg-rose-500/30 px-3 py-1 text-sm">Delete</button>
                <a href={`/api/itineraries/${row.id}/pdf`} className="rounded bg-cyan-500 px-3 py-1 text-sm text-slate-900">Export PDF</a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
