# Local Markdown Canonical Source Spike

Status: Completed
Date: 2026-05-09
Issue: `shuymn_me-1er.12`
Outcome: ADR 0003 adopts Astro-only local Markdown as the next public-content
target.

## Purpose

Evaluate whether `shuymn.me` should use local Markdown-family files as the
canonical source for posts before investing further in EmDash-specific extension
work or a Sanity migration.

This is a foundation spike, not a full migration. The current EmDash site should
remain in place while the spike answers the content-source question.

## Scope

In scope:

- canonical post files stored locally in the repository
- Markdown, MDX, and Markdoc comparison
- strict frontmatter contract for durable metadata
- Astro rendering fit across SSG and SSR routes
- English generation and review using a Markdown body boundary
- deterministic validation of generated metadata and translated bodies
- publication workflow implications for Coding Agent assisted writing

Out of scope:

- image upload
- Cloudflare Images, R2, or other media storage integration
- removing EmDash
- migrating all existing posts
- building a complete editing UI
- adding newsletter, ActivityPub, or other distribution surfaces

## Current Pressure

The current EmDash implementation is functional, but the platform direction has
new pressure from agent-assisted writing:

- Coding Agents can edit local Markdown with normal file diffs.
- Local files make drafts, review, and rollback inspectable without querying a
  remote content lake.
- Markdown is a smaller LLM boundary than Portable Text JSON.
- Git history can preserve source changes independently from CMS revision
  retention.
- A local canonical source avoids coupling the post body to EmDash or Sanity
  storage details.

Sanity reduces CMS maturity risk compared with EmDash, but keeps the canonical
body in cloud-hosted Portable Text. That is still less agent-native than local
Markdown files.

## First Candidate Format

The first spike format is plain Markdown with strict YAML frontmatter.

Plain Markdown is chosen first because it is the smallest format that satisfies
the important boundaries:

- easy for Coding Agents to draft and edit
- easy to review in Git diffs
- easy to translate without asking an LLM to emit a complex document tree
- easy to validate deterministically for headings, links, code blocks, and
  Markdown tables
- directly supported by Astro content workflows

MDX remains a candidate when post bodies need local interactive components or
explicit component composition. It is not the first target because JSX increases
the risk that automated translation changes component syntax or props.

Markdoc remains a candidate when the site needs structured authoring components
with a constrained grammar. It is not the first target because the current
baseline requirements do not yet prove that a richer block grammar is necessary.

## Candidate File Shape

The spike should evaluate a shape close to this, while keeping field names
strictly typed in code:

```yaml
---
slug: local-markdown-canonical-source
locale: ja
title: Local Markdown Canonical Source
description: Why the blog source should be local and agent-editable.
publishedAt: 2026-05-09T00:00:00.000Z
updatedAt: 2026-05-09T00:00:00.000Z
draft: true
tags:
  - blog-platform
series:
  slug: blog-platform
  order: 1
seo:
  title:
  description:
translation:
  disabled: false
  sourceLocale:
  sourceSlug:
  sourceVersion:
generation:
  promptVersion:
  reviewerVersion:
  sourceHash:
  status:
---
```

The initial content layout should keep locale and slug obvious, for example:

```text
src/content/posts/ja/local-markdown-canonical-source.md
src/content/posts/en/local-markdown-canonical-source.md
```

The exact path is part of the spike. `src/content/posts/...` is preferred for
Astro content integration unless it creates an avoidable coupling.

## Rendering Hypothesis

Published Markdown posts should be mostly static:

- post detail pages can be SSG when content is committed before deploy
- home pages, tag pages, archive pages, RSS, sitemap, and deterministic related
  posts can be SSG
- OGP images can be static assets or deterministic routes, depending on the
  renderer chosen later

SSR should remain available for surfaces that genuinely need request-time state:

- draft preview
- local or authenticated admin/editor surfaces
- generation endpoints
- Cloudflare telemetry interpretation
- search only if the static index is insufficient

This means the spike should prefer Astro's mixed per-route rendering model over a
global CMS-runtime dependency.

## English Generation Hypothesis

The local-source path should keep the existing principle that structured output
is useful but should remain small.

The translator should return field-level metadata plus Markdown body text, not a
large JSON representation of the document tree. A separate deterministic caller
should validate:

- required translation note is present or can be rendered from a fixed template
- source linkage metadata is set
- slug stability is preserved
- links are preserved or intentionally changed
- code blocks are preserved
- Markdown table count does not drift
- generated English does not overwrite manually edited English without explicit
  force

If the body remains Markdown, the review-fix loop can continue using exact text
diffs rather than whole-document regeneration.

## Publication Workflow Questions

The spike must answer these operational questions:

- Is local file editing plus a Coding Agent enough for normal posting?
- Is a Git commit and push acceptable as the publish mechanism if the author is
  not using GitHub's web UI?
- If a browser UI is needed, should it write local files, create Git commits, or
  act only as a convenience wrapper?
- How are draft posts kept private before deploy?
- Does Git history plus explicit source hashes satisfy the revision requirement
  better than CMS revision history?

## Acceptance Criteria

- When the spike starts, it shall document the candidate local canonical-source
  architecture and the exact questions it must answer.
- When the candidate format is evaluated, it shall compare Markdown, MDX, and
  Markdoc and explain why plain Markdown is the first spike target.
- When Astro rendering is evaluated, it shall identify which routes can be SSG
  and which still require SSR.
- When English generation is evaluated, it shall keep LLM structured output small
  and avoid asking the model to emit complex document trees.
- When the spike excludes images, it shall record image upload and asset storage
  as a later follow-up rather than solving it now.
- When the spike changes the platform direction, `docs/design/blog-platform.md`
  and an ADR shall be updated before implementation work proceeds.

## First Implementation Slice

The first implementation slice should be narrow:

- define a strict Astro content collection schema for local posts
- add one Japanese sample post and optionally one English linked sample
- render the sample through a non-production route or isolated branch surface
- prove SSG output for the sample route
- prove that the body text can be extracted as Markdown for translation

If this slice fails, record the concrete failure before adding MDX, Markdoc, a
CMS UI, or asset handling.

## Initial Findings

The first narrow prototype added an Astro content collection, one local Markdown
sample post, and a noindex spike route at:

```text
src/content.config.ts
src/content/local-posts/ja/local-markdown-canonical-source.md
src/pages/spikes/local-posts/[...slug].astro
```

Verification:

- `pnpm run fmt` passed.
- `pnpm run typecheck` passed.
- `pnpm run build` passed and generated
  `dist/client/spikes/local-posts/ja/local-markdown-canonical-source/index.html`.

Findings:

- Astro can statically render the local Markdown sample while the project remains
  configured with `output: "server"`.
- The `glob()` loader needs an explicit `generateId` that preserves the locale
  path. The default generated ID used only the basename, which would collide for
  `ja/foo.md` and `en/foo.md`.
- The current Astro i18n configuration attempts localized variants for the spike
  route. Locale-aware local content routes will need an explicit route strategy
  instead of relying on the global route duplication behavior.
- The current EmDash integration emits prerender warnings for `Astro.request`
  headers and session access during the static spike route. If local Markdown
  becomes the canonical source, EmDash should be removed from the public content
  path rather than treated as a long-term runtime integration to preserve.
  The remaining platform choice should be Astro alone or Astro plus a supporting
  CMS/editor layer that does not own the canonical post body.

These findings support continuing the local Markdown spike, but they also show
that keeping EmDash installed while introducing local-source SSG routes is only
a transitional state, not the target architecture.

## Decision Follow-Up

ADR 0003 records the follow-up decision from this spike:

- use Astro content collections backed by local Markdown as the public content
  path
- remove EmDash from public blog rendering as migration proceeds
- keep the first implementation Astro-only
- evaluate Keystatic, TinaCMS, Decap CMS, Pages CMS, or another editor layer only
  after browser-based posting friction is observed
- require any future editor/CMS to preserve local Markdown as the source of truth

The immediate next implementation issue is to migrate public routes and English
generation away from EmDash-backed content reads/writes while preserving the
current public URL contract.
