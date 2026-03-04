import type { ReactNode } from "react";

type Props = {
  topBar: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  mobile: ReactNode;
};

export default function CruiseWorkspaceLayout({ topBar, left, center, right, mobile }: Props) {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 backdrop-blur">{topBar}</header>
      <div className="mx-auto max-w-[1700px] px-3 py-3">
        <div className="hidden h-[calc(100vh-86px)] grid-cols-[290px_minmax(0,1fr)_390px] gap-4 lg:grid">
          <section className="min-h-0 overflow-auto">{left}</section>
          <section className="min-h-0 overflow-auto">{center}</section>
          <section className="min-h-0 overflow-auto">{right}</section>
        </div>
        <div className="lg:hidden">{mobile}</div>
      </div>
    </main>
  );
}
