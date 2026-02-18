import type { MetadataRoute } from "next";
import { blogArticles } from "./data/blog-cms";
import { seoPorts } from "./data/seo-ports";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://porttrip.com";
  const staticRoutes: MetadataRoute.Sitemap = ["", "/plan", "/chat", "/ports", "/blog", "/login", "/signup", "/dashboard"].map((path, i) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: i === 0 ? 1 : 0.8,
  }));

  const portRoutes = seoPorts.flatMap((p) => [
    {
      url: `${base}/port/${p.slug}-cruise-port-guide`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
    },
    ...p.longTailPages.map((slug) => ({
      url: `${base}/cruise-questions/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ]);

  const blogRoutes = blogArticles.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...portRoutes, ...blogRoutes];
}
