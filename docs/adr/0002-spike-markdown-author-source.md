# ADR 0002: Spike Markdown Author Source Before Further CMS Commitment

Status: Accepted
Date: 2026-05-09
Outcome: Resolved by ADR 0003.

## Context

ADR 0001 accepted the memorandum-first blog platform direction. Before adding
more CMS-specific platform work, the project needed to decide whether the
canonical post body should remain directly editable as repository Markdown
author source.

The pressure came from Coding Agent assisted writing, reviewable git diffs,
small translation boundaries, deterministic validation, and avoiding a remote
structured body store as the primary source of truth.

## Decision

Run a foundation spike to evaluate Markdown author source before
continuing CMS-specific implementation work.

The spike evaluated whether:

- repository files can be the canonical post source
- Astro can render the projected content cleanly
- Markdown is a suitable LLM and review boundary
- richer metadata should be kept out of author-written source
- future editor or CMS work can stay subordinate to repository files

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
- [ADR 0003: Adopt Astro Author Source Public Path](0003-adopt-astro-author-source-public-path.md)
- [Authoring Content Contract](../design/authoring-content-contract.md)
