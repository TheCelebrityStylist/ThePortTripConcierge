export type PortCluster = {
  name: string;
  minutes: number;
  walkingIntensity: "low" | "moderate" | "high";
};

export type PlannerPortData = {
  portSlug: string;
  dockType: "dock" | "tender";
  typicalTransferToCity: number;
  peakTrafficWindows: string[];
  reliabilityRanking: Array<"walk" | "taxi" | "metro" | "bus">;
  recommendedClusters: PortCluster[];
};

export const plannerPorts: Record<string, PlannerPortData> = {
  barcelona: {
    portSlug: "barcelona",
    dockType: "dock",
    typicalTransferToCity: 25,
    peakTrafficWindows: ["11:00-13:30", "15:00-16:30"],
    reliabilityRanking: ["walk", "metro", "taxi", "bus"],
    recommendedClusters: [
      { name: "Gothic Quarter core", minutes: 90, walkingIntensity: "moderate" },
      { name: "El Born lanes", minutes: 60, walkingIntensity: "moderate" },
      { name: "Sagrada perimeter", minutes: 70, walkingIntensity: "low" },
      { name: "Barceloneta waterfront", minutes: 55, walkingIntensity: "low" },
      { name: "Passeig de Gràcia", minutes: 50, walkingIntensity: "low" },
      { name: "Port Vell", minutes: 45, walkingIntensity: "low" },
      { name: "Montjuïc edge", minutes: 80, walkingIntensity: "high" },
      { name: "Market + café corridor", minutes: 50, walkingIntensity: "low" },
    ],
  },
  marseille: {
    portSlug: "marseille",
    dockType: "dock",
    typicalTransferToCity: 30,
    peakTrafficWindows: ["10:30-12:00", "15:30-16:30"],
    reliabilityRanking: ["taxi", "metro", "bus", "walk"],
    recommendedClusters: [
      { name: "Vieux-Port circuit", minutes: 80, walkingIntensity: "low" },
      { name: "Le Panier", minutes: 70, walkingIntensity: "high" },
      { name: "MuCEM exterior", minutes: 60, walkingIntensity: "low" },
      { name: "Major cathedral edge", minutes: 45, walkingIntensity: "low" },
      { name: "Noailles market", minutes: 50, walkingIntensity: "moderate" },
      { name: "Corniche viewpoints", minutes: 75, walkingIntensity: "moderate" },
      { name: "Cours Julien", minutes: 55, walkingIntensity: "moderate" },
      { name: "Harbor cafés", minutes: 45, walkingIntensity: "low" },
    ],
  },
  "athens-piraeus": {
    portSlug: "athens-piraeus",
    dockType: "dock",
    typicalTransferToCity: 35,
    peakTrafficWindows: ["08:30-10:00", "16:00-17:00"],
    reliabilityRanking: ["taxi", "metro", "bus", "walk"],
    recommendedClusters: [
      { name: "Acropolis perimeter", minutes: 90, walkingIntensity: "high" },
      { name: "Plaka lanes", minutes: 70, walkingIntensity: "moderate" },
      { name: "Monastiraki", minutes: 55, walkingIntensity: "low" },
      { name: "Syntagma + Garden", minutes: 60, walkingIntensity: "low" },
      { name: "Agora edge", minutes: 65, walkingIntensity: "moderate" },
      { name: "Psyrri food pockets", minutes: 50, walkingIntensity: "moderate" },
      { name: "Piraeus waterfront", minutes: 45, walkingIntensity: "low" },
      { name: "Museum corridor", minutes: 70, walkingIntensity: "low" },
    ],
  },
  santorini: {
    portSlug: "santorini",
    dockType: "tender",
    typicalTransferToCity: 45,
    peakTrafficWindows: ["08:00-10:30", "14:00-16:00"],
    reliabilityRanking: ["walk", "taxi", "bus", "metro"],
    recommendedClusters: [
      { name: "Fira core", minutes: 80, walkingIntensity: "high" },
      { name: "Caldera rim", minutes: 75, walkingIntensity: "high" },
      { name: "Imerovigli views", minutes: 60, walkingIntensity: "moderate" },
      { name: "Pyrgos village", minutes: 70, walkingIntensity: "moderate" },
      { name: "Indoor tasting stop", minutes: 50, walkingIntensity: "low" },
      { name: "Tender return corridor", minutes: 40, walkingIntensity: "low" },
      { name: "Fira lunch block", minutes: 55, walkingIntensity: "low" },
      { name: "Single-village photo loop", minutes: 60, walkingIntensity: "moderate" },
    ],
  },
  mykonos: {
    portSlug: "mykonos",
    dockType: "tender",
    typicalTransferToCity: 30,
    peakTrafficWindows: ["09:00-11:00", "15:00-16:30"],
    reliabilityRanking: ["walk", "taxi", "bus", "metro"],
    recommendedClusters: [
      { name: "Old town lanes", minutes: 75, walkingIntensity: "moderate" },
      { name: "Windmills + Little Venice", minutes: 65, walkingIntensity: "moderate" },
      { name: "Harbor edge", minutes: 45, walkingIntensity: "low" },
      { name: "Market + café", minutes: 50, walkingIntensity: "low" },
      { name: "Single beach leg", minutes: 90, walkingIntensity: "low" },
      { name: "Ano Mera detour", minutes: 70, walkingIntensity: "moderate" },
      { name: "Photo alleys", minutes: 60, walkingIntensity: "moderate" },
      { name: "Tender queue corridor", minutes: 40, walkingIntensity: "low" },
    ],
  },
};
