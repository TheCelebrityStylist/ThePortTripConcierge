import type { BlogArticle } from "../../data/blog-types";

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

export function articleWordCount(article: BlogArticle): number {
  const blocks = article.contentBlocks.flatMap((b) => [...b.lede, ...b.body, ...(b.bullets ?? []), b.callout?.text ?? "", b.localTip ?? ""]);
  const faq = article.faq.flatMap((f) => [f.q, f.a]);
  const links = article.internalLinks.map((l) => `${l.title} ${l.anchorText}`);
  const totalText = [article.title, article.subtitle, article.excerpt, ...blocks, ...faq, ...links].join(" ");
  return words(totalText);
}

export function assertMinWordCount(article: BlogArticle, minWords: number) {
  const wc = articleWordCount(article);
  if (wc < minWords) {
    throw new Error(`Article '${article.slug}' only has ${wc} words; minimum is ${minWords}.`);
  }
}

const normalize = (p: string) => p.replace(/\s+/g, " ").trim();

export function detectDuplicateParagraphsWithinArticle(article: BlogArticle) {
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  const paras = article.contentBlocks.flatMap((b) => [...b.lede, ...b.body]);
  paras.forEach((p, idx) => {
    const n = normalize(p);
    if (seen.has(n)) duplicates.push(`paragraph ${idx + 1} duplicates paragraph ${seen.get(n)! + 1}`);
    seen.set(n, idx);
  });
  if (duplicates.length) {
    throw new Error(`Within-article duplicate paragraphs found in '${article.slug}': ${duplicates.join(", ")}`);
  }
}

export function detectDuplicateParagraphsAcrossPorts(articles: BlogArticle[]) {
  const global = new Map<string, { slug: string; index: number }>();
  const issues: string[] = [];
  for (const article of articles) {
    const paras = article.contentBlocks.flatMap((b) => [...b.lede, ...b.body]).map(normalize);
    paras.forEach((p, i) => {
      const found = global.get(p);
      if (found && found.slug !== article.slug) {
        issues.push(`'${article.slug}' paragraph ${i + 1} duplicates '${found.slug}' paragraph ${found.index + 1}`);
      } else {
        global.set(p, { slug: article.slug, index: i });
      }
    });
  }
  if (issues.length) {
    throw new Error(`Cross-port duplicate paragraphs found:\n${issues.join("\n")}`);
  }
}
