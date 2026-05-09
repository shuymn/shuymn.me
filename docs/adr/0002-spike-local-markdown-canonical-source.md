# ADR 0002: Spike Local Markdown Canonical Source Before Further CMS Commitment

Status: Accepted
Date: 2026-05-09
Outcome: Resolved by ADR 0003.

## Context

ADR 0001 accepted the memorandum-first blog platform direction. Before adding
more CMS-specific platform work, the project needed to decide whether the
canonical post body should remain directly editable as local Markdown-family
source.

The pressure came from Coding Agent assisted writing, reviewable local diffs,
small translation boundaries, deterministic validation, and avoiding a remote
structured body store as the primary source of truth.

## Decision

Run a foundation spike to evaluate local Markdown-family author source before
continuing CMS-specific implementation work.

The spike evaluated whether:

- repository-local files can be the canonical post source
- Astro can render the projected content cleanly
- Markdown is a suitable LLM and review boundary
- richer metadata should be kept out of author-written source
- future editor or CMS work can stay subordinate to local files

## Outcome

The spike succeeded and was resolved by ADR 0003.

The accepted direction is not a rich-frontmatter authoring model. The final
contract separates:

- author source under `posts/*.md`
- generated state for suggestions and run records
- generated Astro projection under `src/content/posts/`

The current deployable target has removed the CMS runtime dependency from public
content rendering. Image and asset management remain separate future work.

## Related Design

- [Blog Platform Design](../design/blog-platform.md)
- [ADR 0003: Adopt Astro-Only Local Markdown Public Path](0003-adopt-astro-only-local-markdown-public-path.md)
- [Local Source Contract](../design/local-source-contract.md)
