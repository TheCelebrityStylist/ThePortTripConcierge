"use client";

import type { ReactNode } from "react";

type MobileTab = "plan" | "chat" | "risk" | "budget";

export default function MobilePlannerShell({ active, onChange, children }: { active: MobileTab; onChange: (tab: MobileTab) => void; children: ReactNode }) {
  const tabs: Array<{ key: MobileTab; label: string }> = [
    { key: "plan", label: "Plan" },
    { key: "chat", label: "Chat" },
    { key: "risk", label: "Risk" },
    { key: "budget", label: "Budget" },
  ];

  return (
    <div className="lg:hidden">
      <div className="pb-16">{children}</div>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-slate-950/95 p-2 backdrop-blur">
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => onChange(tab.key)} className={`rounded-lg py-2 text-xs ${active === tab.key ? "bg-cyan-400 text-slate-900" : "bg-slate-800 text-slate-200"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
