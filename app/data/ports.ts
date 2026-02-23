import type { ClusterStop, Port } from "@/app/lib/planner/types";

type Seed = {
  slug: string;
  displayName: string;
  country: string;
  region: "Europe" | "Caribbean";
  dockingMode: "dock" | "tender";
};

const europePorts: Seed[] = [
  { slug: "barcelona", displayName: "Barcelona", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "marseille", displayName: "Marseille", country: "France", region: "Europe", dockingMode: "dock" },
  { slug: "athens-piraeus", displayName: "Athens (Piraeus)", country: "Greece", region: "Europe", dockingMode: "dock" },
  { slug: "santorini", displayName: "Santorini", country: "Greece", region: "Europe", dockingMode: "tender" },
  { slug: "mykonos", displayName: "Mykonos", country: "Greece", region: "Europe", dockingMode: "tender" },
  { slug: "rome-civitavecchia", displayName: "Rome (Civitavecchia)", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "naples", displayName: "Naples", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "lisbon", displayName: "Lisbon", country: "Portugal", region: "Europe", dockingMode: "dock" },
  { slug: "valencia", displayName: "Valencia", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "palma-de-mallorca", displayName: "Palma de Mallorca", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "ibiza", displayName: "Ibiza", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "malaga", displayName: "Malaga", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "cadiz", displayName: "Cadiz", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "seville-cadiz", displayName: "Seville (Cadiz)", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "cartagena-es", displayName: "Cartagena (Spain)", country: "Spain", region: "Europe", dockingMode: "dock" },
  { slug: "genoa", displayName: "Genoa", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "la-spezia", displayName: "La Spezia", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "livorno", displayName: "Livorno", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "venice-trieste", displayName: "Venice (Trieste)", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "dubrovnik", displayName: "Dubrovnik", country: "Croatia", region: "Europe", dockingMode: "dock" },
  { slug: "split", displayName: "Split", country: "Croatia", region: "Europe", dockingMode: "dock" },
  { slug: "kotor", displayName: "Kotor", country: "Montenegro", region: "Europe", dockingMode: "tender" },
  { slug: "corfu", displayName: "Corfu", country: "Greece", region: "Europe", dockingMode: "dock" },
  { slug: "katakolon", displayName: "Katakolon", country: "Greece", region: "Europe", dockingMode: "dock" },
  { slug: "istanbul", displayName: "Istanbul", country: "Turkey", region: "Europe", dockingMode: "dock" },
  { slug: "kusadasi", displayName: "Kusadasi", country: "Turkey", region: "Europe", dockingMode: "dock" },
  { slug: "rhodes", displayName: "Rhodes", country: "Greece", region: "Europe", dockingMode: "dock" },
  { slug: "cephalonia", displayName: "Cephalonia", country: "Greece", region: "Europe", dockingMode: "dock" },
  { slug: "villefranche-nice", displayName: "Villefranche (Nice)", country: "France", region: "Europe", dockingMode: "tender" },
  { slug: "ajaccio", displayName: "Ajaccio", country: "France", region: "Europe", dockingMode: "dock" },
  { slug: "cannes", displayName: "Cannes", country: "France", region: "Europe", dockingMode: "tender" },
  { slug: "palermo", displayName: "Palermo", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "cagliari", displayName: "Cagliari", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "messina", displayName: "Messina", country: "Italy", region: "Europe", dockingMode: "dock" },
  { slug: "heraklion", displayName: "Heraklion", country: "Greece", region: "Europe", dockingMode: "dock" },
  { slug: "chania", displayName: "Chania", country: "Greece", region: "Europe", dockingMode: "tender" },
];

const caribbeanPorts: Seed[] = [
  { slug: "cozumel", displayName: "Cozumel", country: "Mexico", region: "Caribbean", dockingMode: "dock" },
  { slug: "costa-maya", displayName: "Costa Maya", country: "Mexico", region: "Caribbean", dockingMode: "dock" },
  { slug: "belize-city", displayName: "Belize City", country: "Belize", region: "Caribbean", dockingMode: "tender" },
  { slug: "roatan", displayName: "Roatan", country: "Honduras", region: "Caribbean", dockingMode: "dock" },
  { slug: "grand-cayman", displayName: "Grand Cayman", country: "Cayman Islands", region: "Caribbean", dockingMode: "tender" },
  { slug: "jamaica-falmouth", displayName: "Falmouth", country: "Jamaica", region: "Caribbean", dockingMode: "dock" },
  { slug: "jamaica-ocho-rios", displayName: "Ocho Rios", country: "Jamaica", region: "Caribbean", dockingMode: "dock" },
  { slug: "jamaica-montego-bay", displayName: "Montego Bay", country: "Jamaica", region: "Caribbean", dockingMode: "dock" },
  { slug: "nassau", displayName: "Nassau", country: "Bahamas", region: "Caribbean", dockingMode: "dock" },
  { slug: "freeport", displayName: "Freeport", country: "Bahamas", region: "Caribbean", dockingMode: "dock" },
  { slug: "half-moon-cay", displayName: "Half Moon Cay", country: "Bahamas", region: "Caribbean", dockingMode: "tender" },
  { slug: "coco-cay", displayName: "CocoCay", country: "Bahamas", region: "Caribbean", dockingMode: "dock" },
  { slug: "st-thomas", displayName: "St. Thomas", country: "US Virgin Islands", region: "Caribbean", dockingMode: "dock" },
  { slug: "st-maarten", displayName: "St. Maarten", country: "Sint Maarten", region: "Caribbean", dockingMode: "dock" },
  { slug: "san-juan", displayName: "San Juan", country: "Puerto Rico", region: "Caribbean", dockingMode: "dock" },
  { slug: "amber-cove", displayName: "Amber Cove", country: "Dominican Republic", region: "Caribbean", dockingMode: "dock" },
  { slug: "la-romana", displayName: "La Romana", country: "Dominican Republic", region: "Caribbean", dockingMode: "dock" },
  { slug: "aruba-oranjestad", displayName: "Oranjestad", country: "Aruba", region: "Caribbean", dockingMode: "dock" },
  { slug: "curacao-willemstad", displayName: "Willemstad", country: "Curacao", region: "Caribbean", dockingMode: "dock" },
  { slug: "bonaire-kralendijk", displayName: "Kralendijk", country: "Bonaire", region: "Caribbean", dockingMode: "dock" },
  { slug: "st-lucia-castries", displayName: "Castries", country: "St Lucia", region: "Caribbean", dockingMode: "dock" },
  { slug: "barbados-bridgetown", displayName: "Bridgetown", country: "Barbados", region: "Caribbean", dockingMode: "dock" },
  { slug: "grenada-st-george", displayName: "St George's", country: "Grenada", region: "Caribbean", dockingMode: "dock" },
  { slug: "dominica-roseau", displayName: "Roseau", country: "Dominica", region: "Caribbean", dockingMode: "dock" },
  { slug: "antigua-st-johns", displayName: "St John's", country: "Antigua & Barbuda", region: "Caribbean", dockingMode: "dock" },
  { slug: "st-kitts-basseterre", displayName: "Basseterre", country: "St Kitts & Nevis", region: "Caribbean", dockingMode: "dock" },
  { slug: "tortola", displayName: "Tortola", country: "British Virgin Islands", region: "Caribbean", dockingMode: "dock" },
  { slug: "martinique-fort-de-france", displayName: "Fort-de-France", country: "Martinique", region: "Caribbean", dockingMode: "dock" },
  { slug: "guadeloupe-pointe-a-pitre", displayName: "Pointe-a-Pitre", country: "Guadeloupe", region: "Caribbean", dockingMode: "dock" },
  { slug: "st-vincent-kingstown", displayName: "Kingstown", country: "St Vincent", region: "Caribbean", dockingMode: "dock" },
];

const seeds = [...europePorts, ...caribbeanPorts];

const withStops = (slug: string, label: string): ClusterStop[] => [
  { id: `${slug}-a1`, name: `${label} Old Quarter Core`, cluster: "Historic Core", tags: ["culture", "history"], typicalDurationMin: [45, 90], costRangeEUR: [0, 12], distanceFromCorridorKm: 1.2, bestWindow: "09:00-11:30", watchOut: "Tour groups peak after late morning." },
  { id: `${slug}-a2`, name: `${label} Waterfront Walk`, cluster: "Harbor", tags: ["views", "family"], typicalDurationMin: [35, 70], costRangeEUR: [0, 8], distanceFromCorridorKm: 0.8, bestWindow: "10:00-13:00", watchOut: "Sun exposure can be high near midday." },
  { id: `${slug}-a3`, name: `${label} Market + Food Lane`, cluster: "Food District", tags: ["food", "shopping"], typicalDurationMin: [50, 80], costRangeEUR: [12, 35], distanceFromCorridorKm: 1.5, bestWindow: "11:30-14:00", watchOut: "Queue spikes around lunch rush." },
  { id: `${slug}-a4`, name: `${label} Museum Pocket`, cluster: "Museum District", tags: ["culture", "family"], typicalDurationMin: [45, 75], costRangeEUR: [10, 25], distanceFromCorridorKm: 2.4, bestWindow: "13:00-16:00", watchOut: "Timed tickets recommended in high season." },
  { id: `${slug}-a5`, name: `${label} Viewpoint Cluster`, cluster: "Scenic Ridge", tags: ["views", "history"], typicalDurationMin: [40, 65], costRangeEUR: [0, 10], distanceFromCorridorKm: 2.8, bestWindow: "15:00-17:00", watchOut: "Allow downhill return time if running late." },
  { id: `${slug}-a6`, name: `${label} Local Shopping Arc`, cluster: "Retail Streets", tags: ["shopping", "family"], typicalDurationMin: [30, 55], costRangeEUR: [8, 30], distanceFromCorridorKm: 1.3, bestWindow: "10:30-13:30", watchOut: "Watch card-swap scams at crowded kiosks." },
  { id: `${slug}-a7`, name: `${label} Beach/Promenade Block`, cluster: "Shoreline", tags: ["beach", "views"], typicalDurationMin: [45, 80], costRangeEUR: [0, 15], distanceFromCorridorKm: 3.1, bestWindow: "12:00-16:00", watchOut: "Avoid far beach legs after cutoff trigger." },
  { id: `${slug}-a8`, name: `${label} Near-Port Fallback Loop`, cluster: "Return Corridor", tags: ["family", "food"], typicalDurationMin: [30, 50], costRangeEUR: [5, 18], distanceFromCorridorKm: 0.4, bestWindow: "14:30-17:00", watchOut: "Keep this as bailout when delays stack." },
];

const createPort = (seed: Seed): Port => {
  const tenderBias = seed.dockingMode === "tender";
  return {
    slug: seed.slug,
    displayName: seed.displayName,
    country: seed.country,
    region: seed.region,
    dockingMode: seed.dockingMode,
    defaultTimeWindows: {
      gangwayOpen: tenderBias ? "08:30" : "08:00",
      lastOutboundCutoff: tenderBias ? "13:45" : "14:30",
    },
    typicalTransitRisks: tenderBias
      ? ["Tender queue variance 20-45m", "Queue compression after lunch", "Weather-induced tender holds"]
      : ["Taxi rank surges at 09:00", "Traffic wave after 15:00", "Construction detours on central arteries"],
    corridors: [
      { name: "Port Corridor", distanceKmRange: [0.2, 1.2], timeRangeMin: [8, 20], notes: "Fastest fallback route to terminal." },
      { name: "City Core", distanceKmRange: [1.0, 3.5], timeRangeMin: [20, 45], notes: "High density for mixed interests." },
      { name: "Scenic Outer Loop", distanceKmRange: [3.0, 7.5], timeRangeMin: [35, 80], notes: "Use only before outbound cutoff." },
    ],
    transportProfiles: [
      { mode: "walk", reliabilityRank: 1, typicalTimeMin: [10, 40], costRangeEUR: [0, 0], notes: "Best for near-corridor clusters." },
      { mode: "taxi", reliabilityRank: 2, typicalTimeMin: [12, 35], costRangeEUR: [8, 28], notes: "Reliable if pre-booked at peak." },
      { mode: "metro", reliabilityRank: 3, typicalTimeMin: [15, 45], costRangeEUR: [2, 6], notes: "Limited in some port districts." },
      { mode: "bus", reliabilityRank: 4, typicalTimeMin: [20, 55], costRangeEUR: [2, 5], notes: "Higher delay variance at rush periods." },
    ],
    peakCrowdWindows: ["10:30-12:30", "14:30-16:00"],
    trafficWindows: ["09:00-10:00", "15:00-16:30"],
    returnSafeRules: {
      hardRules: [
        "Protect a hard return buffer of at least 45 minutes.",
        `No far outbound leg after ${tenderBias ? "13:45" : "14:30"}.`,
        "Keep final block inside near-port corridor unless risk tolerance is aggressive.",
      ],
      triggers: [
        "If 20 minutes behind by midday, drop one outer-loop cluster.",
        "If transfer delays exceed 25 minutes, switch to fallback loop.",
      ],
    },
    attractionClusters: withStops(seed.slug, seed.displayName),
    weatherFallbacks: [`${seed.displayName} covered market`, `${seed.displayName} maritime museum`, `${seed.displayName} indoor food hall`],
    scamNotes: ["Ignore unsolicited taxi guides outside controlled stands.", "Confirm prices before ordering in high-footfall tourist strips."],
  };
};

export const portsRegistry: Record<string, Port> = Object.fromEntries(seeds.map((seed) => [seed.slug, createPort(seed)]));

// Compatibility export used by older modules.
export const plannerPorts = Object.fromEntries(
  Object.values(portsRegistry).map((port) => [
    port.slug,
    {
      portSlug: port.slug,
      dockType: port.dockingMode,
      typicalTransferToCity: port.transportProfiles.find((t) => t.mode === "taxi")?.typicalTimeMin[0] ?? 20,
      peakTrafficWindows: port.trafficWindows,
      reliabilityRanking: port.transportProfiles
        .sort((a, b) => a.reliabilityRank - b.reliabilityRank)
        .map((t) => t.mode)
        .filter((mode): mode is "walk" | "taxi" | "metro" | "bus" => ["walk", "taxi", "metro", "bus"].includes(mode)),
      recommendedClusters: port.attractionClusters.slice(0, 8).map((stop) => ({
        name: stop.name,
        minutes: stop.typicalDurationMin[0],
        walkingIntensity: stop.distanceFromCorridorKm > 2.5 ? "high" : stop.distanceFromCorridorKm > 1.2 ? "moderate" : "low",
      })),
    },
  ])
) as Record<string, { portSlug: string; dockType: "dock" | "tender"; typicalTransferToCity: number; peakTrafficWindows: string[]; reliabilityRanking: Array<"walk" | "taxi" | "metro" | "bus">; recommendedClusters: Array<{ name: string; minutes: number; walkingIntensity: "low" | "moderate" | "high" }> }>;
