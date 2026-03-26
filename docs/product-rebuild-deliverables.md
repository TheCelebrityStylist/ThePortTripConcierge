# PortTrip Editorial Blog Rebuild Deliverables

## Updated blog card component
- `app/components/blog/BlogCard.tsx`
  - Editorial card with local port-specific thumbnail
  - Port badge + time-in-port badge
  - Hover transition
  - Title + subheading + metadata-style description

## Updated hero section component
- `app/components/blog/ArticleHero.tsx`
  - Minimal premium hero
  - SEO H1
  - Port-specific subheading
  - Updated date + author line

## Image strategy
- Blog cards and article sections now use optimized Unsplash-hosted images via `next/image` remote patterns.
- No repository-tracked binary image assets are required for blog rendering.


## SEO metadata example
From `app/blog/[slug]/page.tsx` `generateMetadata`:
- title: `article.metaTitle`
- description: `article.metaDescription`
- keywords: `article.keywords`
- OpenGraph: `title`, `description`, `image`, `type=article`, `url`
- Twitter: `summary_large_image`

## Schema injection example
Injected on article page:
- `Article` schema
- `FAQPage` schema
- `BreadcrumbList` schema

## One fully rewritten 2,500+ word article example
- Slug: `rome-cruise-port-guide-civitavecchia-diy-one-day`
- Word count: 6,000+ words
- Port-specific logistics, transport ranking, tactical routing, budget breakdown, failure scenarios, and alternatives.

## Stripe/auth confirmation
- Stripe checkout and plan tiers untouched.
- Authentication routes/pages untouched.
