type Props = {
  shipTourPrice: number;
  diyPrice: number;
};

export default function BudgetSavingsCard({ shipTourPrice, diyPrice }: Props) {
  const savings = Math.max(0, shipTourPrice - diyPrice);
  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <h3 className="text-lg font-semibold">Budget Intelligence Mode</h3>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-xs uppercase text-slate-300">Ship tour</p>
          <p className="text-2xl font-bold">€{shipTourPrice}</p>
        </div>
        <div className="rounded-xl bg-white/10 p-3">
          <p className="text-xs uppercase text-slate-300">DIY route</p>
          <p className="text-2xl font-bold">€{diyPrice}</p>
        </div>
        <div className="rounded-xl bg-emerald-500/30 p-3">
          <p className="text-xs uppercase text-slate-100">You save</p>
          <p className="text-2xl font-bold">€{savings}</p>
        </div>
      </div>
    </section>
  );
}
