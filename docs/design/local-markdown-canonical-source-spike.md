# Local Markdown Canonical Source Spike

Status: Completed
Date: 2026-05-09
Issue: `shuymn_me-1er.12`
Outcome: ADR 0003 adopts Astro local source as the public-content target.

## Purpose

Evaluate whether `shuymn.me` should use local Markdown-family files as the
canonical source for posts before adding more CMS-specific blog-platform work.

## Questions

- Can Coding Agents draft, edit, review, and translate posts directly as local
  files?
- Can Astro render committed local post content without runtime CMS reads?
- Can Markdown remain the body boundary for translation, review, and
  deterministic validation?
- Should generated editorial metadata live outside author-written source?
- Can a future editor or CMS preserve local files as the canonical body?

## Findings

- Plain Markdown is the smallest useful body format for the current site.
- MDX and Markdoc remain possible later only if concrete component-authoring
  needs appear.
- Astro can render local Markdown through content collections.
- The final contract should not put all durable and generated metadata into rich
  frontmatter.
- Author source, generated state, and Astro projection should be separate.
- Public content rendering should not depend on runtime CMS reads.
- Image and asset upload should remain separate follow-up work.

## Accepted Follow-Up

ADR 0003 turned the spike result into the current architecture:

- Japanese author source lives under root `posts/*.md`.
- Source frontmatter contains only `title`.
- Slug and publication date are derived from the filename.
- Astro projection is generated under `src/content/posts/ja/*.md`.
- English generated posts are deferred until the local-source generation path is
  rebuilt.
- Any future browser editor or CMS must edit local source rather than own the
  canonical body.

## Related Documents

- [ADR 0002: Spike Local Markdown Canonical Source Before Further CMS Commitment](../adr/0002-spike-local-markdown-canonical-source.md)
- [ADR 0003: Adopt Astro-Only Local Markdown Public Path](../adr/0003-adopt-astro-only-local-markdown-public-path.md)
- [Local Source Contract](local-source-contract.md)
