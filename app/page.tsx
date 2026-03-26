"use client";

import { useState } from "react";
import BudgetSavingsCard from "./components/cruise/BudgetSavingsCard";
import PremiumComparisonTable from "./components/cruise/PremiumComparisonTable";
import ReturnToShipSafetyTimer from "./components/cruise/ReturnToShipSafetyTimer";

async function startCheckout(plan: "pro" | "unlimited", setBanner: (s: string | null) => void) {
  try {
    const res = await fetch(`/api/stripe/checkout?plan=${plan}`, { method: "POST", credentials: "include" });
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      if (!res.ok || !j?.url) throw new Error(j?.error || "Checkout failed.");
      window.location.href = j.url;
      return;
    }
    if (res.status === 303) {
      const loc = res.headers.get("location");
      if (loc) window.location.href = loc;
      return;
    }
    throw new Error("Unexpected checkout response.");
  } catch (e: any) {
    setBanner(e?.message || "Could not start checkout.");
  }
}

export default function HomePage() {
  const [banner, setBanner] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(14,165,233,0.2),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
      </div>

      {banner && <div className="relative z-10 mx-auto max-w-4xl rounded-xl border border-amber-300/20 bg-amber-500/10 px-4 py-2 text-sm text-amber-200">{banner}</div>}

      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-10 pt-8 md:grid-cols-2">
        <div>
          <h1 className="text-5xl font-semibold leading-tight">The Cruise Intelligence System</h1>
          <p className="mt-4 text-slate-300">Purpose-built for cruise passengers: smarter than generic ChatGPT prompts, safer than Pinterest plans, and often dramatically cheaper than ship excursions.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="/chat" className="rounded-xl bg-cyan-500 px-5 py-3 font-medium text-slate-950">Plan My Port Day</a>
            <button onClick={() => startCheckout("pro", setBanner)} className="rounded-xl bg-white/10 px-5 py-3 font-medium">Unlock Pro Features</button>
          </div>
          <p className="mt-4 text-xs text-slate-400">Trusted by cruise travelers optimizing port days with return-risk scoring, route logic, and budget insights.</p>
        </div>
        <div className="space-y-4">
          <ReturnToShipSafetyTimer allAboardTime="16:30" recommendedBufferMinutes={90} tenderDelayMinutes={15} />
          <BudgetSavingsCard shipTourPrice={119} diyPrice={32} />
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-semibold">Why we outperform generic planning tools</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {["Ship-aware intelligence (line, ship, terminal, dock/tender)", "Smart port intelligence engine (distance, transport, closures, scams, strike risk)", "Dynamic itinerary builder with route optimization + map deep links", "Budget intelligence and savings visualizer", "Food & hidden gems engine", "Cruise mode personalization: kids, seniors, budget, luxury, adventure, time windows"].map((x) => (
            <div key={x} className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{x}</div>
          ))}
        </div>
      </section>

      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-4 text-2xl font-semibold">Free vs Pro</h2>
        <PremiumComparisonTable />
      </section>

      <section className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <h2 className="text-2xl font-semibold">Conversion architecture</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">Sticky CTA in product: <strong>Plan My Port Day</strong>. Mini comparison vs ship tours. FAQ objection handling. Social proof module.</div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">Viral loops: itinerary sharing, companion handoff, Pinterest card support, and travel-blog embed potential baked into model outputs.</div>
        </div>
      </section>

      <a href="/chat" className="fixed bottom-5 right-5 z-20 rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 shadow-2xl">Plan My Port Day</a>
    </main>
  );
}
