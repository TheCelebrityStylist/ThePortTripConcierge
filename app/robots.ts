import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/port/", "/blog/", "/cruise-questions/"],
      disallow: ["/api/", "/legal/"],
    },
    sitemap: "https://porttrip.com/sitemap.xml",
    host: "https://porttrip.com",
  };
}
