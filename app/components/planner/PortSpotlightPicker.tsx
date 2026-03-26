"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { portsRegistry } from "@/app/data/ports";

const RECENT_KEY = "porttrip_recent_ports_v2";

type PortOption = (typeof portsRegistry)[string];

export default function PortSpotlightPicker({ value, onChange, onSelectComplete }: { value: string; onChange: (slug: string) => void; onSelectComplete?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = portsRegistry[value];
  const all = useMemo(() => Object.values(portsRegistry), []);

  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
      if (Array.isArray(parsed)) setRecent(parsed.slice(0, 8));
    } catch {
      setRecent([]);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 20);
    }
  }, [open]);

  const matching = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = q
      ? all.filter((port) => `${port.name} ${port.country} ${port.region} ${port.aliases.join(" ")}`.toLowerCase().includes(q))
      : all.slice(0, 48);

    const grouped = new Map<string, PortOption[]>();
    for (const port of pool) {
      grouped.set(port.region, [...(grouped.get(port.region) ?? []), port]);
    }

    return Array.from(grouped.entries()).map(([region, ports]) => ({ region, ports }));
  }, [all, query]);

  const flat = matching.flatMap((group) => group.ports);

  const pick = (slug: string) => {
    onChange(slug);
    onSelectComplete?.();
    const next = [slug, ...recent.filter((item) => item !== slug)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="flex h-12 w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 text-left shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:bg-slate-800/80">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Port</p>
          <p className="text-sm font-semibold">{selected?.name ?? "Choose a port"}</p>
        </div>
        <span className="text-xs text-cyan-300">⌘K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="mx-auto mt-10 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0B1220] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  setActive((prev) => Math.min(prev + 1, flat.length - 1));
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  setActive((prev) => Math.max(prev - 1, 0));
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (flat[active]) pick(flat[active].slug);
                }
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder="Search ports, aliases, country, region"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 text-sm outline-none ring-cyan-300/40 focus:ring"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {recent.map((slug) => {
                const port = portsRegistry[slug];
                if (!port) return null;
                return <button key={slug} onClick={() => pick(slug)} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">{port.name}</button>;
              })}
            </div>

            <div className="mt-4 max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              {matching.map((group) => (
                <div key={group.region}>
                  <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-cyan-200/80">{group.region}</p>
                  <div className="space-y-1">
                    {group.ports.map((port) => {
                      const index = flat.findIndex((item) => item.slug === port.slug);
                      return (
                        <button
                          key={port.slug}
                          onClick={() => pick(port.slug)}
                          className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${index === active ? "border-cyan-300/50 bg-cyan-500/10" : "border-white/5 bg-slate-900/60 hover:bg-slate-800/70"}`}
                        >
                          <div>
                            <p className="text-sm font-semibold text-slate-100">{port.name} <span className="text-xs font-normal text-slate-400">— {port.country}</span></p>
                            <p className="text-xs text-slate-500">{port.aliases[0]}</p>
                          </div>
                          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-slate-300">{port.region}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
