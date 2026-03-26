import { buildPort } from "./base";

const seeds = [
  ["singapore", "Singapore", "Singapore", "dock"], ["hong-kong", "Hong Kong", "China", "dock"], ["tokyo-yokohama", "Tokyo (Yokohama)", "Japan", "dock"],
  ["osaka-kobe", "Osaka (Kobe)", "Japan", "dock"], ["kyoto-osaka", "Kyoto (Osaka)", "Japan", "dock"], ["nagasaki", "Nagasaki", "Japan", "dock"],
  ["busan", "Busan", "South Korea", "dock"], ["incheon-seoul", "Incheon (Seoul)", "South Korea", "dock"], ["taipei-keelung", "Taipei (Keelung)", "Taiwan", "dock"],
  ["phuket", "Phuket", "Thailand", "tender"], ["bangkok-laem-chabang", "Bangkok (Laem Chabang)", "Thailand", "dock"], ["ho-chi-minh", "Ho Chi Minh City", "Vietnam", "dock"],
  ["da-nang", "Da Nang", "Vietnam", "dock"], ["halong-bay", "Ha Long Bay", "Vietnam", "tender"], ["manila", "Manila", "Philippines", "dock"],
  ["cebu", "Cebu", "Philippines", "dock"], ["kota-kinabalu", "Kota Kinabalu", "Malaysia", "dock"], ["penang", "Penang", "Malaysia", "dock"],
  ["langkawi", "Langkawi", "Malaysia", "dock"], ["bali-benoa", "Bali (Benoa)", "Indonesia", "dock"], ["jakarta", "Jakarta", "Indonesia", "dock"],
  ["surabaya", "Surabaya", "Indonesia", "dock"], ["colombo", "Colombo", "Sri Lanka", "dock"], ["mumbai", "Mumbai", "India", "dock"],
] as const;

export const asiaPorts = seeds.map(([slug, name, country, dockingModeDefault]) => buildPort({ slug, name, country, region: "Asia", dockingModeDefault }));
