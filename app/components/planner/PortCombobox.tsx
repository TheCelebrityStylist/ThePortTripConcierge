"use client";

import { useMemo, useState } from "react";
import { popularPortSlugs, portsByRegion } from "@/app/lib/ports";

export default function PortCombobox({ value, onChange }: { value: string; onChange: (slug: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<"All" | keyof typeof portsByRegion>("All");

  const all = useMemo(() => Object.values(portsByRegion).flat(), []);
  const filtered = useMemo(() => {
    const pool = region === "All" ? all : portsByRegion[region];
    return pool
      .filter((port) => `${port.name} ${port.country} ${port.region}`.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 40);
  }, [all, query, region]);

  const select = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="w-full rounded border border-white/10 bg-slate-800 p-2 text-left text-sm">
        {all.find((port) => port.slug === value)?.name ?? "Select a port"}
      </button>

      {open && (
        <div className="space-y-2 rounded border border-white/10 bg-slate-900/80 p-2">
          <div className="flex gap-2">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ports..." className="w-full rounded bg-slate-800 p-2 text-sm" />
            <select value={region} onChange={(event) => setRegion(event.target.value as "All" | keyof typeof portsByRegion)} className="rounded bg-slate-800 p-2 text-xs">
              <option value="All">All</option>
              {Object.keys(portsByRegion).map((value) => <option key={value}>{value}</option>)}
            </select>
          </div>

          <div className="rounded border border-white/10 bg-slate-900/70 p-2">
            <p className="text-xs text-slate-400">Recent / popular</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {popularPortSlugs.map((slug) => (
                <button key={slug} onClick={() => select(slug)} className={`rounded-full px-2 py-1 text-xs ${value === slug ? "bg-cyan-400 text-slate-900" : "bg-slate-800"}`}>{all.find((port) => port.slug === slug)?.name ?? slug}</button>
              ))}
            </div>
          </div>

          <div className="max-h-48 overflow-y-auto rounded border border-white/10 bg-slate-900/70">
            {filtered.map((port) => (
              <button key={port.slug} onClick={() => select(port.slug)} className={`block w-full border-b border-white/5 px-3 py-2 text-left text-sm last:border-b-0 ${value === port.slug ? "bg-cyan-500/20" : "hover:bg-white/5"}`}>
                {port.name} <span className="text-xs text-slate-400">· {port.region}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
