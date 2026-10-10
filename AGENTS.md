# PortTrip — Base44 Dev Environment

## What this is
Next.js 13.5 (App Router) app — an AI concierge for cruise port days. Uses OpenAI for chat/embeddings, Stripe for subscriptions, and Tavily for optional web search.

## Running the app
```bash
docker compose -f docker-compose.base44.yml up -d --build
```
- Web entry point: http://localhost:3000
- The compose runs `npm install` then `next dev -H 0.0.0.0 -p 3000` inside a `node:20` container with the source bind-mounted.
- No lockfile exists; `npm install` resolves from `package.json` each startup.

## External credentials (all optional for boot)
The app boots and renders homepage/port pages without any credentials. The following are needed for specific features:
- `OPENAI_API_KEY` — required for the AI chat feature (`/api/chat`, `/chat`).
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO_ID`, `STRIPE_PRICE_UNLIMITED_ID` — required for checkout (`/api/stripe/checkout`).
- `STRIPE_WEBHOOK_SECRET` — required for webhook handling (`/api/stripe/webhook`).
- `TAVILY_API_KEY` — optional; the chat route skips web search if absent.

## Notes
- `app/api/chat/route.js` uses `export const runtime = "edge"`.
- `app/api/chat/db.js` imports `sqlite`/`sqlite3` but is not imported by any route — these packages are not in `package.json` and are not needed for boot.
- `next.config.js` is left as-is. Next.js 13.5.1 does not support `allowedDevOrigins` (added in 14.x); it doesn't gate dev origins, so no config change is needed for the preview.
- `porttrip.json` (830 KB) is the port knowledge base imported by the chat route.
