import type { Metadata } from "next";
import Link from "next/link";
import { PORTS, type Port } from "../data";

// prebuild static paths
export async function generateStaticParams() {
  return PORTS.map((p) => ({ slug: p.slug }));
}

function getPort(slug: string): Port | undefined {
  return PORTS.find((p) => p.slug === slug);
}

type Props = { params: { slug: string } };

// per-page metadata (server only)
export function generateMetadata({ params }: Props): Metadata {
  const port = getPort(params.slug);
  if (!port) return {};
  const title = `${port.name} — Cruise Port Guide | PortTrip`;
  const desc =
    port.short ||
    `Quick guide to ${port.name} with timings, transport, and a safe ship-return buffer.`;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://porttrip.com";
  const url = `${base}/ports/${port.slug}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: "PortTrip",
      type: "article",
    },
  };
}

export default function PortPage({ params }: Props) {
  const port = getPort(params.slug);
  if (!port) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="text-2xl font-semibold">Port not found</h1>
          <p className="mt-2">
            Go back to the{" "}
            <Link href="/ports" className="underline">
              ports list
            </Link>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[48rem] w-[48rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.18),_transparent_60%)] blur-2xl" />
        <div className="absolute -bottom-40 -right-40 h-[52rem] w-[52rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(99,102,241,0.18),_transparent_60%)] blur-2xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-10">
        <nav className="mb-4 text-sm text-slate-300">
          <Link href="/ports" className="underline">
            Ports
          </Link>{" "}
          / <span className="text-slate-200">{port.name}</span>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {port.name}
        </h1>
        <p className="mt-3 text-slate-300">{port.intro}</p>

        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-lg font-semibold">Quick tips</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-slate-300">
            {port.tips.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex gap-2">
          <Link
            href={`/chat?utm_source=ports_detail&utm_medium=cta&utm_campaign=${port.slug}`}
            className="rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500"
          >
            Plan my day in {port.name.split(" ")[0]}
          </Link>
          <Link
            href="/ports"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Back to all ports
          </Link>
        </div>
      </div>
    </main>
  );
}
