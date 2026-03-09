import { portsRegistry } from "@/app/lib/ports";
import cruiseDb from "@/app/data/cruise-db.json";
import { blogPosts } from "@/app/data/blog";

export type LocalPortContext = {
  slug: string;
  portName: string;
  clusters: string[];
  fallbackLoops: string[];
  transitNotes: string[];
  constraints: string[];
  guideSnippets: string[];
};

export function loadLocalPortContext(portSlug: string): LocalPortContext {
  const port = portsRegistry[portSlug] ?? portsRegistry.barcelona;
  const dbPort = (cruiseDb.ports || []).find((row) => row.slug === portSlug || row.name.toLowerCase().includes(port.name.toLowerCase())) ?? null;
  const blogRows = blogPosts.filter((post) => post.slug.includes(portSlug.split("-")[0]) || post.title.toLowerCase().includes(port.name.toLowerCase())).slice(0, 2);
  return {
    slug: port.slug,
    portName: port.name,
    clusters: port.attractionClusters.slice(0, 6).map((cluster) => cluster.name),
    fallbackLoops: port.attractionClusters.filter((cluster) => /fallback|near-port|old town/i.test(cluster.name)).map((cluster) => cluster.name).slice(0, 3),
    transitNotes: port.typicalTransitRisks.slice(0, 3),
    constraints: [...port.safeReturnRules.slice(0, 3), ...(dbPort?.high_risk_traffic_hours || []).map((window: string) => `Traffic spike ${window}`)],
    guideSnippets: blogRows.map((post) => `${post.title}: ${post.description}`),
  };
}
