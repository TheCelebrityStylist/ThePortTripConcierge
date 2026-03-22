import { portIntelligence } from "./cruise-intelligence";

export const seoPorts = portIntelligence.map((p) => ({
  slug: p.slug,
  city: p.city,
  title: `${p.city} Cruise Port Guide (2026) – What To Do In 1 Day`,
  longTailPages: [
    `what-to-do-in-${p.slug}-cruise-port-in-6-hours`,
    `is-${p.slug}-cruise-port-walkable`,
    `${p.slug}-cruise-port-tender-tips`,
    `best-beaches-near-${p.slug}-cruise-port`,
  ],
}));
