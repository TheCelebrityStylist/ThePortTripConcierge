"use client";

export default function SimulationDrawer({ open, onClose, onRun }: { open: boolean; onClose: () => void; onRun: (scenario: "disembark" | "traffic" | "tender" | "museum") => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="absolute bottom-0 left-0 right-0 rounded-t-2xl border border-white/10 bg-slate-900 p-4">
        <h3 className="font-semibold">Simulate disruption</h3>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <button className="rounded bg-slate-800 p-2" onClick={() => onRun("disembark")}>Long disembark queue</button>
          <button className="rounded bg-slate-800 p-2" onClick={() => onRun("traffic")}>Traffic spike</button>
          <button className="rounded bg-slate-800 p-2" onClick={() => onRun("tender")}>Late tender</button>
          <button className="rounded bg-slate-800 p-2" onClick={() => onRun("museum")}>Museum line</button>
        </div>
        <button onClick={onClose} className="mt-3 w-full rounded border border-white/15 py-2 text-sm">Close</button>
      </div>
    </div>
  );
}
