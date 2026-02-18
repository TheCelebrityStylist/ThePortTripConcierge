"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/ports", label: "Ports" },
  { href: "/blog", label: "Blog" }
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-5 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          PortTrip Concierge
        </Link>

        <div className="ml-auto flex items-center gap-5 text-sm text-slate-300">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link key={link.href} href={link.href} className={active ? "text-white" : "hover:text-white"}>
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/planner"
            className="rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 px-3 py-1.5 font-medium text-white shadow-lg shadow-indigo-900/30 hover:from-sky-400 hover:to-indigo-500"
          >
            Plan My Port Day
          </Link>
        </div>
      </div>
    </nav>
  );
}
