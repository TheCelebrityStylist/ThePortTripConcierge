import { generatePortArticle } from "../lib/content/generatePortArticle";
import { assertMinWordCount, detectDuplicateParagraphsAcrossPorts, detectDuplicateParagraphsWithinArticle } from "../lib/content/contentQuality";
import { publishedPorts } from "./ports/ports";
import type { BlogArticle, BlogCategory } from "./blog-types";

export type * from "./blog-types";

export const blogArticles: BlogArticle[] = publishedPorts.map((port) => generatePortArticle(port));

for (const article of blogArticles) {
  assertMinWordCount(article, 3000);
  detectDuplicateParagraphsWithinArticle(article);
}
detectDuplicateParagraphsAcrossPorts(blogArticles);

export const blogArticleMap = new Map(blogArticles.map((article) => [article.slug, article]));
export const blogCategories = ["Port Guide", "Safety", "Budget", "Strategy"] as const;
export const blogByCategory = (category: BlogCategory) => blogArticles.filter((article) => article.category === category);
