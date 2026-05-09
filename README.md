# shuymn.me

Personal website and blog built with Astro local author sources and a generated
Astro content projection.

## Setup

Use Node.js 24 and pnpm 10.33.3.

```bash
pnpm install
pnpm run dev
```

## Content

Canonical Japanese post source lives in root `posts/*.md`. Each source file has
title-only frontmatter; slug and publication date are derived from the filename.

Astro reads generated projection files under `src/content/posts/ja/*.md`.
Regenerate or verify the projection with:

```bash
pnpm run project:content -- --apply
pnpm run project:content -- --check
```

`pnpm run build` runs the projection check before building.

## Validation

Run the narrowest relevant command first:

```bash
pnpm run fmt
pnpm run lint
pnpm run test:local-content
pnpm run typecheck
pnpm run build
```

Validate the Cloudflare Worker output without deploying with:

```bash
pnpm run deploy:dry-run
```

## Environment

No environment variables are required for the current Astro local-source deploy
target. `.envrc` may still load a local `.env`; keep real values out of git.
