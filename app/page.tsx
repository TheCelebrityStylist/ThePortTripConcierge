"use client";

import { useState } from "react";
import { BrandMark, BrandWordmark } from "@/components/brand"; // or "../components/brand"

/** Kick off a server-side Stripe Checkout session */
async function startCheckout(
  plan: "pro" | "unlimited",
  setBanner: (s: string | null) => void
) {
  try {
    const res = await fetch(`/api/stripe/checkout?plan=${plan}`, {
      method: "POST",
      credentials: "include",
    });
    const ct = res.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      const j = await res.json();
      if (!res.ok || !j?.url) throw new Error(j?.error || "Checkout failed.");
      window.location.href = j.url;
      return;
    }
    if (res.status === 303) {
      const loc = res.headers.get("location");
      if (loc) { window.location.href = loc; return; }
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
      {/* Ambient gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <BrandMark size={24} />
          <BrandWordmark className="h-6 w-auto" />
        </div>

        <nav className="flex items-center gap-6 text-sm text-slate-300">
          <a href="#features" className="hover:text-white/90">Features</a>
          <a href="#pricing" className="hover:text-white/90">Pricing</a>
          <a href="#faq" className="hover:text-white/90">FAQ</a>
          <a
            href="/chat"
            className="rounded-lg bg-white/10 px-3 py-1.5 font-medium hover:bg-white/15"
          >
            Launch app
          </a>
        </nav>
      </header>

      {/* Top banner (errors, etc.) */}
      {banner && (
        <div className="relative z-10 mx-auto max-w-3xl px-6">
          <div className="mb-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            {banner}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 pb-10 pt-6 md:grid-cols-2 md:gap-12">
        <div className="flex flex-col">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Your AI concierge for{" "}
            <span className="text-sky-400">perfect port days.</span>
          </h1>
          <p className="mt-4 max-w-xl text-slate-300">
            Ask anything about a cruise port and get a precise, timed plan:
            best route, costs, return-to-ship buffer, and insider tips —
            grounded in your private database.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/chat"
              className="rounded-xl bg-white/10 px-5 py-3 font-medium hover:bg-white/15"
            >
              Launch free
            </a>
            <button
              onClick={() => startCheckout("pro", setBanner)}
              className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-5 py-3 font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500"
            >
              Upgrade to Pro
            </button>
          </div>

          <p className="mt-3 text-sm text-slate-400">
            No account required for the demo. Pro unlocks advanced features and higher limits.
          </p>
        </div>

        {/* Live preview card */}
        <aside className="rounded-[24px] border border-white/15 bg-white/5 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl md:p-6">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
            <div className="mb-2 text-slate-400">Live preview</div>

            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <strong>Best option:</strong> 6-hour highlights loop with Acropolis → Plaka → Agora.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <strong>Steps:</strong> Walk 8 min to metro → buy 24-hr ticket → Acropolis early → Plaka lunch → back via Monastiraki.
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <strong>Time &amp; cost:</strong> 4h visiting + 80–90 min transit; ~€22 pp (tickets + lunch).
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <strong>Safety buffer:</strong> Depart old town by 14:15 to be at port 15:00.
              </div>
            </div>
          </div>
        </aside>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold">Why PortTrip</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium">Grounded answers</h3>
            <p className="mt-2 text-sm text-slate-300">
              Uses your database to avoid generic advice.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium">Precise timing</h3>
            <p className="mt-2 text-sm text-slate-300">
              Every plan includes minutes, costs, and a safe ship-return buffer.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h3 className="font-medium">Personalization</h3>
            <p className="mt-2 text-sm text-slate-300">
              Family, mobility, budget, foodie—plans adapt instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold">Pricing</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold">Free</h3>
            <div className="mt-2 text-3xl font-bold">€0</div>
            <ul className="mt-4 list-disc pl-5 text-sm text-slate-300">
              <li>20 chats / month</li>
              <li>Core concierge model</li>
              <li>Community support</li>
            </ul>
            <a
              href="/chat"
              className="mt-5 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              Start free
            </a>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold">Pro</h3>
            <div className="mt-2 text-3xl font-bold">
              €9<span className="ml-1 text-base font-medium text-slate-300">/mo</span>
            </div>
            <ul className="mt-4 list-disc pl-5 text-sm text-slate-300">
              <li>500 chats / month</li>
              <li>Priority model + faster streaming</li>
              <li>Custom branding</li>
            </ul>
            <button
              onClick={() => startCheckout("pro", setBanner)}
              className="mt-5 inline-block rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Unlimited */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-lg font-semibold">Unlimited</h3>
            <div className="mt-2 text-3xl font-bold">
              €19<span className="ml-1 text-base font-medium text-slate-300">/mo</span>
            </div>
            <ul className="mt-4 list-disc pl-5 text-sm text-slate-300">
              <li>Unlimited chats</li>
              <li>Team seats (up to 5)</li>
              <li>Concierge onboarding</li>
            </ul>
            <button
              onClick={() => startCheckout("unlimited", setBanner)}
              className="mt-5 inline-block rounded-xl bg-white/10 px-4 py-2 text-sm font-medium hover:bg-white/15"
            >
              Go Unlimited
            </button>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <h2 className="mb-6 text-2xl font-semibold">FAQ</h2>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-300">
          <p>Have a question? Ask inside the app or email support@porttrip.com.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-6xl px-6 py-8 text-sm text-slate-400">
        <div className="flex items-center gap-2">
          <BrandMark size={20} />
          <span>© {new Date().getFullYear()} PortTrip</span>
        </div>
      </footer>
    </main>
  );
}


