import type { PortProfile } from "../types";

const t = (id: string, title: string, category: "anchor" | "food" | "scenic" | "museum" | "shopping" | "beach" | "transfer", durationMin: number, walkMin: number, costEUR: number, crowd: "low" | "medium" | "high", tags: string[], indoor = false, nearPort = false) => ({ id, title, category, durationMin, walkMin, costEUR, crowd, tags, indoor, nearPort });

export const portProfiles: Record<string, PortProfile> = {
  barcelona: {
    slug: "barcelona", name: "Barcelona", tender: false, peakTrafficWindows: ["11:00-13:30", "15:00-16:30"], transferToCityMin: 25,
    anchors: [t("b-gothic", "Gothic Quarter lanes", "anchor", 85, 25, 0, "medium", ["culture"]), t("b-sagrada", "Sagrada perimeter loop", "anchor", 70, 12, 18, "high", ["culture"]), t("b-born", "El Born craft streets", "anchor", 60, 18, 0, "medium", ["culture", "shopping"])],
    foodAnchors: [t("b-boq", "La Boqueria tasting run", "food", 55, 10, 24, "high", ["food"]), t("b-borneat", "Born bistro lunch", "food", 65, 8, 30, "medium", ["food"], true)],
    scenicBlocks: [t("b-barce", "Barceloneta waterfront", "scenic", 50, 12, 8, "medium", ["views"]), t("b-portvell", "Port Vell photo sweep", "scenic", 45, 10, 0, "low", ["views"], false, true)],
    transferBlocks: [t("b-metro", "Metro hop between clusters", "transfer", 20, 5, 3, "medium", ["transfer"]), t("b-taxi", "Taxi transfer", "transfer", 18, 3, 14, "low", ["transfer"])],
    fallbackLoop: [t("b-fallback", "Terminal-side old port fallback", "scenic", 50, 8, 10, "low", ["views"], false, true)],
  },
  marseille: {
    slug: "marseille", name: "Marseille", tender: false, peakTrafficWindows: ["10:30-12:00", "15:30-16:30"], transferToCityMin: 30,
    anchors: [t("m-vieux", "Vieux-Port promenade", "anchor", 80, 16, 0, "medium", ["views"]), t("m-panier", "Le Panier alleys", "anchor", 70, 24, 0, "high", ["culture"]), t("m-mucem", "MuCEM terrace and harbor edge", "museum", 60, 12, 11, "medium", ["culture"], true)],
    foodAnchors: [t("m-noailles", "Noailles market lunch", "food", 55, 8, 22, "high", ["food"]), t("m-harbor", "Harbor seafood stop", "food", 60, 7, 29, "medium", ["food"], true)],
    scenicBlocks: [t("m-corniche", "Corniche viewpoints", "scenic", 65, 14, 12, "medium", ["views"]), t("m-cathedral", "Major Cathedral exterior", "scenic", 40, 8, 0, "low", ["views"], false, true)],
    transferBlocks: [t("m-metro", "Metro + walk transfer", "transfer", 22, 7, 4, "medium", ["transfer"]), t("m-taxi", "Taxi transfer", "transfer", 16, 3, 15, "low", ["transfer"])],
    fallbackLoop: [t("m-fallback", "Vieux-Port short loop", "scenic", 45, 8, 8, "low", ["views"], false, true)],
  },
  "athens-piraeus": {
    slug: "athens-piraeus", name: "Athens (Piraeus)", tender: false, peakTrafficWindows: ["08:30-10:00", "16:00-17:00"], transferToCityMin: 35,
    anchors: [t("a-acro", "Acropolis foothill circuit", "anchor", 90, 28, 20, "high", ["culture"]), t("a-plaka", "Plaka lane walk", "anchor", 70, 18, 0, "medium", ["culture", "shopping"]), t("a-monast", "Monastiraki square & market", "shopping", 55, 12, 10, "medium", ["shopping"])],
    foodAnchors: [t("a-psyrri", "Psyrri lunch tables", "food", 60, 8, 26, "medium", ["food"], true), t("a-garden", "Syntagma garden cafe", "food", 50, 6, 20, "low", ["food"], true)],
    scenicBlocks: [t("a-agora", "Ancient Agora edge", "scenic", 55, 10, 12, "medium", ["views"]), t("a-piraeus", "Piraeus waterfront reset", "scenic", 45, 8, 0, "low", ["views"], false, true)],
    transferBlocks: [t("a-metro", "Metro transfer", "transfer", 24, 8, 5, "medium", ["transfer"]), t("a-taxi", "Taxi transfer", "transfer", 20, 3, 17, "low", ["transfer"])],
    fallbackLoop: [t("a-fallback", "Piraeus marina loop", "scenic", 50, 9, 8, "low", ["views"], false, true)],
  },
  santorini: {
    slug: "santorini", name: "Santorini", tender: true, peakTrafficWindows: ["08:00-10:30", "14:00-16:00"], transferToCityMin: 45,
    anchors: [t("s-fira", "Fira caldera walk", "anchor", 75, 26, 0, "high", ["views"]), t("s-imero", "Imerovigli outlook", "scenic", 60, 18, 14, "medium", ["views"]), t("s-pyrgos", "Pyrgos village lanes", "anchor", 65, 16, 12, "medium", ["culture"])],
    foodAnchors: [t("s-firalunch", "Fira terrace lunch", "food", 60, 8, 32, "high", ["food"], true), t("s-tasting", "Indoor tasting room", "food", 50, 5, 28, "low", ["food"], true)],
    scenicBlocks: [t("s-photo", "Caldera photo block", "scenic", 50, 14, 0, "medium", ["views"]), t("s-cable", "Cable car corridor buffer", "scenic", 40, 8, 0, "high", ["views"], false, true)],
    transferBlocks: [t("s-shuttle", "Island shuttle transfer", "transfer", 28, 5, 8, "medium", ["transfer"]), t("s-taxi", "Taxi transfer", "transfer", 22, 3, 24, "low", ["transfer"])],
    fallbackLoop: [t("s-fallback", "Fira near-lift fallback", "scenic", 45, 8, 10, "low", ["views"], false, true)],
  },
  mykonos: {
    slug: "mykonos", name: "Mykonos", tender: true, peakTrafficWindows: ["09:00-11:00", "15:00-16:30"], transferToCityMin: 30,
    anchors: [t("mk-old", "Mykonos old town lanes", "anchor", 70, 18, 0, "medium", ["culture"]), t("mk-wind", "Windmills + Little Venice", "scenic", 60, 16, 0, "high", ["views"]), t("mk-ano", "Ano Mera detour", "anchor", 65, 14, 14, "medium", ["culture"])],
    foodAnchors: [t("mk-harborfood", "Harbor meze lunch", "food", 55, 7, 27, "medium", ["food"], true), t("mk-market", "Market snack block", "food", 45, 6, 18, "low", ["food"], true)],
    scenicBlocks: [t("mk-alleys", "Photo alley circuit", "scenic", 55, 12, 0, "medium", ["views"]), t("mk-tender", "Tender queue corridor", "scenic", 40, 8, 0, "high", ["views"], false, true)],
    transferBlocks: [t("mk-bus", "Bus transfer", "transfer", 24, 6, 3, "medium", ["transfer"]), t("mk-watertaxi", "Water taxi transfer", "transfer", 20, 4, 9, "low", ["transfer"])],
    fallbackLoop: [t("mk-fallback", "Harbor old port fallback", "scenic", 45, 8, 9, "low", ["views"], false, true)],
  },
};
