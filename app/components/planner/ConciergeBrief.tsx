type Concierge = {
  narrative: string;
  why: string[];
  bookAvoid: string[];
  pacing: string;
  lateTree: string[];
};

export default function ConciergeBrief({ data }: { data: Concierge }) {
  return (
    <section className="rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm">
      <p className="font-semibold">Concierge Brief</p>
      <p className="mt-2 text-slate-200">{data.narrative}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">{data.why.map((line) => <li key={line}>{line}</li>)}</ul>
      <p className="mt-2 font-medium">What to book / avoid</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-300">{data.bookAvoid.map((line) => <li key={line}>{line}</li>)}</ul>
      <p className="mt-2 text-slate-300">{data.pacing}</p>
      <p className="mt-2 font-medium">If you run late</p>
      <ol className="mt-1 list-decimal space-y-1 pl-5 text-slate-300">{data.lateTree.map((line) => <li key={line}>{line}</li>)}</ol>
    </section>
  );
}
