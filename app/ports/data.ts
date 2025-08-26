export type Port = {
  slug: string;
  name: string;
  country?: string;
  short: string;
  intro: string;
  tips: string[];
};

export const PORTS: Port[] = [
  {
    slug: "barcelona",
    name: "Barcelona (Spain)",
    country: "Spain",
    short:
      "Gaudí highlights, beachside tapas, and easy metro links from the cruise terminals.",
    intro:
      "Barcelona is one of Europe’s easiest ports for DIY exploring. From the cruise terminals, you can reach the Gothic Quarter, La Rambla, and the waterfront in minutes. Metro and taxi links are reliable, and major sights like La Sagrada Família and Park Güell can be combined if you time it right.",
    tips: [
      "Buy timed tickets for La Sagrada Família to avoid queues.",
      "Use the L3/L4 metro for quick hops; contactless works.",
      "Keep 45–60 minutes for the return to port in the afternoon.",
    ],
  },
  {
    slug: "athens-piraeus",
    name: "Athens — Piraeus (Greece)",
    country: "Greece",
    short:
      "Acropolis + Plaka loop with clear timings and metro from Piraeus to Monastiraki/Syntagma.",
    intro:
      "From Piraeus, Athens’ historic center is a straight shot on the metro. With a morning start, you can visit the Acropolis, wander Plaka’s lanes, and enjoy a quick taverna lunch before heading back. The return-to-ship buffer is essential due to afternoon traffic.",
    tips: [
      "Take the metro from Piraeus to Monastiraki (no taxi hassle).",
      "Start early for the Acropolis to beat heat and crowds.",
      "Leave the old town by ~14:15 for typical all-aboard times.",
    ],
  },
  {
    slug: "civitavecchia-rome",
    name: "Rome — Civitavecchia (Italy)",
    country: "Italy",
    short:
      "Fast regional train to Rome; hit 2–3 big sights and return with a safe time cushion.",
    intro:
      "From Civitavecchia, regional trains reach downtown Rome in roughly an hour. Focus on 2–3 highlights—e.g., the Colosseum area, Trevi + Pantheon, and a quick Vatican exterior view—then return on an earlier train than you ‘need’ to keep the safety buffer.",
    tips: [
      "Buy round-trip tickets at Civitavecchia station; validate before boarding.",
      "Prebook timed entries (Colosseum/Vatican) if you want inside visits.",
      "Plan to be back at Termini well before your target train.",
    ],
  },
];

