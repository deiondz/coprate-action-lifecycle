# Corporate Action Lifecycle Monitor

Track Indian listed-company corporate actions as persistent, source-linked lifecycles instead of a flat announcement feed.

The product has two services:

- A Next.js frontend where a user adds NSE/BSE symbols and reviews reconstructed lifecycles.
- A Hono backend that uses the official `drishti-sdk`, stores filings and lifecycle documents in MongoDB, performs bounded REST backfills, and listens for near-live announcement updates over WebSocket.

Continuous updates are WebSocket-only on both legs: Drishti to the backend and the backend to the browser. REST is used for initial history, reconnect-gap recovery, symbol verification, and explicit manual synchronization; there is no scheduled polling.

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
NEXT_PUBLIC_LIFECYCLE_WS_URL=ws://localhost:4000/ws/lifecycles
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
WS     /ws/lifecycles
GET    /openapi.json
GET    /docs
```

When a symbol is added, the backend validates it through Drishti symbol metadata, updates the active WebSocket subscription, and exhausts every available detailed announcement page through a fixed cutoff. Later reconnects fetch only from the persisted announcement watermark minus a ten-minute safety overlap. Announcement-ID upserts make that overlap idempotent.

The version-two lifecycle collection exposes Bonus Issue, Buyback, Rights Issue, Stock Split, Merger, and Demerger. One filing can update multiple lifecycles. Other announcement categories remain in the source collection for audit and future replay but are not promoted to visible lifecycles.

The browser socket sends an initial snapshot followed by lifecycle upserts, deletions, stream states, and heartbeats. `NEXT_PUBLIC_LIFECYCLE_WS_URL` is a build-time Next.js variable; production builds must set it to the public `wss://` endpoint.

## Verification

```bash
bun test
bunx tsc --noEmit
bun run lint
bun run build
docker compose config
docker compose build

# Optional: replay exported announcement category files
bun run profile:announcements -- C:/path/to/announcement_exports
```

Tests cover full pagination, bounded recovery windows, stream-before-backfill ordering, live socket broadcasts, core-six multi-action classification, term provenance, failed extraction, stable ID reuse, symbol validation, and API responses.
