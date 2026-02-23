"use client";

const tabList = ["timeline", "chat", "map", "budget", "risk"] as const;
type Tab = typeof tabList[number];

export default function Tabs({ active, setActive }: { active: Tab; setActive: (tab: Tab) => void }) {
  return (
    <div className="overflow-x-auto border-b border-white/10 px-2 pb-2 pt-2">
      <div className="flex min-w-max gap-2">
        {tabList.map((tab) => (
          <button key={tab} onClick={() => setActive(tab)} className={`snap-start rounded-full px-4 py-2 text-sm capitalize ${active === tab ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"}`}>
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}

export type { Tab };
