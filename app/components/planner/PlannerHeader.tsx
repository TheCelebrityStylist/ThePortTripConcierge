"use client";

type ActionKey = "simulate" | "save" | "export" | "duplicate" | "share";

export default function PlannerHeader({ hasPlan, onPrimary, onAction }: { hasPlan: boolean; onPrimary: () => void; onAction: (key: ActionKey) => void }) {
  void hasPlan;
  void onPrimary;
  return (
    <header className="border-b border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-4 sm:px-4">
        <div>
          <h1 className="text-xl font-semibold">Cruise Co-Pilot</h1>
          <p className="text-sm text-slate-400">Build your cruise day-by-day with calm, guided AI support.</p>
        </div>
        <details className="relative">
          <summary className="cursor-pointer rounded-lg bg-slate-800 px-3 py-2 text-sm">Actions</summary>
          <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-slate-900 p-1 text-sm">
            {(["Simulate", "Save", "Export", "Duplicate", "Share"] as const).map((item) => (
              <button key={item} className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => onAction(item.toLowerCase() as ActionKey)}>{item}</button>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
