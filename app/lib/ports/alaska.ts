import { buildPort } from "./base";

const seeds = [
  ["juneau", "Juneau", "USA", "dock"], ["ketchikan", "Ketchikan", "USA", "dock"], ["skagway", "Skagway", "USA", "dock"],
  ["sitka", "Sitka", "USA", "dock"], ["icy-strait-point", "Icy Strait Point", "USA", "dock"], ["victoria-bc", "Victoria", "Canada", "dock"],
  ["seward", "Seward", "USA", "dock"], ["whittier", "Whittier", "USA", "dock"], ["haines", "Haines", "USA", "dock"],
  ["wrangell", "Wrangell", "USA", "dock"], ["prince-rupert", "Prince Rupert", "Canada", "dock"], ["glacier-bay", "Glacier Bay", "USA", "tender"],
  ["hubbard-glacier", "Hubbard Glacier", "USA", "tender"], ["tracy-arm", "Tracy Arm", "USA", "tender"], ["valdez", "Valdez", "USA", "dock"],
  ["kodiak", "Kodiak", "USA", "dock"], ["dutch-harbor", "Dutch Harbor", "USA", "dock"], ["nome", "Nome", "USA", "dock"],
] as const;

export const alaskaPorts = seeds.map(([slug, name, country, dockingModeDefault]) => buildPort({ slug, name, country, region: "Alaska", dockingModeDefault }));
