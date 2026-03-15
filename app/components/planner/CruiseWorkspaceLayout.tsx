import type { ReactNode } from "react";

type Props = {
  topBar: ReactNode;
  left: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  mobile: ReactNode;
};

export default function CruiseWorkspaceLayout({ topBar, left, center, right, mobile }: Props) {
  const desktopCols = right ? "grid-cols-[260px_minmax(0,1fr)_360px]" : "grid-cols-[260px_minmax(0,1fr)]";
  return (
    <main className="h-screen overflow-hidden bg-[#070C17] text-slate-100">
      <div className={`mx-auto hidden h-full max-w-[1860px] ${desktopCols} grid-rows-[72px_1fr] gap-4 px-4 py-4 lg:grid`}>
        <header className={`row-start-1 rounded-[24px] border border-white/10 bg-[#0D1526]/95 backdrop-blur ${right ? "col-span-3" : "col-span-2"}`}>{topBar}</header>
        <section className="row-start-2 min-h-0 overflow-y-auto">{left}</section>
        <section className="row-start-2 min-h-0 overflow-y-auto">{center}</section>
        {right && <section className="row-start-2 min-h-0 overflow-y-auto">{right}</section>}
      </div>
      <div className="h-full overflow-y-auto lg:hidden">{mobile}</div>
    </main>
  );
}
