import type { PlanOutput } from "@/app/lib/planner/types";

export default function ConciergeBrief({ output }: { output: PlanOutput }) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
      <p className="font-semibold">Personal Travel Agent Brief</p>
      <p className="mt-2 text-slate-200">{output.narrative}</p>
      <div className="mt-3 space-y-2">
        {output.plan.blocks.filter((block) => block.type === "stop").slice(0, 4).map((block) => (
          <article key={block.id} className="rounded-lg bg-slate-800 p-2">
            <p className="text-xs font-semibold text-cyan-200">{block.title}</p>
            <p className="mt-1 text-xs text-slate-300">{block.guidance}</p>
            <p className="mt-1 text-[11px] text-amber-200">Running late? {block.runningLateDecision}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
