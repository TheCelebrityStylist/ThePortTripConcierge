import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import UpgradeButton from "@/components/UpgradeButton";
import Link from "next/link";

export default function Landing() {
  return (
    <div className="relative min-h-screen">
      {/* background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 w-[48rem] h-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 w-[52rem] h-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      <Nav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-semibold leading-tight">
              Your AI concierge for<br />
              <span className="bg-gradient-to-br from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                perfect port days.
              </span>
            </h1>
            <p className="mt-5 text-slate-300 text-lg">
              Ask anything about a cruise port and get a precise, timed plan:
              best route, costs, return-to-ship buffer, and insider tips —
              grounded in your private database.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/chat" className="rounded-xl bg-white/10 border border-white/15 px-5 py-3 hover:bg-white/15">
                Launch free
              </Link>
              <UpgradeButton label="Upgrade to Pro" />
            </div>
            <p className="mt-3 text-sm text-slate-400">No account required for the demo. Pro unlocks advanced features and higher limits.</p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.35)] p-4">
            <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-sm text-slate-300 leading-relaxed">
              <div className="mb-3 text-slate-100 font-medium">Live preview</div>
              <div className="space-y-3">
                <div className="rounded-xl bg-white/10 p-3">
                  <strong>Best option</strong>: 6-hour highlights loop with Acropolis → Plaka → Agora. 
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <strong>Steps</strong>: Walk 8 min to metro → buy 24-hr ticket → Acropolis early → Plaka lunch → back via Monastiraki.
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <strong>Time & cost</strong>: 4h visiting + 80–90 min transit; ~€22 pp (tickets + lunch).
                </div>
                <div className="rounded-xl bg-white/10 p-3">
                  <strong>Safety buffer</strong>: Depart old town by 14:15 to be at port 15:00.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">Why PortTrip</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            ["Grounded answers", "Uses your database to avoid generic advice."],
            ["Precise timing", "Every plan includes minutes, costs, and a safe ship-return buffer."],
            ["Personalization", "Family, mobility, budget, foodie—plans adapt instantly."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
              <div className="text-xl font-medium mb-2">{title}</div>
              <p className="text-slate-300">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">Pricing</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl flex flex-col">
            <div className="text-xl font-semibold">Free</div>
            <div className="text-3xl mt-2">€0</div>
            <ul className="mt-4 text-sm text-slate-300 space-y-2">
              <li>• 20 chats / month</li>
              <li>• Core concierge model</li>
              <li>• Community support</li>
            </ul>
            <div className="mt-6">
              <Link href="/chat" className="inline-flex rounded-xl border border-white/15 bg-white/10 px-4 py-2 hover:bg-white/15">Start free</Link>
            </div>
          </div>
          {/* Pro */}
          <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-6 backdrop-blur-xl flex flex-col shadow-[0_12px_40px_rgba(2,132,199,0.25)]">
            <div className="text-xl font-semibold">Pro</div>
            <div className="text-3xl mt-2">€9<span className="text-base text-slate-300">/mo</span></div>
            <ul className="mt-4 text-sm text-slate-200 space-y-2">
              <li>• 500 chats / month</li>
              <li>• Priority model + faster streaming</li>
              <li>• Custom branding</li>
            </ul>
            <div className="mt-6">
              <UpgradeButton label="Upgrade to Pro" />
            </div>
          </div>
          {/* Unlimited */}
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-xl flex flex-col">
            <div className="text-xl font-semibold">Unlimited</div>
            <div className="text-3xl mt-2">€19<span className="text-base text-slate-300">/mo</span></div>
            <ul className="mt-4 text-sm text-slate-300 space-y-2">
              <li>• Unlimited chats</li>
              <li>• Team seats (up to 5)</li>
              <li>• Concierge onboarding</li>
            </ul>
            <div className="mt-6">
              <UpgradeButton label="Go Unlimited" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-2xl font-semibold mb-6">FAQ</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {[
            ["How do upgrades work?", "Click an upgrade button; we use Stripe Checkout. You’ll get instant access after payment."],
            ["Can I bring my own data?", "Yes. Upload a JSON/DB and the concierge will ground answers against it."],
            ["Do you store chats?", "By default, no. You can enable history in settings later."],
            ["Refunds?", "Absolutely—30-day guarantee if it’s not for you."]
          ].map(([q, a]) => (
            <div key={q} className="rounded-2xl border border-white/15 bg-white/5 p-5 backdrop-blur-xl">
              <div className="font-medium mb-1">{q}</div>
              <p className="text-slate-300">{a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

