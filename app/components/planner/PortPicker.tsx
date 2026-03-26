"use client";

import { useMemo, useRef, useState } from "react";
import { portIndex } from "@/app/data/ports";

type PortPickerProps = {
  value: string;
  onChange: (port: { slug: string; name: string; region: string }) => void;
};

type Item = { kind: "header"; label: string } | { kind: "port"; id: string; name: string; region: string; country: string };

const ROW_HEIGHT = 36;
const VISIBLE_COUNT = 8;

export default function PortPicker({ value, onChange }: PortPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  const groupedItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = portIndex
      .filter((p) => !q || p.search.includes(q) || p.aliases.some((alias) => alias.toLowerCase().includes(q)))
      .slice(0, 200);

    const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, port) => {
      (acc[port.region] ||= []).push(port);
      return acc;
    }, {});

    const items: Item[] = [];
    Object.entries(grouped).forEach(([region, ports]) => {
      items.push({ kind: "header", label: region });
      ports.forEach((port) => items.push({ kind: "port", id: port.id, name: port.name, region: port.region, country: port.country }));
    });
    return items;
  }, [query]);

  const portItems = groupedItems.filter((item): item is Extract<Item, { kind: "port" }> => item.kind === "port");
  const selected = portIndex.find((p) => p.id === value || p.name.toLowerCase() === value.toLowerCase());
  const popular = ["barcelona", "civitavecchia", "marseille", "cozumel", "nassau", "juneau", "singapore"];

  const pick = (id: string) => {
    const port = portIndex.find((p) => p.id === id);
    if (!port) return;
    onChange({ slug: port.id, name: port.name, region: port.region });
    setRecent((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 5));
    setOpen(false);
    setQuery("");
  };

  const start = Math.floor(scrollTop / ROW_HEIGHT);
  const end = Math.min(groupedItems.length, start + VISIBLE_COUNT + 6);
  const visible = groupedItems.slice(start, end);

  return (
    <div className="relative">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls="port-picker-list"
        value={open ? query : selected?.name ?? value ?? ""}
        placeholder="Search ports, countries, regions..."
        className="w-full rounded-lg border border-white/15 bg-slate-900 px-3 py-2 text-sm"
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
            setActive((x) => Math.min(portItems.length - 1, x + 1));
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((x) => Math.max(0, x - 1));
          }
          if (e.key === "Enter" && portItems[active]) {
            e.preventDefault();
            pick(portItems[active].id);
          }
          if (e.key === "Escape") setOpen(false);
        }}
      />

      {open && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl">
          <div className="mb-2 flex flex-wrap gap-1">
            {[...recent, ...popular.filter((p) => !recent.includes(p))].slice(0, 7).map((id) => {
              const port = portIndex.find((p) => p.id === id);
              if (!port) return null;
              return (
                <button key={id} type="button" onClick={() => pick(id)} className="rounded-full bg-slate-800 px-2 py-1 text-[11px]">
                  {port.name}
                </button>
              );
            })}
          </div>
          <div
            id="port-picker-list"
            ref={listRef}
            role="listbox"
            className="max-h-72 overflow-y-auto rounded border border-white/10"
            onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
            style={{ height: ROW_HEIGHT * VISIBLE_COUNT }}
          >
            <div style={{ height: groupedItems.length * ROW_HEIGHT, position: "relative" }}>
              {visible.map((item, idx) => {
                const absoluteIndex = start + idx;
                const top = absoluteIndex * ROW_HEIGHT;
                if (item.kind === "header") {
                  return (
                    <div key={`${item.label}-${absoluteIndex}`} style={{ position: "absolute", top, height: ROW_HEIGHT }} className="w-full bg-slate-950 px-2 py-2 text-[11px] uppercase tracking-wide text-cyan-300/80">
                      {item.label}
                    </div>
                  );
                }
                const portIdx = portItems.findIndex((p) => p.id === item.id);
                const isActive = portIdx === active;
                return (
                  <button
                    key={item.id + absoluteIndex}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActive(portIdx)}
                    onClick={() => pick(item.id)}
                    style={{ position: "absolute", top, height: ROW_HEIGHT }}
                    className={`w-full px-2 text-left text-sm ${isActive ? "bg-cyan-500/20" : "hover:bg-white/5"}`}
                  >
                    {item.name}
                    <span className="ml-2 text-xs text-slate-400">{item.country}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
