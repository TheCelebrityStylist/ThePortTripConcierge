# Changes

## Cruise Intelligence Library quality overhaul
- Rewrote article block content into narrative blog prose (`lede`, `body`, optional bullets, callout, local tip) while keeping the same block order and UI structure.
- Removed bullet-dump rendering behavior by updating article templates to prioritize prose paragraphs.
- Added/strengthened build-time content quality guardrails (duplicate hash/sentence overlap + paragraph minimum + bullet ratio maximum).
- Added working RSS feed endpoint at `/feed.xml`.

## Planner + account workflow improvements
- Upgraded chat/planner interactions so assistant responses can be converted into itinerary stops (“Add to itinerary”).
- Improved Timeline/Map/Budget tabs to reflect live plan state with editable steps and route summary fallback when map key is absent.
- Added lightweight auth interaction in planner page (signup/login/logout), plus save/load/rename/delete plan operations backed by itinerary APIs.

## SEO and library indexing
- Preserved per-article metadata + structured data and kept canonical pathing intact.
- Ensured sitemap includes library category routes and blog routes; added RSS route.
