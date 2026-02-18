# PortTrip SEO Domination Deliverables

## Updated blog file structure
- `app/blog/layout.tsx` — hub-level metadata + OG/Twitter
- `app/blog/page.tsx` — Cruise Intelligence Library hub (filters, search, featured section, sticky planner CTA)
- `app/blog/[slug]/page.tsx` — long-form article renderer with metadata + schema + related-link injection
- `app/data/blog-cms.ts` — 15 high-intent long-form guides (3,000+ words each)

## One fully written 3,000+ word article example
- Example slug: `rome-cruise-port-guide-civitavecchia-diy-one-day`
- Includes: 6 H2 sections, 12+ H3 subtopics, FAQ section, planner CTA, related guides, transport/risk/budget guidance.

## Schema injection example
Implemented on article pages:
- Article schema (`@type: Article`) with headline, author org, publisher org, dates, image.
- FAQPage schema from article FAQ list.
- BreadcrumbList schema for Home → Library → Article.

## Metadata implementation example
Per article `generateMetadata` now emits:
- title
- description
- keywords
- OpenGraph (`og:title`, `og:description`, `og:image`, `og:type=article`)
- Twitter card (`summary_large_image`)

## Sitemap generation logic
`app/sitemap.ts` composes:
- static app routes
- port guide routes
- cruise question routes
- all blog article routes from `blog-cms.ts`

## Stripe / auth confirmation
- Stripe checkout, plan tiers, and gating semantics remain intact.
- Authentication routes/pages remain intact.
