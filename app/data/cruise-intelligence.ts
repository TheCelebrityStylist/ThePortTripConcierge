export type CruiseLine = {
  id: string;
  name: string;
  familyFriendly: boolean;
  luxury: boolean;
};

export type Ship = {
  id: string;
  cruiseLineId: string;
  name: string;
  passengerCapacity: number;
  tenderLikely: boolean;
};

export type PortAttraction = {
  id: string;
  name: string;
  category: "landmark" | "museum" | "beach" | "food" | "experience";
  distanceKm: number;
  transportMethods: string[];
  costRangeEur: [number, number];
  timeRequiredMinutes: number;
  walkingDifficulty: "easy" | "moderate" | "challenging";
};

export type PortIntel = {
  slug: string;
  city: string;
  country: string;
  terminalName: string;
  dockType: "dock" | "tender";
  tenderWaitEstimateMinutes: [number, number];
  crowdByMonth: Record<string, "low" | "medium" | "high">;
  sundayHolidayClosures: string[];
  strikeRisk: "low" | "medium" | "high";
  scamsWarning: string[];
  localFood: string[];
  cafes: string[];
  hiddenGem: string;
  instagramSpot: string;
  quickSnackNearPort: string;
  attractions: PortAttraction[];
};

export type ItineraryStop = {
  id: string;
  title: string;
  startsAt: string;
  durationMinutes: number;
  transport: string;
  costEur: number;
  mapDeepLink: string;
};

export type Itinerary = {
  id: string;
  userId?: string;
  portSlug: string;
  cruiseLine: string;
  shipName: string;
  arrivalTime: string;
  allAboardTime: string;
  mustReturnBy: string;
  returnRisk: "Low" | "Medium" | "High";
  timeline: ItineraryStop[];
  estimatedTotalCostEur: number;
  excursionAlternativeCostEur: number;
};

export type BlogPost = {
  slug: string;
  title: string;
  category:
    | "Cruise Port Guides"
    | "Cruise Money Saving"
    | "First Time Cruise Tips"
    | "Cruise Safety"
    | "DIY vs Ship Excursions"
    | "Cruise Packing"
    | "Cruise Food Guides";
  description: string;
  heroKeywords: string[];
  sections: { heading: string; body: string }[];
};

export const cruiseLines: CruiseLine[] = [
  { id: "rcl", name: "Royal Caribbean", familyFriendly: true, luxury: false },
  { id: "ncl", name: "Norwegian Cruise Line", familyFriendly: true, luxury: false },
  { id: "celebrity", name: "Celebrity Cruises", familyFriendly: false, luxury: true },
];

export const ships: Ship[] = [
  { id: "icon-of-the-seas", cruiseLineId: "rcl", name: "Icon of the Seas", passengerCapacity: 7600, tenderLikely: false },
  { id: "norwegian-prima", cruiseLineId: "ncl", name: "Norwegian Prima", passengerCapacity: 3215, tenderLikely: false },
  { id: "celebrity-ascent", cruiseLineId: "celebrity", name: "Celebrity Ascent", passengerCapacity: 3260, tenderLikely: false },
];

export const portIntelligence: PortIntel[] = [
  {
    slug: "barcelona",
    city: "Barcelona",
    country: "Spain",
    terminalName: "Adossat Cruise Terminal",
    dockType: "dock",
    tenderWaitEstimateMinutes: [0, 0],
    crowdByMonth: { jan: "low", apr: "medium", jun: "high", aug: "high", oct: "medium" },
    sundayHolidayClosures: ["Many small shops close on Sundays", "Some museums have reduced hours on local holidays"],
    strikeRisk: "medium",
    scamsWarning: ["Pickpocketing on La Rambla", "Unofficial taxi solicitation at transport hubs"],
    localFood: ["Pan con tomate", "Bombas", "Fideuà"],
    cafes: ["Satan’s Coffee Corner", "Nomad Coffee Lab"],
    hiddenGem: "Bunkers del Carmel viewpoint at sunrise",
    instagramSpot: "Passeig de Colom waterfront promenade",
    quickSnackNearPort: "Fresh bocadillo at Maremagnum food hall",
    attractions: [
      { id: "sagrada", name: "Sagrada Família", category: "landmark", distanceKm: 6.2, transportMethods: ["taxi", "metro"], costRangeEur: [26, 40], timeRequiredMinutes: 120, walkingDifficulty: "easy" },
      { id: "gothic", name: "Gothic Quarter", category: "experience", distanceKm: 2.7, transportMethods: ["shuttle", "walk", "taxi"], costRangeEur: [0, 20], timeRequiredMinutes: 90, walkingDifficulty: "moderate" },
      { id: "boqueria", name: "La Boqueria", category: "food", distanceKm: 3.1, transportMethods: ["metro", "taxi"], costRangeEur: [8, 25], timeRequiredMinutes: 45, walkingDifficulty: "easy" },
    ],
  },
  {
    slug: "naples",
    city: "Naples",
    country: "Italy",
    terminalName: "Stazione Marittima",
    dockType: "dock",
    tenderWaitEstimateMinutes: [0, 0],
    crowdByMonth: { jan: "low", may: "high", jul: "high", sep: "high", nov: "medium" },
    sundayHolidayClosures: ["Many family-owned restaurants close Sunday evening"],
    strikeRisk: "high",
    scamsWarning: ["Overpriced transfer offers near port gate", "Taxi meter bypass attempts"],
    localFood: ["Pizza Margherita", "Sfogliatella", "Frittatina"],
    cafes: ["Gran Caffè Gambrinus", "Mexico Caffè"],
    hiddenGem: "Quartieri Spagnoli mural lanes",
    instagramSpot: "Castel dell'Ovo seafront",
    quickSnackNearPort: "Taralli from kiosk near Municipio",
    attractions: [
      { id: "spaccanapoli", name: "Spaccanapoli", category: "experience", distanceKm: 1.8, transportMethods: ["walk", "taxi"], costRangeEur: [0, 10], timeRequiredMinutes: 90, walkingDifficulty: "moderate" },
      { id: "pompeii", name: "Pompeii Ruins", category: "landmark", distanceKm: 26, transportMethods: ["train", "private transfer"], costRangeEur: [20, 75], timeRequiredMinutes: 240, walkingDifficulty: "challenging" },
      { id: "toledo", name: "Via Toledo", category: "food", distanceKm: 1.3, transportMethods: ["walk"], costRangeEur: [5, 40], timeRequiredMinutes: 75, walkingDifficulty: "easy" },
    ],
  },
  {
    slug: "santorini",
    city: "Santorini",
    country: "Greece",
    terminalName: "Skala Tender Pier",
    dockType: "tender",
    tenderWaitEstimateMinutes: [20, 70],
    crowdByMonth: { jan: "low", may: "medium", jun: "high", jul: "high", sep: "high" },
    sundayHolidayClosures: ["Select wineries close Sundays in shoulder season"],
    strikeRisk: "medium",
    scamsWarning: ["Long queue mule transport upsells", "Last-minute ATV rental markups"],
    localFood: ["Tomatokeftedes", "Fava Santorinis", "White eggplant dishes"],
    cafes: ["PK Cocktail Bar Café", "Galini Café"],
    hiddenGem: "Pyrgos village sunset lanes",
    instagramSpot: "Three Bells of Fira viewpoint",
    quickSnackNearPort: "Spinach pie by cable car station",
    attractions: [
      { id: "oia", name: "Oia Village", category: "landmark", distanceKm: 11.5, transportMethods: ["bus", "taxi"], costRangeEur: [2, 45], timeRequiredMinutes: 180, walkingDifficulty: "moderate" },
      { id: "fira", name: "Fira old town", category: "experience", distanceKm: 0.5, transportMethods: ["walk", "cable car"], costRangeEur: [6, 25], timeRequiredMinutes: 120, walkingDifficulty: "moderate" },
      { id: "winery", name: "Santo Wines", category: "food", distanceKm: 5.4, transportMethods: ["taxi", "bus"], costRangeEur: [20, 60], timeRequiredMinutes: 120, walkingDifficulty: "easy" },
    ],
  },
];

export const blogSeedPrompts = [
  "10 Ways To Save €500 On Cruise Excursions",
  "How To Explore Rome From Civitavecchia Without A Tour",
  "The Biggest Cruise Port Mistakes Travelers Make",
  "How Much Time Do You REALLY Have In Port?",
  "Best Carry-On Packing List For Port Days",
  "Is It Safer To Book Cruise Excursions Or DIY?",
  "Barcelona Port Day Food Guide For Cruise Travelers",
  "First Cruise? 17 Port Day Moves That Reduce Stress",
  "How To Avoid Missing Your Cruise Ship In Rome",
  "Naples Cruise Port Walkability Guide",
  "Santorini Tender Survival Playbook",
  "Kid-Friendly Cruise Port Activities That Actually Work",
  "Senior-Friendly Shore Day Planning Framework",
  "How To Compare Ship Tour Pricing In 5 Minutes",
  "The Cruise Budget Stack: Food, Transit, Tickets, Buffer"
];
