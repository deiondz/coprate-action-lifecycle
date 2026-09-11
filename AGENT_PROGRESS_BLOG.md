---
title: "From Filings to Lifecycles: Building the Corporate Action Monitor"
description: "A development update on the corporate action lifecycle monitor, its source-linked interface, safer authentication, and what remains before release."
date: "2026-09-10"
status: "working-draft"
---

# From Filings to Lifecycles: Building the Corporate Action Monitor

**Progress snapshot:** The product now has a production-buildable frontend and API for turning scattered corporate-action filings into one readable lifecycle. The dashboard is wired to the backend for lifecycles, watchlist management, source documents, summary counts, and stream status. Its local tests use controlled fixtures; a real Drishti-backed run has not yet been demonstrated.

Corporate actions rarely arrive as one neat record. A proposal appears first. Terms follow later. Dates move. An issue opens, closes, and eventually completes. Each update may arrive in a separate exchange filing, leaving the person tracking it to reconstruct the story.

The current work is beginning to make that reconstruction visible.

## A lifecycle instead of a filing list

The biggest step is a new dashboard built around the event, rather than the document. Each row shows a company, action type, current state, progress through the lifecycle, and the latest meaningful change. Selecting a row opens the full sequence alongside key terms and the filings that support them.

The shared lifecycle model and backend stage maps now cover several different paths:

- A rights issue moving from proposal through allotment and listing.
- A dividend approaching its ex-date and record date.
- A completed stock split.
- A buyback waiting for shareholder approval.
- An ambiguous rights-issue update held for review instead of being merged automatically.

The last case matters. A lifecycle system should not turn uncertainty into false confidence. The prototype exposes a match-confidence value and a dedicated “Needs review” state, giving an operator a place to resolve uncertain matches.

## Changes are treated as first-class information

The dashboard does more than show the latest value. It preserves the change that produced it. A domain test, for example, feeds the engine disconnected rights-issue filings and verifies that a changed closing date retains both the old and new values. The interface can show that change, its timestamp, and the announcement reference behind it.

The underlying model now separates lifecycle stages, terms, changes, and announcement references. Dates can be marked confirmed, expected, or estimated. Stages can be completed, current, pending, skipped, or cancelled. These distinctions are small in code but important in the product: they stop a forecast from looking like a fact and a missing stage from looking complete.

## The backend is taking shape

A new API workspace now moves the project beyond a browser-only sample. Its domain engine classifies exchange announcements and groups them into lifecycles by symbol, action type, time window, and identifying dates. It defines stage maps for 12 action types, including rights issues, dividends, bonus issues, stock splits, buybacks, mergers, demergers, offers for sale, and de-listing.

The engine records stage transitions and changed terms instead of simply overwriting the last value. When more than one lifecycle is a plausible match, it holds the filing for review. Shared contracts now define the API's lifecycle, watchlist, summary, and source-reference shapes in one package.

The API layer also includes:

- A Drishti client for announcement backfills and WebSocket subscriptions, with reconnect delays bounded between 1 and 30 seconds.
- A lifecycle service for adding, removing, synchronizing, and continuously updating watched symbols.
- SQLite persistence for watchlists, source announcements, lifecycle projections, sync timestamps, and errors.
- Hono routes for health, symbol management, manual synchronization, lifecycle retrieval, and source-document retrieval.

This is implemented in the working tree and now has local domain and route-level coverage. The tests exercise changed closing dates, incomplete terms, ambiguous lifecycle matches, symbol validation, idempotent announcement synchronization, symbol removal, and the unconfigured-Drishti response. The API has not yet been shown running against a configured Drishti account, so live ingestion remains unverified.

## The dashboard reached a reviewable build

During this progress review, a temporary `/preview` route was added and later removed. The corporate-action dashboard now renders directly at the root route. It no longer reads a local sample-data module: TanStack Query loads lifecycles and watched symbols through `/backend`, with the Next.js rewrite forwarding those requests to the Hono service.

The page refreshes lifecycle data every 20 seconds, lets an operator add or remove a symbol, displays server-calculated summary counts, and distinguishes a connected feed from a missing key or reconnecting stream. Source-filing cards now open the backend's source-document route instead of displaying inert references.

The interface itself has also moved away from the starter application's generic appearance. The working tree includes a new visual system, responsive lifecycle rails, search, quick filters, summary counts, watchlist markers, light and dark theme treatment, and source-filing cards. The product metadata now names the application “Corporate Action Monitor” and describes its source-linked lifecycle approach.

## Packaging for a two-service deployment

The working tree now includes separate Bun API and standalone Next.js web images plus a Docker Compose definition. The Compose topology waits for the API health check before starting the web service, persists SQLite data in a named volume, and supplies the web container with an internal API address. `docker compose config --quiet` passes, confirming that the configuration is structurally valid. The images have not been built or started in this monitoring session: a runtime status check could not connect because the local Docker Desktop Linux engine was not running. Nothing has been deployed.

## Authentication is being made honest about email delivery

Another workstream is tightening the relationship between authentication and transactional email. Password recovery, email verification, and passwordless magic links now depend on ZeptoMail being configured. That prevents the interface from offering an email flow that cannot actually deliver a message.

The dependency versions around Better Auth have also been pinned, and a focused regression test checks that the global authentication error toaster is mounted exactly once. The test currently passes.

## What is verified today

The latest verification run on 10 September 2026 covers the UI and the newly added API workspace:

- Production build: passed.
- TypeScript validation: passed after adding Bun type support and wiring the shared-contract path.
- Static generation: passed for the current Next.js route set.
- Automated tests: 6 passed, 0 failed, with 17 assertions across three files.
- Focused API, contract, dashboard, and proxy formatting check: passed across 13 files.
- Docker Compose configuration validation: passed.

Repository-wide lint is not clean yet. The earlier full check reported 133 diagnostics, with much of the output caused by line-ending and formatting differences across the starter code. The new API and contract files themselves now pass their focused formatting check. The broader formatting debt remains an open cleanup item.

## What comes next

The clearest next step is live integration proof. The frontend and backend are now connected in source, and the backend contains REST, backfill, WebSocket, projection, and persistence code. Its build and local test suite are green, but no configured Drishti sync has been demonstrated.

The next meaningful milestone is to build and run the two containers, connect a real Drishti account, and verify an announcement flowing through ingestion, SQLite persistence, lifecycle projection, the browser, and its source-document link.

Still, the product shape is now concrete. The team has moved from an auth-first starter to a reviewable corporate-action workspace with a coherent event model, visible uncertainty, source-aware change history, and a real frontend/backend boundary. The next milestone is not another mock-up. It is proving the pipeline with real announcements while keeping the same discipline: one lifecycle per action, every change traceable to its source.

---

_Evidence boundary: This post describes changes observed in the shared working tree and checks run locally on 10 September 2026. The work is uncommitted and should not be read as deployed or production-verified._
