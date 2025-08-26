// app/ports/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { PORTS } from "./data";

export const metadata: Metadata = {
  title: "Cruise Ports — PortTrip",
  description:
    "Quick guides for popular cruise ports with transport tips, time buffers, and easy loops. Plan your perfect port day with PortTrip.",
  alternates: {
    canonical: "/ports",
  },
};

export default function PortsIndexPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Cruise Ports
          </h1>
          <p className="mt-2 max-w-2xl text-slate-300">
            Skim quick, practical notes for popular ports. For a precise,
            timed plan with costs and a safe ship-return buffer, ask the{" "}
            <Link href="/chat" className="underline underline-offset-4">
              PortTrip Concierge
            </Link>
            .
          </p>
        </header>

        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PORTS.map((p) => (
            <li
              key={p.slug}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/[0.07] transition"
            >
              <h2 className="text-lg font-semibold">
                <Link href={`/ports/${p.slug}`} className="hover:underline">
                  {p.name}
                </Link>
              </h2>
              <p className="mt-2 text-sm text-slate-300">{p.short}</p>
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/ports/${p.slug}`}
                  className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
                >
                  Read guide
                </Link>
                <Link
                  href={`/chat?utm_source=ports&utm_medium=cta&utm_campaign=${p.slug}`}
                  className="rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500"
                >
                  Plan my day
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
