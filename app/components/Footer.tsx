export default function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-400">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} PortTrip</p>
        <nav className="flex items-center gap-5">
          <a className="hover:text-slate-200" href="/legal/terms">Terms</a>
          <a className="hover:text-slate-200" href="/legal/privacy">Privacy</a>
          <a className="hover:text-slate-200" href="mailto:support@porttrip.com">Support</a>
        </nav>
      </div>
    </footer>
  );
}

