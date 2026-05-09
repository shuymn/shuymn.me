# Authoring Content Contract

Status: Accepted
Date: 2026-05-10
Issue: `shuymn_me-1er.16`

## Purpose

Define the authoring content contract for the Astro site without making rich
post frontmatter the canonical source of generated or derived metadata.

This contract is intentionally narrower than the full blog-platform baseline.
Tags, series, English generation, OGP automation, editor UI, and image handling
remain follow-up work.

## Layout

Author source:

```text
posts/<slug>.md
```

Astro build projection:

```text
src/content/posts/<locale>/<slug>.md
```

Only the projection is consumed by Astro content collections and lives under
`src/`. Author source lives outside `src/` because it is the authored source of
truth rather than Astro implementation input. Projection frontmatter is generated
metadata and can be regenerated from author source.

## Author Source

The author source file contains the post title and body. The only frontmatter
field currently allowed is `title`.

Example:

```markdown
---
title: "Post Title"
---

Body text.
```

The filename provides `slug`. The slug must start with `YYYY-MM-DD-`, and the
projection derives `publishedAt` from that leading date. The current cutover has
only Japanese canonical source posts, so the source tree does not include a
locale directory. The source body remains the primary file that Coding Agents and
editors should draft, review, and translate.

## Projection

Run:

```bash
pnpm run project:content -- --apply
```

to regenerate Astro content projection files from author source.

Run:

```bash
pnpm run project:content -- --check
```

to verify the checked-in projection is current. `pnpm run build` runs this check
before Astro builds.

The projection may contain frontmatter because Astro's Markdown content
collection expects it. That frontmatter is implementation output, not the
authoring contract. The current generated frontmatter includes:

- `slug`, derived from the source filename
- `locale`, fixed to `ja` for the current cutover
- `title`, copied from author source
- `publishedAt`, derived from the date-prefixed slug
- `seo.title`, copied from the title
- `seo.description`, deterministically generated from the first body paragraph

## Historical Recovery

Japanese author source has already been recovered from the legacy `_posts`
snapshot. The current projection command no longer includes one-off recovery
modes. Recovery provenance belongs in migration evidence. See
`docs/design/japanese-source-recovery.md` for the recovery evidence.

## Cutover Constraints

- Current deployment only needs Japanese source posts.
- English generated posts are not part of the cutover.
- `src/content/posts/en/*.md` may be absent.
- Future editor/CMS work must edit author source, not own the canonical body.
