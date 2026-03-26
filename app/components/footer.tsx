import Link from "next/link";
import { legalContent } from "@/app/content/legal";

export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-400">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/30 px-4 py-4">
        <p>© {new Date().getFullYear()} {legalContent.companyName}</p>
        <nav className="flex flex-wrap items-center gap-5">
          <Link className="hover:text-slate-200" href="/legal/terms">Terms</Link>
          <Link className="hover:text-slate-200" href="/privacy">Privacy Policy</Link>
          <Link className="hover:text-slate-200" href="/delete-account">Delete Account</Link>
          <a className="hover:text-slate-200" href={`mailto:${legalContent.supportEmail}`}>Support</a>
        </nav>
      </div>
    </footer>
  );
}
