# Nevin

Nevin is an opinionated default product template for my projects. It is built for auth-first Next.js apps and comes with Better Auth, MongoDB, TanStack Query, Tailwind CSS, coss/shadcn-style UI primitives, Phosphor icons, theme support, and account settings screens already wired.

Use it when you want to start with the boring product plumbing in place: sign in, sign up, passkeys, magic links, social providers, account settings, organization-ready UI pieces, API keys, toasts, query caching, and a database boundary that can be swapped later.

## What Is Included

- Next.js App Router with React 19 and TypeScript.
- Better Auth server setup at `src/lib/auth.ts`.
- Auth API route at `src/app/api/auth/[...all]/route.ts`.
- Auth screens under `src/app/auth/[path]/page.tsx`.
- Protected settings screens under `src/app/settings/[path]/page.tsx`.
- Better Auth UI components in `src/components/auth`.
- MongoDB auth adapter in `src/infrastructure/database/mongo/mongo-auth-database-adapter.ts`.
- Mongoose database service behind a small application port.
- Hexagonal mail port with ZeptoMail adapter and console fallback for local/dev.
- Optional legacy Drizzle/Neon helper in `src/lib/db.ts`.
- TanStack Query provider and devtools in `src/components/providers.tsx`.
- Theme support through `src/components/theme-provider.tsx`.
- coss/shadcn-style UI primitives in `src/components/ui`.
- Biome for linting and formatting.
- Envin-based environment validation in `env.config.ts`.

## Mail

Transactional email is behind a hexagonal `MailService` port:

- Port: `src/application/ports/outbound/mail-service.ts`
- ZeptoMail adapter: `src/infrastructure/mail/zeptomail/`
- Console fallback: `src/infrastructure/mail/console/` (used when ZeptoMail env is missing)
- Composition: `src/composition/mail-container.ts` — swap providers here
- Better Auth UI templates: `src/infrastructure/mail/templates/auth-emails.tsx`
- Auth wiring: verification, password reset, and magic link in `src/lib/auth.ts`

Env vars (optional for local/dev; required for live send):

- `ZEPTOMAIL_TOKEN`
- `ZEPTOMAIL_FROM_EMAIL`
- `ZEPTOMAIL_FROM_NAME` (default `Nevin`)
- `APP_NAME` (default `Nevin`, used in email branding)

Verify the sending domain in ZeptoMail before using a production sender address.

### Todo (mail follow-ups)

- Welcome / OTP / org-invite / password-changed templates (available in `@better-auth-ui/react/email`, not wired yet)
- Local email preview / playground route

## Tech Stack

- Runtime and package manager: Bun 1.3.13
- Framework: Next.js 16
- Language: TypeScript
- UI: Tailwind CSS 4, Base UI, coss/shadcn-style components, Phosphor icons
- Auth: Better Auth, Better Auth UI, passkeys, magic links, multi-session support
- Database: MongoDB and Mongoose by default
- Server state: TanStack Query
- Validation: Zod and envin
- Code quality: Biome

## Quick Start

Install dependencies:

```bash
bun install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Run the app:

```bash
bun dev
```

Open `http://localhost:3000`.

## Environment

Required:

```bash
MONGODB_URI="mongodb://localhost:27017/nevin"
MONGODB_MAX_POOL_SIZE="10"
BETTER_AUTH_SECRET="replace-with-at-least-32-characters"
```

Optional:

```bash
BETTER_AUTH_URL="http://localhost:3000"
DATABASE_URL="postgresql://user:password@host:5432/database"
SKIP_ENV_VALIDATION="true"
```

`DATABASE_URL` is only needed if you import `src/lib/db.ts`. The main template path uses MongoDB.

Social login providers are enabled when both client credentials for that provider exist in the environment. For example:

```bash
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

Provider-specific options are also supported for GitLab, Microsoft, Paybin, PayPal, Salesforce, Cognito, and TikTok. See `env.config.ts` and `src/lib/auth-social-providers.ts`.

## Scripts

```bash
bun dev
bun run build
bun run start
bun run lint
bun run format
bun run env:validate
bun run env:preview
```

`env:validate` checks the environment with `env.config.ts`. `env:preview` starts an envin-backed preview on port `3001`.

## Project Structure

```text
src/app                         App Router routes
src/app/api/auth/[...all]        Better Auth API endpoint
src/app/auth/[path]              Sign in, sign up, reset, and magic-link views
src/app/settings/[path]          Protected account and security settings
src/components/auth              Auth and account UI
src/components/ui                Shared UI primitives
src/composition                  Server-side composition roots
src/application/ports            Application-facing interfaces
src/infrastructure/database      MongoDB implementations
src/lib                          Auth, query, env-backed helpers
src/styles/app.css               Tailwind and design tokens
```

## Auth Model

Better Auth is configured in `src/lib/auth.ts`.

Enabled by default:

- Email and password auth.
- Magic links. In development, links are logged with `console.info`.
- Passkeys.
- Multi-session support.
- User deletion.
- Runtime social-provider registration based on environment variables.

The client auth instance lives in `src/lib/auth-client.ts`. The app-level provider is mounted in `src/components/providers.tsx`, where auth UI plugins, TanStack Query, toasts, and navigation are connected.

## Database Model

Nevin uses MongoDB as the default database path.

- Better Auth gets its adapter from `src/composition/auth-database-container.ts`.
- The adapter implementation is in `src/infrastructure/database/mongo/mongo-auth-database-adapter.ts`.
- General database access goes through `DatabaseService` in `src/application/ports/outbound/database-service.ts`.
- The current implementation is `MongoDatabaseService`.
- `connectDatabase()` is the server-side entry point for application code that needs a database connection.

Example:

```typescript
import { connectDatabase } from "@/composition/database-container";

await connectDatabase();
```

The old Drizzle/Neon helper remains in `src/lib/db.ts` for teams that still need it. It intentionally throws if `DATABASE_URL` is missing.

## UI System

The UI layer uses Tailwind CSS 4 with generated design tokens in `src/styles/app.css`. Shared primitives live in `src/components/ui` and follow the coss/shadcn component style. Use those primitives first before adding new component libraries.

Rules of thumb:

- Keep app-specific components outside `src/components/ui`.
- Keep shared primitives small and reusable.
- Use Phosphor icons from `@phosphor-icons/react/dist/ssr` for icon buttons.
- Put auth-specific UI under `src/components/auth`.
- Keep server-only code out of client components.

## Development Notes

- The TypeScript alias `@/*` maps to `src/*`.
- Biome ignores generated auth schema, UI primitives, SVGs, `.next`, and `node_modules`.
- Next metadata is set in `src/app/layout.tsx`.
- The home page currently renders `UserButton` as a small smoke test for auth wiring.
- Settings pages require a valid session and redirect unauthenticated users to sign in.

## Open Source Status

This repository is prepared to be run as an open-source template, but no license is included yet. Add a `LICENSE` file before publishing it publicly. Until then, assume the code is not licensed for reuse outside the project owner.

Open-source project docs:

- [Contributing](./CONTRIBUTING.md)
- [Discussions](./DISCUSSIONS.md)
- [Security](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## Roadmap

- Add a real landing or dashboard route after the product direction is chosen.
- Add tests for auth redirects, provider rendering, and database connection behavior.
- Decide whether Drizzle/Neon should stay as an optional path or be removed.
- Add a license before public release.

## Maintainer Notes

Keep this template boring on purpose. New features should either support most product apps or live behind clear boundaries. Avoid turning the default template into a demo app with product-specific assumptions.
