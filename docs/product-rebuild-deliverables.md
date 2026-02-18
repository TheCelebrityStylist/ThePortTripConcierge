# PortTrip Product Rebuild Deliverables

## Blog folder structure

- `app/blog/page.tsx` (index)
- `app/blog/[slug]/page.tsx` (article)
- `app/data/blog-cms.ts` (CMS content model + 15 long-form articles)

## CMS model

```ts
BlogArticle {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  images: string[]
  ctaText: string
  faq: { question: string; answer: string }[]
  sections: { h2: string; h3: string; paragraphs: string[] }[]
  wordCount: number
}
```

## Itinerary DB schema

Migration file: `app/data/migrations/001_create_itineraries.sql`

- id
- user_id
- port
- ship_name
- arrival_time
- all_aboard_time
- safety_buffer
- risk_score
- itinerary_json
- created_at
- updated_at

Persistence APIs:
- `POST/GET /api/itineraries`
- `GET/PATCH/DELETE /api/itineraries/:id`
- `GET /api/itineraries/:id/pdf`

## Updated OpenAI system prompt

Implemented in `app/api/chat/route.js`:
- Cruise logistics planner persona
- Priority order: DB > Tavily > reasoning
- No generic phrasing
- No ASCII/pipe table formatting
- Structured sections enforced
- Shortlist intent branch for “top 3 minimal walking” style queries

## Example 3000-word blog snippet

Each of the first 15 articles is generated with >3,200 words and multi-section transport/safety content. Example section excerpt:

> Set a must-return-by time that includes traffic, terminal congestion, and dock/tender friction. For dock ports, 75 minutes is a practical minimum buffer; for tender ports, use 95 minutes or more depending on queue behavior. Trigger your return when either the clock hits the threshold or your transport reliability degrades—whichever comes first.

## Example saved itinerary JSON

```json
{
  "id": "it_x3q9k2ab",
  "user_id": "guest",
  "port": "Barcelona",
  "ship_name": "Icon of the Seas",
  "arrival_time": "09:00",
  "all_aboard_time": "16:30",
  "safety_buffer": 75,
  "risk_score": 48,
  "itinerary_json": {
    "blocks": [
      { "start": "09:00", "end": "09:25", "title": "Transit to city core", "notes": "Time-safe outbound segment", "costEur": 25 },
      { "start": "09:25", "end": "10:45", "title": "Primary cluster", "notes": "Prioritized for low crowd density" }
    ],
    "comparison": { "shipExcursion": 119, "diy": 38, "savings": 81 }
  }
}
```

## Stripe confirmation

Stripe checkout + plan gating logic remains intact and was not removed.
