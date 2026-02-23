"use client";

const tabList = ["timeline", "map", "budget", "risk", "chat"] as const;
export type Tab = typeof tabList[number];

export default function Tabs({ active, setActive }: { active: Tab; setActive: (tab: Tab) => void }) {
  return (
    <>
      <div className="hidden border-b border-white/10 px-2 pb-2 pt-2 sm:block">
        <div className="flex min-w-max gap-2 overflow-x-auto">
          {tabList.map((tab) => (
            <button key={tab} onClick={() => setActive(tab)} className={`rounded-full px-4 py-2 text-sm capitalize ${active === tab ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"}`}>{tab}</button>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/10 bg-slate-950/95 p-2 sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          {tabList.map((tab) => (
            <button key={tab} onClick={() => setActive(tab)} className={`rounded-lg px-2 py-2 text-xs capitalize ${active === tab ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"}`}>{tab}</button>
          ))}
        </div>
      </div>
    </>
  );
}
