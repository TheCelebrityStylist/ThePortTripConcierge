"use client";

type ActionKey = "simulate" | "save" | "export" | "duplicate" | "share";

export default function PlannerHeader({ hasPlan, onPrimary, onAction }: { hasPlan: boolean; onPrimary: () => void; onAction: (key: ActionKey) => void }) {
  return (
    <header className="border-b border-white/10 bg-slate-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <div>
          <h1 className="text-base font-semibold sm:text-lg">Cruise Day Planner</h1>
          <p className="text-xs text-slate-400">Interactive cruise planning workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrimary} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">{hasPlan ? "Update plan" : "Generate plan"}</button>
          <details className="relative">
            <summary className="cursor-pointer rounded-lg bg-slate-800 px-3 py-2 text-sm">⋯</summary>
            <div className="absolute right-0 mt-2 w-44 rounded-lg border border-white/10 bg-slate-900 p-1 text-sm">
              {(["Simulate", "Save", "Export", "Duplicate", "Share"] as const).map((item) => (
                <button key={item} className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => onAction(item.toLowerCase() as ActionKey)}>{item}</button>
              ))}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
