import { buildPort } from "./base";

const seeds = [
  ["cozumel", "Cozumel", "Mexico", "dock"], ["costa-maya", "Costa Maya", "Mexico", "dock"], ["belize-city", "Belize City", "Belize", "tender"],
  ["roatan", "Roatan", "Honduras", "dock"], ["grand-cayman", "Grand Cayman", "Cayman Islands", "tender"], ["jamaica-falmouth", "Falmouth", "Jamaica", "dock"],
  ["jamaica-ocho-rios", "Ocho Rios", "Jamaica", "dock"], ["jamaica-montego-bay", "Montego Bay", "Jamaica", "dock"], ["nassau", "Nassau", "Bahamas", "dock"],
  ["freeport", "Freeport", "Bahamas", "dock"], ["half-moon-cay", "Half Moon Cay", "Bahamas", "tender"], ["coco-cay", "CocoCay", "Bahamas", "dock"],
  ["st-thomas", "St. Thomas", "US Virgin Islands", "dock"], ["st-maarten", "St. Maarten", "Sint Maarten", "dock"], ["san-juan", "San Juan", "Puerto Rico", "dock"],
  ["amber-cove", "Amber Cove", "Dominican Republic", "dock"], ["la-romana", "La Romana", "Dominican Republic", "dock"], ["aruba-oranjestad", "Oranjestad", "Aruba", "dock"],
  ["curacao-willemstad", "Willemstad", "Curacao", "dock"], ["bonaire-kralendijk", "Kralendijk", "Bonaire", "dock"], ["st-lucia-castries", "Castries", "St Lucia", "dock"],
  ["barbados-bridgetown", "Bridgetown", "Barbados", "dock"], ["grenada-st-george", "St George's", "Grenada", "dock"], ["dominica-roseau", "Roseau", "Dominica", "dock"],
  ["antigua-st-johns", "St John's", "Antigua & Barbuda", "dock"], ["st-kitts-basseterre", "Basseterre", "St Kitts & Nevis", "dock"], ["tortola", "Tortola", "British Virgin Islands", "dock"],
  ["martinique-fort-de-france", "Fort-de-France", "Martinique", "dock"], ["guadeloupe-pointe-a-pitre", "Pointe-a-Pitre", "Guadeloupe", "dock"], ["st-vincent-kingstown", "Kingstown", "St Vincent", "dock"],
] as const;

export const caribbeanPorts = seeds.map(([slug, name, country, dockingModeDefault]) => buildPort({ slug, name, country, region: "Caribbean", dockingModeDefault }));
