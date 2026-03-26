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
    <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#16294B] via-[#101E37] to-[#0A1323] px-6 py-6 shadow-[0_30px_90px_rgba(2,8,24,0.45)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{hero.title} · {hero.window}</p>
          <p className="mt-3 text-2xl font-semibold leading-tight text-slate-50 md:text-[30px]">{hero.summary}</p>
          <p className="mt-3 text-sm text-slate-300">{hero.whyThisWorks}</p>
        </div>

        <div className="flex flex-wrap gap-2 md:max-w-[240px] md:justify-end">
          <span className="rounded-full bg-slate-950/65 px-3 py-1 text-xs text-slate-200">{healthChip}</span>
          <span className="rounded-full bg-slate-950/65 px-3 py-1 text-xs text-slate-200">Confidence {confidence}</span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Must-not-miss</p>
          <p className="mt-2 text-sm font-medium text-slate-100">{hero.mustNotMiss}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Biggest risk</p>
          <p className="mt-2 text-sm font-medium text-slate-100">{hero.watchOutFor}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-950/30 px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Fallback loop</p>
          <p className="mt-2 text-sm font-medium text-slate-100">{hero.fallback}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button onClick={onRefine} className="rounded-full bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-900">Reduce walking</button>
        <button onClick={onRecovery} className="rounded-full border border-cyan-300/35 bg-slate-950/30 px-4 py-2 text-xs text-cyan-100">Recovery mode</button>
      </div>
    </section>
  );
}
