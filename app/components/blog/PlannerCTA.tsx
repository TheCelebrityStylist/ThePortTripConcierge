import Link from "next/link";

export default function PlannerCTA({ title, description, label, href }: { title: string; description: string; label: string; href: string }) {
  return (
    <aside className="rounded-2xl border border-cyan-300/25 bg-cyan-500/10 p-4">
      <p className="text-sm font-semibold text-cyan-100">{title}</p>
      <p className="mt-1 text-sm text-slate-200">{description}</p>
      <Link href={href} className="mt-3 inline-flex items-center rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300">
        {label}
      </Link>
    </aside>
  );
}
