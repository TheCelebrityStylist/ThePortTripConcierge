# Planner Engine + Port Registry

## Overview
The Cruise Day Planner uses deterministic local generation with structured port intelligence.

## Data model
- `Port`: core intelligence object in `app/data/ports.ts`.
- `Corridor`: near-port and outbound route bands with distance/time ranges.
- `ClusterStop`: candidate stop for routing with tags, durations, costs, and watch-outs.
- `TransportProfile`: reliability-ranked transit options with expected durations.

## Engine modules
`app/lib/planner/engine.ts` exports:
- `generatePlan(input)` → creates blocks with unique titles, rationale, transport and contingency notes.
- `simulatePlan(plan, port, input)` → computes `ScoreCard` and violations.
- `optimizePlan(plan, { action })` → applies concrete fix actions and reflows time.
- `buildAgentResponse(planOutput, question)` → grounded assistant response from current plan state.

## Plan block quality rules
Each block includes:
- `whyThisHere`
- `guidance` (how to get there + watch-out + bailout)
- `runningLateDecision`

## Adding a new port
1. Add a seed entry to `europePorts` or `caribbeanPorts` in `app/data/ports.ts`.
2. If needed, customize cluster generation for local landmarks.
3. Ensure `returnSafeRules` and transport profiles reflect local constraints.
4. Run lint and sanity checks.

## Sanity script
Use `scripts/planner-sanity.ts` to print sample plans for three ports and verify deterministic output shape.
