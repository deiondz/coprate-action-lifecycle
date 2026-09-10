# Contributing

Thanks for helping improve Nevin. This project is a starter template, so changes should make future apps easier to build without adding product-specific assumptions.

## Before You Start

Open an issue or discussion first when the change affects architecture, dependencies, auth behavior, database behavior, public documentation, or the default UI direction.

Small fixes can go straight to a pull request:

- Typos.
- Broken links.
- Small accessibility fixes.
- Narrow bug fixes with clear reproduction steps.
- Documentation updates that match the current code.

## Local Setup

```bash
bun install
bun run env:validate
bun dev
```

Required local environment:

```bash
MONGODB_URI="mongodb://localhost:27017/nevin"
MONGODB_MAX_POOL_SIZE="10"
BETTER_AUTH_SECRET="replace-with-at-least-32-characters"
```

## Pull Request Checklist

Before opening a PR:

- Run `bun run lint`.
- Run `bun run build` when the change touches routing, auth, server code, or shared UI.
- Update docs when setup, behavior, environment variables, routes, or public APIs change.
- Keep generated files and unrelated formatting out of the diff.
- Explain the user-facing behavior change, not just the files changed.

## Code Guidelines

- Use TypeScript and keep strict-mode assumptions intact.
- Prefer existing app boundaries before adding a new abstraction.
- Put app routes in `src/app`.
- Put auth UI in `src/components/auth`.
- Put reusable primitives in `src/components/ui`.
- Put server composition in `src/composition`.
- Put database implementations under `src/infrastructure/database`.
- Keep server-only imports out of client components.
- Use `@/*` imports for files under `src`.

## UI Guidelines

- Reuse existing UI primitives before adding new ones.
- Use Phosphor icons from `@phosphor-icons/react/dist/ssr` when an icon is needed.
- Keep copy short and useful.
- Do not add marketing sections to the default app unless the project has a real product direction.
- Check mobile and desktop layouts for auth and settings screens.

## Auth Guidelines

Auth changes need extra care. Include reproduction steps and test notes for:

- Sign in and sign up.
- Session redirects.
- Account settings.
- Passkeys.
- Magic links.
- Social provider visibility.
- User deletion.

Do not log secrets. The development magic-link logger is for local use only and should be replaced before production email delivery is added.

## Database Guidelines

MongoDB is the default path. Use the database service or auth adapter boundaries instead of importing database clients throughout the app.

If you add a new persistence path, document:

- Required environment variables.
- Connection lifecycle.
- Migration or schema steps.
- How it affects Better Auth.

## Commit Style

Use short, direct commit messages:

```text
docs: add open source guidelines
auth: fix settings redirect
db: cache mongo connection
ui: add passkey empty state
```

## Review Standard

Reviews should focus on correctness, maintainability, security, accessibility, and whether the change belongs in a default template. Taste-only comments should be framed as suggestions.
