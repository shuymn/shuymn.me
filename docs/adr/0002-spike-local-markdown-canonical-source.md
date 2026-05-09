# ADR 0002: Spike Local Markdown Canonical Source Before Further CMS Commitment

Status: Accepted
Date: 2026-05-09
Outcome: Resolved by ADR 0003, which adopts Astro-only local Markdown as the
next public-content target.

## Context

ADR 0001 accepted the memorandum-first blog platform direction and described an
initial implementation path centered on Astro plus EmDash. Since then, the
platform foundation has been reconsidered against two additional constraints:

- Coding Agents are expected to draft, edit, review, and translate posts.
- The canonical content source should remain directly inspectable and editable
  without depending on a remote CMS data model.

Sanity remains a plausible mature CMS, but it stores the canonical body as
Portable Text in Content Lake. That is useful for a structured editing UI, but
less natural as the primary artifact for agent-authored drafts, local diffs,
translation boundaries, and deterministic validation. It also moves the canonical
source of posts into a cloud service.

EmDash keeps the current site working, but additional platform work still pays
the cost of EmDash maturity, plugin/API boundary discovery, Portable Text
storage, and possible future EmDash specification changes.

Image and asset upload remains important, but it is intentionally not part of
this decision. The current question is whether the written post source should be
local and Markdown-family first.

## Decision

Before implementing more blog-platform baseline features on top of EmDash, or
continuing a Sanity migration spike, run a local Markdown-family canonical source
spike tracked by `shuymn_me-1er.12`.

The spike will evaluate a file-based post source that Coding Agents can edit
directly. The first candidate format is plain Markdown with strict YAML
frontmatter. MDX and Markdoc remain comparison candidates, but they are not the
first spike target:

- Plain Markdown is the smallest body format for agent drafting, translation,
  review, and deterministic checks.
- MDX is expressive, but JSX in prose increases the chance that translation or
  generation touches component structure.
- Markdoc gives structured content components with less arbitrary execution than
  MDX, but it adds grammar and rendering choices before a concrete need has been
  proven.

The spike should prove or reject this shape:

- canonical posts live as local Markdown-family files in the repository
- frontmatter owns durable metadata such as slug, locale, title, description,
  dates, draft state, tags, series, SEO fields, translation metadata, and
  generation state
- the body remains Markdown at the LLM and review boundary
- Astro renders published content mostly through SSG, while preview,
  draft-only, admin, generation, and telemetry-adjacent surfaces may stay SSR
- image upload and external asset storage are deferred to a later issue

The spike must not remove the current EmDash implementation. It exists to test
the platform foundation before more EmDash-specific feature work deepens the
dependency.

## Consequences

- ADR 0001 remains accepted for the product direction: memorandum-first blogging,
  recall, maintenance, English generation, OGP, and Cloudflare-first telemetry.
- ADR 0001's EmDash-centered implementation details are now provisional until the
  local Markdown spike is resolved.
- New EmDash extension work should be avoided unless it is needed to keep the
  current site operational or to compare against the spike.
- The first spike should not solve image upload. Asset handling can later be
  added as a manifest plus upload command or a CMS/editor integration.
- If the spike succeeds, the design docs and implementation backlog should be
  updated to replace EmDash-specific baseline issues with local-source
  implementation issues.
- If the spike fails, record the failure mode and resume the lowest-risk CMS
  direction with the evidence from the spike.

## Related Design

- [Blog Platform Design](../design/blog-platform.md)
- [Local Markdown Canonical Source Spike](../design/local-markdown-canonical-source-spike.md)
- [ADR 0003: Adopt Astro-Only Local Markdown Public Path](0003-adopt-astro-only-local-markdown-public-path.md)
