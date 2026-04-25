<!-- Do not restructure or delete sections. Update inline when behavior changes. -->

## Core Principles

- Execute only what is explicitly requested. No unrequested features, no "while we're at it" work.
- If requirements are ambiguous, ask before proceeding. Never guess.
- Do NOT maintain backward compatibility unless explicitly requested. Break things boldly.
- When implementation changes approved scope or design decisions, update the related Design Doc and ADR in the same task.
- Confirm interpretation in the current response language.
- Never hardcode values. Use configuration, environment variables, or constants.
- Use `uv run` for Python execution by default, including one-off scripts and tooling.
- Never compromise code quality to bypass errors. Fix root causes instead of relaxing conditions, skipping tests, suppressing errors, or adding temporary fixes.
- For non-trivial changes, ask "Would a staff engineer accept this?" and document rationale, impact scope, and verification evidence before marking done.
- Prefer the most elegant solution that stays in scope. For non-trivial changes with material trade-offs, compare up to 2 alternatives and choose the lowest-risk option.
- If new findings invalidate the current plan, stop execution, update the plan, then continue.
- Do not expand scope to adjacent features without explicit approval.
- For long-running sub-agent work, silence alone is not evidence of a stall. If activity indicates progress, keep waiting unless requirements changed or a real blocker is evident.
- Requirement Notation: Uses EARS instead of BDD Given/When/Then for acceptance criteria.

## Development Style

- Develop with TDD: exploration -> Red -> Green -> Refactoring.
- When KPI or coverage targets are given, keep iterating until they are met.
- Use `pnpm` for Node.js package commands. This repository declares `packageManager: pnpm@10.26.1`.
- Use Node.js 24 from `.node-version`.
- Before marking non-trivial code changes done, run the narrowest relevant verification first, then widen only when the blast radius justifies it.
- CI runs `pnpm run lint`, `pnpm run fmt`, `pnpm run typecheck`, and `pnpm run build`.

## Code Design

- Maintain separation of concerns.
- Separate state from logic.
- Prioritize readability and maintainability.
- Define the contract layer strictly, and keep the implementation layer regenerable.
- This is an Astro + EmDash CMS site, not a Next.js app.
- EmDash content is server-rendered. Keep `output: "server"` and do not add static-generation assumptions for CMS content.
- Local EmDash uses SQLite at `data.db` and local media under `uploads/`; Cloudflare mode is selected with `EMDASH_RUNTIME=cloudflare`.
- Treat `seed/seed.json` as the local schema/content seed source. After changing schema or seed content, run the seed/bootstrap flow needed to verify it.
- For EmDash pages, pass returned `cacheHint` values to `Astro.cache.set(cacheHint)` when using APIs that provide cache hints.
- Use `entry.id` for slugs and `entry.data.id` for database IDs used by EmDash APIs.
- For EmDash image fields, render with the `Image` component from `emdash/ui` instead of treating image values as strings.

## Project Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
pnpm run lint
pnpm run lint:fix
pnpm run fmt
pnpm run fmt:fix
pnpm run typecheck
pnpm run bootstrap
pnpm run seed
```

## Skills

- Use `building-emdash-site` for Astro + EmDash site work.
- Use `creating-plugins` before building or changing EmDash plugins.
- Use `emdash-cli` before using the EmDash CLI for content, schema, media, or remote-instance operations.

## Critical Recap

- Execute only what is explicitly requested.
- If requirements are ambiguous, ask before proceeding.
- Check applicable skills before responding.

<!-- Maintenance: Review this file when adding/removing skills or changing core workflow. Keep each line high-density — if it can be inferred from code or linters, remove it. -->
