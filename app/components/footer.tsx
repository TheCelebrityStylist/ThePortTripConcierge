export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16">
      <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-slate-400">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} PortTrip Concierge — fast, safe port days.</p>
          <div className="flex gap-5">
            <a href="/legal/terms" className="hover:text-white/90">Terms</a>
            <a href="/legal/privacy" className="hover:text-white/90">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

