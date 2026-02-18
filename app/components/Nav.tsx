import Link from "next/link";

export default function Nav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
        <Link href="/" className="font-semibold tracking-wide">PortTrip</Link>
        <div className="ml-auto flex items-center gap-4 text-sm text-slate-300">
          <Link href="/plan" className="hover:text-white">Cruise Day Planner</Link>
          <Link href="/blog" className="hover:text-white">Cruise Intelligence Library</Link>
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/login" className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/15">Login</Link>
          <Link href="/signup" className="rounded-lg bg-cyan-500 px-3 py-1.5 font-medium text-slate-900">Sign up</Link>
        </div>
      </div>
    </nav>
  );
}
