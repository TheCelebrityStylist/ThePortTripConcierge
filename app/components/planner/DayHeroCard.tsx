"use client";

export type DayHeroData = {
  title: string;
  window: string;
  summary: string;
  mustNotMiss: string;
  watchOutFor: string;
  fallback: string;
  whyThisWorks: string;
};

export default function DayHeroCard({
  hero,
  healthChip,
  confidence,
  onRefine,
  onRecovery,
}: {
  hero: DayHeroData;
  healthChip: string;
  confidence: number;
  onRefine: () => void;
  onRecovery: () => void;
}) {
  return (
    <section className="rounded-[30px] border border-white/10 bg-gradient-to-br from-[#182a4f] via-[#112445] to-[#0B1428] p-7 shadow-[0_30px_80px_rgba(2,8,24,0.45)]">
      <p className="text-sm text-slate-300">{hero.title} · {hero.window}</p>
      <p className="mt-2 max-w-3xl text-3xl font-semibold leading-tight">{hero.summary}</p>
      <div className="mt-5 grid gap-2 text-sm text-slate-200 md:grid-cols-3">
        <p><span className="text-slate-400">Must-not-miss:</span> {hero.mustNotMiss}</p>
        <p><span className="text-slate-400">Watch out for:</span> {hero.watchOutFor}</p>
        <p><span className="text-slate-400">Fallback:</span> {hero.fallback}</p>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs text-slate-200">{healthChip}</span>
        <span className="rounded-full bg-slate-950/70 px-3 py-1 text-xs text-slate-200">Confidence {confidence}</span>
        <button onClick={onRefine} className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-900">Refine this day</button>
        <button onClick={onRecovery} className="rounded-full border border-cyan-300/40 bg-slate-950/40 px-4 py-2 text-xs text-cyan-100">Recovery mode</button>
      </div>
      <details className="mt-4 text-xs text-slate-300">
        <summary className="cursor-pointer text-slate-400">Why this day works</summary>
        <p className="mt-2">{hero.whyThisWorks}</p>
      </details>
    </section>
  );
}
