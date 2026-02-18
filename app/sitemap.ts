import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "./data/blog-cms";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://porttrip.com";
  const mainPages = ["/", "/chat", "/ports", "/blog", "/planner"] as const;

  const mainEntries: MetadataRoute.Sitemap = mainPages.map((path, index) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: index === 0 ? "weekly" : "monthly",
    priority: index === 0 ? 1 : 0.8
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.7
  }));

  return [...mainEntries, ...blogEntries];
}
