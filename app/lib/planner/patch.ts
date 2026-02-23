import type { PlanStop } from "./types";

type PatchOp = { op: "add" | "remove" | "replace"; path: string; value?: unknown };

const parseIndex = (path: string) => Number(path.replace("/stops/", ""));

export function applyPlanPatch(stops: PlanStop[], patch: PatchOp[] = []): PlanStop[] {
  let next = [...stops];
  patch.forEach((op) => {
    if (!op.path.startsWith("/stops/")) return;
    const idx = parseIndex(op.path);
    if (Number.isNaN(idx)) return;
    if (op.op === "add" && op.value && idx >= 0 && idx <= next.length) {
      next.splice(idx, 0, op.value as PlanStop);
    }
    if (op.op === "remove" && idx >= 0 && idx < next.length) {
      next.splice(idx, 1);
    }
    if (op.op === "replace" && op.value && idx >= 0 && idx < next.length) {
      next[idx] = op.value as PlanStop;
    }
  });
  return next;
}
