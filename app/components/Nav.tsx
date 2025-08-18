import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">🚢</span>
          <span className="text-xl sm:text-2xl font-semibold tracking-tight">PortTrip Concierge</span>
        </Link>

        <div className="ml-auto hidden md:flex items-center gap-6 text-sm text-slate-300">
          <a href="#features" className="hover:text-white/90">Features</a>
          <a href="#pricing" className="hover:text-white/90">Pricing</a>
          <a href="#faq" className="hover:text-white/90">FAQ</a>
          <Link href="/chat" className="rounded-xl px-3 py-2 bg-white/10 border border-white/15 hover:bg-white/15">
            Launch app
          </Link>
        </div>
      </div>
    </nav>
  );
}

