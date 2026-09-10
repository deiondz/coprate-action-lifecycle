# Discussions

Use discussions for ideas that are not ready to become issues or pull requests yet.

Good discussion topics:

- Template direction.
- New auth flows.
- Database adapter choices.
- UI system decisions.
- Open-source process.
- Questions about how the project is wired.
- Proposals that need maintainer feedback before implementation.

Use issues instead when there is a clear bug, broken command, missing doc, or scoped task.

## How To Start A Useful Discussion

Include:

- The problem you are trying to solve.
- The current behavior or limitation.
- The change you are considering.
- Any trade-offs you already see.
- Links to relevant files, docs, or prior issues.

Short example:

```text
Title: Should Nevin keep the optional Drizzle helper?

The default database path is MongoDB, but `src/lib/db.ts` still supports Drizzle/Neon.
I see two options: keep it as an escape hatch, or remove it to reduce setup confusion.
I lean toward keeping it only if we add a short doc section explaining when to use it.
```

## Ground Rules

- Be specific.
- Critique ideas, not people.
- Bring examples when possible.
- Do not turn discussions into support threads for unrelated apps.
- Move to an issue once the next action is clear.

## Decision Notes

When a discussion leads to a decision, capture the outcome in the thread and update the relevant docs or code comments. A decision that only exists in chat will be forgotten.
