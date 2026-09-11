# Corporate Action Lifecycle Monitor

Track Indian listed-company corporate actions as persistent, source-linked lifecycles instead of a flat announcement feed.

The product has two services:

- A Next.js frontend where a user adds NSE/BSE symbols and reviews reconstructed lifecycles.
- A Hono backend that uses the official `drishti-sdk`, stores filings and lifecycle documents in MongoDB, performs REST catch-up, and listens for near-live announcement updates over WebSocket.

## Run with Docker

Create a root `.env` containing your server-side Drishti key:

```env
DRISHTI_API_KEY=your-key
```

Then run:

```bash
docker compose up --build
```

Open `http://localhost:3000`. The API health endpoint is available at `http://localhost:4000/health`.

If `MONGODB_URI` is not set, Compose starts MongoDB and persists it in the `mongo-data` volume. Set `MONGODB_URI` to use an existing MongoDB deployment instead. The API still starts without a Drishti key in a clearly reported `not_configured` state, but adding symbols and live ingestion require the key.

## Run locally

```bash
bun install
bun run dev:api
```

In another terminal:

```bash
bun run dev
```

Relevant environment variables:

```env
DRISHTI_API_KEY=your-key
MONGODB_URI=mongodb://localhost:27017/corporate_actions
API_INTERNAL_URL=http://localhost:4000
PUBLIC_API_URL=http://localhost:4000
```

The existing auth routes also use the Better Auth and MongoDB variables documented in `.env.example`; they are not required for the public monitor screen.

## API

Interactive Scalar documentation is served at `http://localhost:4000/docs`. The OpenAPI 3.1 document is available at `http://localhost:4000/openapi.json` for SDK generation and external integrations.

```text
GET    /health
GET    /api/symbols
POST   /api/symbols                 { "symbol": "TCS" }
DELETE /api/symbols/:symbol
POST   /api/symbols/:symbol/sync
GET    /api/lifecycles
GET    /api/lifecycles/:id
GET    /api/announcements/:id/source
GET    /openapi.json
GET    /docs
```

When a symbol is added, the backend validates it through Drishti symbol metadata, retrieves announcement pages backward through the most recent corporate action, deduplicates by announcement ID, reconstructs action-type-specific lifecycles, and updates its WebSocket subscription. If no corporate action is found, the backfill continues to the end of the available announcement history. Reconnects trigger the same REST catch-up because the live stream is not treated as a replay buffer.

## Verification

```bash
bun test
bunx tsc --noEmit
bun run lint
bun run build
docker compose config
docker compose build
```

Tests cover rights-issue grouping, term changes, incomplete extraction, ambiguous matching, symbol validation, API responses, and announcement deduplication.
