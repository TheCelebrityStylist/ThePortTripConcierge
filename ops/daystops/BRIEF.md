# Brief: build the day-builder stop data for cruise ports

PortTrip's planner is getting a day builder: the traveller picks interests, pace and group, and the app builds a timed day from the checked guide, then lets them add, remove and reorder stops. The engine is deterministic. It needs each port's guide turned into structured stops and areas. You do that, for the ports assigned to you.

## The one rule
**Derive, never invent.** Every fact (name, cost, hours, closed days, duration, transport time) must come from the guide JSON or shipDayData for that port. You may classify (tags, effort, indoor, kind, area) using judgment based on the guide text. You may NOT add places, prices, hours or times that the guide does not state. No web research. If a value is not stated, leave it null and, for duration, use the default and set `"est": true`.

## Inputs (read-only)
- Guide: `src/data/guides/<slug>.json` (fields: sights, beaches, food, dayPlan, transportSections, walkability, terminals, isTender, rainyDay, crowdTips, topAttractions, typicalHours, returnTiming, excursionAdvice, accessibility, commonMistakes)
- Leave-by rows: `src/data/shipDayData.json` → `[slug].leaveBy` (array of `{from, minutesBeforeAllAboard, how}`), plus `walkMinutes`, `access`.

## Output
One file per port: `ops/daystops/out/<slug>.json`, UTF-8, `ensure_ascii=False`, indent 1.

```json
{
 "slug": "kotor",
 "areas": [
  {"id": "centre", "name": "Kotor Old Town", "modes": [{"mode": "walk", "leaveBy": 0, "fromShipMin": 5, "how": "Walk 2–5 min from the pier"}]},
  {"id": "perast", "name": "Perast", "modes": [
    {"mode": "bus", "leaveBy": 1, "fromShipMin": 35, "how": "Blue Line bus, 25–35 min, roughly hourly; €2 cash (2026)"},
    {"mode": "taxi", "leaveBy": 2, "fromShipMin": 20, "how": "Taxi 15–20 min, about €15–25 one way (2026)"}]}
 ],
 "stops": [
  {"id": "fortress", "name": "San Giovanni Fortress and the city walls", "src": "sights[0]", "kind": "sight", "area": "centre",
   "min": 105, "est": false, "tags": ["views", "active", "history"], "effort": "hard", "indoor": false, "heat": true,
   "best": "early", "family": false, "stepFree": false, "signature": true,
   "cost": "€15 adult during staffed hours (2026); carry cash", "costEUR": 15,
   "hours": "Gates staffed 07:00–20:00 from May to September and from 08:00 in spring and autumn", "closedDays": [],
   "note": "Start before 09:00 or after 16:00 in summer. Wear shoes with grip."}
 ],
 "dropped": [{"src": "beaches[2]", "name": "Bajova Kula", "why": "No leave-by row covers it, so the return time cannot be checked"}]
}
```

### Areas
- One area per distinct place in `leaveBy`. `leaveBy` is the index into that port's leaveBy array. Rows for the same place by different modes (e.g. "Perast (bus)", "Perast (taxi)") become one area with several `modes`.
- The first leaveBy row is normally the town centre: give it `"id": "centre"`.
- `fromShipMin`: minutes from the ship (gangway or tender landing) to that area, one way, taken from transportSections / walkability / terminals / leaveBy `how`. Use the upper end of a range. For a tender port, do NOT include the tender queue (the engine adds it). If the guide gives no outbound time, use the leaveBy `how` travel figure; never guess beyond that.
- `how`: short, from the guide, with the fare and year if the guide gives them.
- Ignore a leaveBy row that is the pier itself or a duplicate.

- `name`: the short place name a traveller would say ("Vatican", "Perast", "Oia"), not the leave-by row text.
- `links` (optional): direct travel between this area and another area, only when the guide states it, e.g. `[{"to": "centre", "min": 30, "how": "Walk 20–30 min"}]` (upper end of the range). Rome's Vatican ↔ historic centre is the typical case. Without a link the engine assumes you go via the ship side, which is slow but safe.
- Outbound queues: include any stated boarding queue on the way OUT (cable car, funicular, shuttle bus, lift) in `fromShipMin`, upper end. Only the tender queue is excluded (the engine adds it).
- If a leave-by row cannot become an area (it is the pier, a duplicate, or nothing can be done there), list it in `"unusedLeaveBy": [{"index": 3, "why": "..."}]`. Every leave-by index must be used by an area or listed there.

### Stops
- One stop per item in `sights`, `beaches` and `food` that can be placed in an area. Also add a stop for a place named only in the dayPlan or topAttractions if the guide gives enough to time it (a duration or a clear activity) and it is in an area. `src` points to where it came from (`sights[3]`, `beaches[0]`, `food[2]`, `dayPlan.steps[4]`).
- `area`: the area it is in or next to. A sight inside the town centre is `centre`. If a stop is not inside any area (no leaveBy row covers it), put it in `dropped` with the reason. Do not invent an area.
- `kind`: `sight` | `museum` | `church` | `viewpoint` | `walk` | `beach` | `swim` | `market` | `food` | `snack` | `activity` | `daytrip` (a whole village/place visited as one block, e.g. Perast).
- Food: `kind` `food` for a sit-down lunch, `snack` for a pastry, gelato, slice, coffee. `name` = the dish and place as the guide words it ("Buzara mussels at Konoba Scala Santa"). Duration: food 60, snack 20, unless stated.
- `min`: typical minutes AT the place, from `timeNeeded` (midpoint of a range, rounded to 15). If the guide's figure includes the travel there and back ("2.5–3 hours including travel"), subtract the area's stated travel both ways and set `"inclTravel": true`. A beach's `time` field is usually the travel time, not the visit: do not use it as `min`. If no visit length is given: sight 60, museum 75, church 30, viewpoint 30, walk 45, beach/swim 120, market 40, activity 90, daytrip 120, food 60, snack 20; set `"est": true` (also for food defaults).
- `tags` (choose from this list only): `history`, `art`, `views`, `food`, `beach`, `swim`, `nature`, `active`, `culture`, `shopping`, `family`, `relaxed`, `architecture`, `photo`, `local`, `nightlife`. 2–4 per stop.
- `effort`: `easy` | `moderate` | `hard` (steps, climbs, long walks, rough paths = hard).
- `indoor`: true if mostly indoors (museum, church, covered market) — used for rain.
- `heat`: true if exposed and tiring in heat (climbs, long unshaded walks, beaches at midday).
- `best`: `early` | `late` | `midday` | `any`, only from the guide's own advice (crowd or heat timing); else `any`.
- `family`: true if suitable for children per the guide, or obviously so (beach, easy park); false for hard climbs and adult-only.
- `stepFree`: true only if the guide says step-free/accessible, false if the guide mentions steps/climbs/cobbles that block it, else null.
- `signature`: true for the 1–3 things the port is known for (from topAttractions / quickAnswer).
- `cost`: the guide's cost text verbatim (keep the year). `costEUR`: the euro amount one adult must pay to do the stop, only from figures the guide states: a ticket plus a compulsory booking fee are added (Vatican €20 + €5 = 25); "free, €2 for X" = 0 unless X is the point of the stop; a range = its lower end; a price in another currency = null (keep the text). Free = 0. Transport fares are not entry costs.
- `hours`: the opening-hours text from the guide verbatim, or null. `closedDays`: weekday numbers (0=Sunday … 6=Saturday) only if the guide states a regular closing day ("closed Mondays" → [1]). Seasonal closures go in `hours`, not here.
- Seasonal or "most Sundays" closures: put the regular weekday in `closedDays` and the exception in `hours`.
- A loop walk that starts and ends in town belongs to `centre`.
- `note`: the single most useful tip from the guide, ≤ 160 characters, in the guide's words where possible.
- `id`: short kebab-case, unique in the port.

## Check before you finish each port
Run: `python3 ops/daystops/validate.py <slug>` and fix every error it reports. It checks the schema, the leaveBy indexes, tags, and that every stop name, cost and hours string can be traced to the guide.

## Report
For your set: ports done, stops per port (min/median/max), dropped items and why, anything odd in a guide (contradictions, a leave-by row with no matching transport). Do not edit any guide, do not commit.
