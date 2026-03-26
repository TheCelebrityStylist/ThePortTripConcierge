"use client";

import { useMemo, useState } from "react";
import { portIndex } from "@/app/data/ports";

type Props = {
  value?: string;
  onSelect: (port: { slug: string; name: string; region: string }) => void;
  placeholder?: string;
};

export default function PortTypeahead({ value, onSelect, placeholder = "Search ports, countries, regions..." }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);

  const selected = useMemo(() => portIndex.find((p) => p.id === value || p.name.toLowerCase() === (value ?? "").toLowerCase()), [value]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = portIndex
      .filter((p) => !q || p.search.includes(q) || p.aliases.some((alias) => alias.toLowerCase().includes(q)))
      .slice(0, 80);
    return filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
      (acc[item.region] ||= []).push(item);
      return acc;
    }, {});
  }, [query]);

  const flattened = Object.values(grouped).flat();
  const popular = ["barcelona", "civitavecchia", "marseille", "cozumel", "nassau", "juneau", "singapore"];

  const pick = (slug: string) => {
    const port = portIndex.find((p) => p.id === slug);
    if (!port) return;
    onSelect({ slug: port.id, name: port.name, region: port.region });
    setRecent((prev) => [slug, ...prev.filter((s) => s !== slug)].slice(0, 5));
    setOpen(false);
    setQuery("");
  };

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="port-typeahead-results"
        value={open ? query : selected?.name ?? value ?? ""}
        placeholder={placeholder}
        className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm"
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setOpen(true);
          setQuery(e.target.value);
          setActive(0);
        }}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((v) => Math.min(flattened.length - 1, v + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((v) => Math.max(0, v - 1));
          }
          if (e.key === "Enter" && flattened[active]) {
            e.preventDefault();
            pick(flattened[active].id);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
          <div className="mb-2 flex flex-wrap gap-1">
            {[...recent, ...popular.filter((slug) => !recent.includes(slug))].slice(0, 7).map((slug) => {
              const p = portIndex.find((item) => item.id === slug);
              if (!p) return null;
              return <button key={slug} onClick={() => pick(slug)} className="rounded-full bg-slate-800 px-2 py-1 text-[11px]">{p.name}</button>;
            })}
          </div>

          <div id="port-typeahead-results" role="listbox" className="max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-slate-900/40 p-1">
            {Object.entries(grouped).map(([region, ports]) => (
              <div key={region} className="mb-1">
                <p className="px-2 py-1 text-[11px] uppercase tracking-wide text-cyan-200/80">{region}</p>
                {ports.map((port) => {
                  const idx = flattened.findIndex((f) => f.id === port.id);
                  const isActive = idx === active;
                  return (
                    <button key={port.id} role="option" aria-selected={isActive} onMouseEnter={() => setActive(idx)} onClick={() => pick(port.id)} className={`block w-full rounded px-2 py-2 text-left text-sm ${isActive ? "bg-cyan-500/20" : "hover:bg-white/5"}`}>
                      {port.name} <span className="text-xs text-slate-400">{port.country}</span>
                    </button>
                  );
                })}
              </div>
            ))}
            {!flattened.length && <p className="p-3 text-center text-xs text-slate-400">No ports found.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
