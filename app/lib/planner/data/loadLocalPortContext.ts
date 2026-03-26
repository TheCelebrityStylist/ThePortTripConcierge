import { portsRegistry } from "@/app/lib/ports";
import cruiseDb from "@/app/data/cruise-db.json";
import { blogPosts } from "@/app/data/blog";
import rawPortGuides from "@/app/data/ports.json";

export type LocalPortContext = {
  slug: string;
  portName: string;
  clusters: string[];
  corridors: string[];
  fallbackLoops: string[];
  transitNotes: string[];
  constraints: string[];
  practicalNotes: string[];
  guideSnippets: string[];
};

export function loadLocalPortContext(portSlug: string): LocalPortContext {
  const port = portsRegistry[portSlug] ?? portsRegistry.barcelona;
  const dbPort = (cruiseDb.ports || []).find((row) => row.slug === portSlug || row.name.toLowerCase().includes(port.name.toLowerCase())) ?? null;
  const blogRows = blogPosts.filter((post) => post.slug.includes(portSlug.split("-")[0]) || post.title.toLowerCase().includes(port.name.toLowerCase())).slice(0, 2);
  const guideRow = Object.values(rawPortGuides as Record<string, { meta?: { port_name?: string }; food?: string; safety_notes?: string; customs_notes?: string }>).find((row) => row.meta?.port_name?.toLowerCase() === port.name.toLowerCase());

  return {
    slug: port.slug,
    portName: port.name,
    clusters: port.attractionClusters.slice(0, 6).map((cluster) => cluster.name),
    corridors: port.corridorZones.slice(0, 3).map((zone) => zone.name),
    fallbackLoops: port.attractionClusters.filter((cluster) => /fallback|near-port|old town|waterfront/i.test(cluster.name)).map((cluster) => cluster.name).slice(0, 3),
    transitNotes: port.typicalTransitRisks.slice(0, 4),
    constraints: [...port.safeReturnRules.slice(0, 3), ...(dbPort?.high_risk_traffic_hours || []).map((window: string) => `Traffic spike ${window}`)],
    practicalNotes: [guideRow?.safety_notes, guideRow?.customs_notes, guideRow?.food].filter(Boolean).map((text) => String(text).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 3),
    guideSnippets: blogRows.map((post) => `${post.title}: ${post.description}`),
  };
}
