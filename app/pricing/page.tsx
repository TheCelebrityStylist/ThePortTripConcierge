export default function PricingPage() {
  const tiers = [
    { name: "Free", price: "$0", points: ["Single day planner", "Limited AI prompts/day", "No export"] },
    { name: "Trip Pass", price: "$19 / cruise", points: ["Whole cruise planning", "Export PDF/ICS", "Generate all days"] },
    { name: "Pro", price: "$29 / month", points: ["Unlimited cruises", "Advanced simulation", "Full AI + templates"] },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="mt-2 text-slate-300">Choose the right planning depth for your next sailing.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <section key={tier.name} className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-lg font-semibold">{tier.name}</p>
            <p className="mt-1 text-cyan-300">{tier.price}</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-300">
              {tier.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
