# PortTrip Cruise Operating System Deliverables

## Updated folder structure (new/updated)
- `app/components/PlanningProvider.tsx`
- `app/chat/page.tsx` (state-driven tabs + builder integration)
- `app/blog/[slug]/page.tsx` (dynamic SEO + schema + links)
- `app/api/chat/route.js` (structured action output)
- `app/layout.tsx` (global provider + persistent nav)

## PlanningContext implementation
- Centralized state engine in `PlanningProvider` holds:
  - port, arrival/all-aboard, safe return time
  - risk score
  - walking preference
  - typed stops array
  - total budget + ship benchmark
- All tabs read/write from the same store.

## Timeline component behavior
- Functional vertical schedule blocks with:
  - editable start/end/name/duration/cost
  - add/delete
  - reorder (up/down)
  - recalculation of downstream times, risk, safe return, budget

## Map integration
- Google Maps JS API wiring in chat Map tab:
  - terminal marker
  - numbered stop markers
  - route polyline
  - final return leg highlighted red
  - auto-refresh on stop changes
- Fallback message appears if map key missing.

## Budget logic
- `totalBudget = Σ transit.cost + Σ visitCost`
- `savings = shipExcursionBenchmark - totalBudget`
- Warning rendered when DIY exceeds ship excursion benchmark.

## Updated OpenAI integration logic
- System prompt upgraded to “cruise logistics strategist” with no filler and no ASCII tables.
- API returns structured payload:
  - `action`
  - `updatedStops`
  - `reasoning`
  - `riskFactors`
  - `answer`
- Chat consumes this payload and mutates planning state directly.

## Stripe confirmation
- Stripe checkout and plan tiers remain untouched and operational.
