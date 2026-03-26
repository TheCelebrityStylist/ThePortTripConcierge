# PortTrip Cruise OS Architecture

## 1) Core models
- `PortProfile` (in `app/lib/ports/types.ts`): structured intelligence per port including crowd/traffic windows, corridor zones, clusters, transport, fallback and scam patterns.
- `Cruise` + `PortDay` (in `app/lib/planner/types.ts`): lifecycle container for multi-day itinerary planning.
- `PlanInput`, `PlanBlock`, `PlanOutput`, `ScoreCard` (in `app/lib/planner/types.ts`): deterministic planning contract.

## 2) Port intelligence modules
- `app/lib/ports/europe.ts`
- `app/lib/ports/caribbean.ts`
- `app/lib/ports/alaska.ts`
- `app/lib/ports/asia.ts`
- `app/lib/ports/index.ts`

This provides 80+ ports and keeps region growth modular.

## 3) Planning engine
`app/lib/planner/engine.ts`:
- `generatePortDayPlan(input, portProfile?)`
- `simulateRisk(plan, portSlug)`
- `optimizePlan(plan, constraints)`
- `generateNarrative(plan, portName)`
- `buildCruiseDashboard(cruise, plansByDayId)`

Engine principles:
- deterministic seed generation
- anti-duplication for block titles
- anti-generic narrative guard via similarity checks
- explicit transfer naming
- running-late decisions per block

## 4) Cruise-first UX
Planner entry (`app/chat/page.tsx`) supports:
- Single Port mode
- Full Cruise mode (default)
- Cruise Dashboard (status, score, energy pacing, Generate All)

## 5) Monetization gates
`app/lib/cruise/gates.ts` defines gate matrix for:
- free
- trip-pass
- pro

Gated features include full cruise mode actions, generate all, exports, and offline pack pathways.

## 6) Adding new ports
1. Add seed rows in region file.
2. Export via `app/lib/ports/index.ts`.
3. Validate with `scripts/planner-sanity.ts`.
4. Run lint/type checks.
