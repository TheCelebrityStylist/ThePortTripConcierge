import { buildPort } from "./base";

const seeds = [
  ["barcelona", "Barcelona", "Spain", "dock"], ["marseille", "Marseille", "France", "dock"], ["athens-piraeus", "Athens (Piraeus)", "Greece", "dock"],
  ["santorini", "Santorini", "Greece", "tender"], ["mykonos", "Mykonos", "Greece", "tender"], ["rome-civitavecchia", "Rome (Civitavecchia)", "Italy", "dock"],
  ["naples", "Naples", "Italy", "dock"], ["lisbon", "Lisbon", "Portugal", "dock"], ["valencia", "Valencia", "Spain", "dock"],
  ["palma-de-mallorca", "Palma de Mallorca", "Spain", "dock"], ["ibiza", "Ibiza", "Spain", "dock"], ["malaga", "Malaga", "Spain", "dock"],
  ["cadiz", "Cadiz", "Spain", "dock"], ["genoa", "Genoa", "Italy", "dock"], ["la-spezia", "La Spezia", "Italy", "dock"],
  ["livorno", "Livorno", "Italy", "dock"], ["venice-trieste", "Venice (Trieste)", "Italy", "dock"], ["dubrovnik", "Dubrovnik", "Croatia", "dock"],
  ["split", "Split", "Croatia", "dock"], ["kotor", "Kotor", "Montenegro", "tender"], ["corfu", "Corfu", "Greece", "dock"],
  ["katakolon", "Katakolon", "Greece", "dock"], ["istanbul", "Istanbul", "Turkey", "dock"], ["kusadasi", "Kusadasi", "Turkey", "dock"],
  ["rhodes", "Rhodes", "Greece", "dock"], ["cephalonia", "Cephalonia", "Greece", "dock"], ["villefranche-nice", "Villefranche (Nice)", "France", "tender"],
  ["ajaccio", "Ajaccio", "France", "dock"], ["cannes", "Cannes", "France", "tender"], ["palermo", "Palermo", "Italy", "dock"],
  ["cagliari", "Cagliari", "Italy", "dock"], ["messina", "Messina", "Italy", "dock"], ["heraklion", "Heraklion", "Greece", "dock"], ["chania", "Chania", "Greece", "tender"],
] as const;

export const europePorts = seeds.map(([slug, name, country, dockingModeDefault]) => buildPort({ slug, name, country, region: "Europe", dockingModeDefault }));
