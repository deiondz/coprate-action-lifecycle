# Security

Security issues should be handled privately first.

## Reporting A Vulnerability

Do not open a public issue for a vulnerability.

Send the report to the project maintainer through the private channel configured for this repository. If this repo is published on GitHub, enable GitHub private vulnerability reporting and use that path.

Include:

- A short summary.
- Affected files or routes.
- Steps to reproduce.
- Expected impact.
- Any proof of concept.
- Whether the issue requires specific environment values or provider setup.

## Scope

Security-sensitive areas in Nevin include:

- Better Auth server config in `src/lib/auth.ts`.
- Auth API route in `src/app/api/auth/[...all]/route.ts`.
- Auth client setup in `src/lib/auth-client.ts`.
- Social-provider environment handling in `src/lib/auth-social-providers.ts`.
- Protected settings routes in `src/app/settings/[path]/page.tsx`.
- MongoDB auth adapter and database connection code.
- User deletion, passkeys, magic links, sessions, and API keys.

## Secrets

Never commit:

- `BETTER_AUTH_SECRET`.
- OAuth client secrets.
- MongoDB connection strings with credentials.
- Production `DATABASE_URL` values.
- API keys.

Use local `.env.local` files and deployment secret stores.

## Maintainer Response

Maintainers should:

- Acknowledge the report quickly.
- Reproduce the issue.
- Assess severity and affected versions.
- Patch privately when needed.
- Publish an advisory or release note after a fix is available.

## Production Checklist

Before using Nevin in production:

- Set a strong `BETTER_AUTH_SECRET`.
- Set `BETTER_AUTH_URL` to the production origin.
- Replace development magic-link logging with a real email sender.
- Restrict OAuth callback URLs to trusted origins.
- Use a MongoDB user with the minimum required privileges.
- Keep environment validation enabled.
- Review account deletion, API key, and organization flows before exposing them.
