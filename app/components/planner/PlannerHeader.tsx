"use client";

type Props = {
  hasPlan: boolean;
  onPrimary: () => void;
  onAction: (key: string) => void;
};

export default function PlannerHeader({ hasPlan, onPrimary, onAction }: Props) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-3 sm:px-4">
        <div>
          <h1 className="text-base font-semibold sm:text-lg">Cruise Day Planner</h1>
          <p className="text-xs text-slate-400">Port-aware AI travel agent</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onPrimary} className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900">{hasPlan ? "Auto-Optimize" : "Generate Plan"}</button>
          <details className="relative">
            <summary className="cursor-pointer rounded-lg bg-slate-800 px-3 py-2 text-sm">⋯</summary>
            <div className="absolute right-0 mt-2 w-40 rounded-lg border border-white/10 bg-slate-900 p-1 text-sm">
              { ["Simulate", "Export", "Save", "Compare"].map((item) => <button key={item} className="block w-full rounded px-2 py-1 text-left hover:bg-white/10" onClick={() => onAction(item.toLowerCase())}>{item}</button>) }
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
