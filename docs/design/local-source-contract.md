# Local Source Contract

Status: Draft
Date: 2026-05-10
Issue: `shuymn_me-1er.16`

## Purpose

Define the minimum local content contract needed to deploy the EmDash-free Astro
site without making rich post frontmatter the canonical source of generated or
accepted metadata.

This contract is intentionally narrower than the full blog-platform baseline. It
exists to unblock the Astro/Cloudflare cutover. Tags, series, English
generation, OGP automation, editor UI, and image handling remain follow-up work.

## Layout

Author source:

```text
content/source/posts/<locale>/<slug>.md
```

Accepted metadata:

```text
content/metadata/posts/<locale>/<slug>.json
```

Generated state:

```text
content/generated/posts/<locale>/<slug>/*.json
```

Astro build projection:

```text
src/content/posts/<locale>/<slug>.md
```

Only the projection is consumed by Astro content collections and lives under
`src/`. Author source, accepted metadata, and future generated state live outside
`src/` because they are the local source of truth rather than Astro
implementation input. Generated state is never read by public routes unless a
value is first accepted into metadata.

## Author Source

The author source file contains the post slug, title, and body. The only
frontmatter fields currently allowed are `slug` and `title`.

Example:

```markdown
---
slug: "2026-05-10-post-title"
title: "Post Title"
---

Body text.
```

The path provides `locale`; the source `slug` must match the filename. The slug
must start with `YYYY-MM-DD-`, and the projection derives `publishedAt` from that
leading date. The source body remains the primary file that Coding Agents and
local editors should draft, review, and translate.

## Accepted Metadata

The metadata sidecar stores durable publishing inputs that are not already part
of the author source or derivable from it. The current cutover schema allows:

- `locale`
- `tags`
- `series`
- `seo`
- `translation`
- `statusNote`

This sidecar is the place for accepted values. Top-level post `description`,
`updatedAt`, `visibility`, `redirects`, and recovery `revision` are not part of
the current cutover contract. SEO description remains available under `seo`.
Drafts are represented by local workflow state instead of accepted metadata:
files projected from `content/source/posts/` are publishable inputs, while local
drafts should stay outside the projection path until they are ready. LLM
suggestions, failed generation attempts, prompt versions, and rejected
candidates do not belong here until a value is accepted or deterministically
promoted.

## Generated State

Generated state is reserved for suggestion and run records such as provider
output, prompt versions, validation failures, rejected candidates, and retry
state. The current cutover does not require any generated state files.

When generated state is added later, public rendering shall continue to ignore it
until a command or editor action writes an accepted value into the metadata
sidecar.

## Projection

Run:

```bash
pnpm run project:content -- --apply
```

to regenerate Astro content projection files from author source plus accepted
metadata.

Run:

```bash
pnpm run project:content -- --check
```

to verify the checked-in projection is current. `pnpm run build` runs this check
before Astro builds.

The projection may contain frontmatter because Astro's Markdown content
collection expects it. That frontmatter is implementation output, not the
authoring contract.

## Historical Recovery

Japanese author source can be recovered from a git tree that still contains the
legacy `_posts` directory:

```bash
pnpm run project:content -- --recover-from-git '<tree-ish>' --apply --force
pnpm run project:content -- --apply
```

The recovery mode writes author source from historical Markdown. During
recovery, Markdown hard breaks are normalized and legacy C0 control characters
are removed from article bodies. Recovery provenance belongs in migration
evidence, not accepted metadata. See
`docs/design/japanese-source-recovery.md` for the current recovery evidence.

## Cutover Constraints

- Current deployment only needs Japanese source posts.
- English generated posts are not part of the cutover.
- `src/content/posts/en/*.md` may be absent.
- EmDash export files remain migration evidence only.
- Future editor/CMS work must edit author source and accepted metadata, not own
  the canonical body.
