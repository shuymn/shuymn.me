# ADR 0001: Position The Site As A Memorandum-First Blog Platform

Status: Accepted
Date: 2026-05-08
Updated: 2026-05-10

## Context

`shuymn.me` is a personal site whose practical center is a blog. The author uses
it to preserve what they were thinking, building, and deciding at a point in
time, especially around AI-related work.

WordPress has useful blogging conventions, but many of its plugin patterns are
optimized for traffic growth, advertising, affiliate publishing, or conversion.
Those are not goals for this site.

The original implementation direction explored Astro plus EmDash. ADR 0002 and
ADR 0003 superseded that implementation boundary. The current deployable target
is Astro local source: repository-local author files under `posts/*.md`,
generated Astro projection under `src/content/posts/`, and Cloudflare deployment
without EmDash runtime, scripts, dependencies, or environment requirements.

## Decision

Treat `shuymn.me` as a memorandum-first blog platform.

Adopt blog-platform features only when they improve at least one of these
outcomes:

- recall of past thinking
- readability of individual posts
- maintenance of published URLs and metadata
- distribution through standard blog surfaces
- reduction of non-writing editorial work

Do not adopt features whose main purpose is advertising, affiliate revenue,
growth funnels, or traffic-driven content production.

The content architecture is local-source first:

- Author source lives in root `posts/<slug>.md`.
- Source frontmatter contains only `title`.
- Slug is derived from the extensionless filename.
- Publication date is derived from the leading `YYYY-MM-DD` slug segment.
- Astro projection is generated under `src/content/posts/<locale>/<slug>.md`.
- Generated projection frontmatter is implementation output, not the authoring
  contract.
- Public content routes must render from local files and must not query a CMS at
  render time.

Japanese posts are the current source of truth. English generation remains in
scope as a future local-source workflow, but it is not part of the current
deployment gate.

Cloudflare remains the primary owner of deployment and raw telemetry. Local
tooling may consume derived Cloudflare signals when they help with content
maintenance, but the site should not add first-party pageview collection unless a
specific missing signal proves it necessary.

## Baseline Direction

The baseline blog platform should eventually include:

- durable post rendering with title, body, date-prefixed slugs, and SEO metadata
- recall surfaces such as tags, archives, search entry points, RSS/sitemap
  validation, and deterministic related navigation
- thought-continuity surfaces such as series, table of contents, and explicit
  status notes
- deterministic post-specific OGP images
- local-source English generation with automated translation review and
  deterministic gates
- maintenance feedback such as internal link checks and redirect handling
- Cloudflare-first telemetry interpretation

These are product directions, not all release gates for the current cutover.
Work should stay reversible and evidence-driven when the value is not yet proven,
especially for embedding-based related posts, mandatory human review for English
translations, newsletters, ActivityPub, and additional editor/admin UI.

## Consequences

- New public blog implementation work should target Astro local source, not
  EmDash APIs, Portable Text storage, plugin hooks, or CMS runtime reads.
- Existing EmDash-specific implementation notes are historical migration
  evidence. Use git history for the removed details rather than keeping them as
  current instructions.
- Future editor or CMS work must preserve local files as the canonical post body
  and must be replaceable without changing public rendering contracts.
- Generated editorial metadata must be inspectable before it affects public
  pages. Do not hide generated suggestions inside author-written source.
- English generation should use Markdown author source and small structured
  outputs. It must preserve code blocks, links, Markdown tables, source hashes,
  and manual-edit guards.
- OGP image generation should use deterministic composition of repo-owned assets
  and accepted post text, not image-generation AI.
- The content model may break backward compatibility when needed because the
  repository explicitly does not require compatibility unless requested.

## Related Design

- [Blog Platform Design](../design/blog-platform.md)
- [ADR 0002: Spike Local Markdown Canonical Source Before Further CMS Commitment](0002-spike-local-markdown-canonical-source.md)
- [ADR 0003: Adopt Astro-Only Local Markdown Public Path](0003-adopt-astro-only-local-markdown-public-path.md)
- [Local Source Contract](../design/local-source-contract.md)
