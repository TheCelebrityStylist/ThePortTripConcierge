import Link from "next/link";

type Props = { params: { id: string } };

export default function SharedPlanPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase text-slate-400">Planned with PortTrip Cruise Planner</p>
        <h1 className="mt-2 text-3xl font-semibold">Shared Cruise Plan</h1>
        <p className="mt-3 text-slate-300">Plan ID: {params.id}</p>
        <p className="mt-3 text-slate-300">Open this plan in the builder to edit stops, recalculate safety, and export PDF.</p>
        <Link href="/plan" className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-900">Open Planner</Link>
      </div>
    </main>
  );
}
