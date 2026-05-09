# Blog Platform Design

Status: Draft
Date: 2026-05-08
Updated: 2026-05-10

## Context

`shuymn.me` is a personal site and mostly-blog built with Markdown author
source. The site should preserve what the author was thinking, building, and
deciding at a point in time, especially around AI-related work.

The main value is personal recall and durable reference. External publishing
value is useful, but secondary. The platform should therefore borrow mature blog
patterns from WordPress only when they help recall, readability, maintenance, or
distribution without drifting into affiliate, ad, or conversion-driven
publishing.

Current implementation baseline:

- Canonical Japanese post source lives under root `posts/*.md`.
- Author source frontmatter contains only `title`.
- Slug and publication date are derived from the filename.
- Post-scoped recall metadata is generated into projection frontmatter by
  `project:content`; cross-post recall data may use additional generated
  artifacts when a feature needs them. Commit/deploy is the acceptance boundary
  for generated public metadata.
- Astro build projection lives under `src/content/posts/ja/*.md`.
- Public home and Japanese post detail routes render from Astro files and
  content collections.
- English post routes are reserved for future generated translations, but
  generated English post files and English generation automation are outside the
  current deployment gate.
- Home/profile copy is component-owned locale content because it shares links and
  is not independently authored content.
- OGP images currently fall back to one static default image through
  `DEFAULT_OG_IMAGE_URL`.
- There are no current taxonomies, series, archive pages, search page, related
  post surfaces, redirect management, or post-level publishing checklist.

ADR 0003 chooses the current public-content foundation: Markdown author source,
generated projection, Cloudflare deployment, and no EmDash runtime dependency in
the deployable target. Historical EmDash implementation details are not current
instructions; use git history and ADR 0002/0003 when migration evidence is
needed.

## Authoring Model

The deployable target is authoring-first, not CMS first and not
frontmatter-first.

Author source:

- contains the post title and body in Markdown
- keeps only the minimal envelope needed to make the source addressable
- derives the slug from the extensionless filename
- derives the publication date from the date-prefixed slug
- remains the part Coding Agents and editors primarily draft, review, and
  translate

Generated state:

- stores prompt versions, provider output, validation failures, rejected
  candidates, and retry state separately from author source and build projection
- is not a public metadata layer and does not affect public pages directly
- may be committed when it is useful evidence, but it is never the hidden source
  of published truth

Build projection:

- is generated into `src/content/posts/ja/*.md`
- contains Astro/public-rendering fields such as `slug`, `locale`,
  `publishedAt`, generated recall metadata, and SEO metadata
- is regenerable implementation output, not hand-authored canonical source
- is a do-not-edit artifact; changes must come from author source or the
  documented generation workflow
- is the only layer that adapts to Astro-specific schema/frontmatter constraints
- is the committed publish artifact for generated metadata; commit/deploy is the
  acceptance boundary
- must stay current through `pnpm run project:content -- --check` in commit/build
  gates

Generated public data artifacts:

- may be added by recall features when a cross-post view would otherwise need to
  scan every Markdown projection at runtime
- include examples such as tag indexes, archive indexes, related-navigation
  indexes, RSS, sitemap, and compact search indexes
- must be generated from author source plus committed projection metadata by
  `project:content` or another documented build workflow
- must remain regenerable implementation output, not hand-authored source

Deploy-time public data artifacts:

- may be added when metadata cannot be computed accurately before the source
  commit exists
- include `updatedAt` if it is generated from the latest git commit that changes
  `posts/<slug>.md`
- must be produced by documented CD/deploy workflow steps and treated as
  regenerable public output

## Goals

- Make old thinking easy to rediscover by topic, series, time, and search.
- Keep the writing flow light enough for frequent notes, not only polished
  essays.
- Automate editorial metadata and maintenance work that is not the act of
  writing itself.
- Preserve provenance through stable author source, date-prefixed slugs, git
  history, and explicit status notes when a visible notice is needed.
- Provide enough SEO and sharing metadata for posts to travel well, without
  optimizing the whole site around traffic acquisition.
- Generate post-specific OGP images automatically so sharing quality does not
  depend on manual image production.
- Generate English versions of eligible published posts automatically after the
  author source generation path is rebuilt.
- Treat traffic and infrastructure telemetry as a Cloudflare concern first.

## Non-Goals

- Advertising, affiliate disclosure workflows, ad placement, or revenue
  optimization.
- Growth-hacking funnels, popups, gated content, aggressive newsletter prompts,
  or conversion-rate tooling.
- Keyword-stuffed publishing workflows where SEO score is more important than
  accurate personal records.
- Broad CMS generalization beyond this personal blog.
- Reintroducing a CMS-owned post body or runtime content reads for public routes.
- Perfect first-pass automation for every editorial feature.

## Requirements

The requirements use EARS notation.

- When the author publishes a post, the system shall preserve title, content,
  slug, derived publication date, and SEO metadata.
- When a post covers a durable topic, the system shall support flat tags without
  requiring them in author source frontmatter.
- When a post belongs to an ongoing line of thought, generated projection
  frontmatter shall be able to record the series and readers shall be able to
  navigate the series.
- When tooling generates editorial metadata candidates, the candidates shall
  remain outside public metadata until written into projection frontmatter or
  another documented generated public data artifact and committed, or until a
  deploy workflow writes a documented publish-time public artifact.
- When a reader wants prior thinking on a topic, the system shall expose search,
  tags, archives, and related posts before relying on external search engines.
- When a post is long-form, the system shall expose a table of contents derived
  from headings without requiring duplicated manual markup.
- When a post needs a visible lifecycle note, the system shall use an explicit
  status note and shall display an update date only when a deploy workflow writes
  `updatedAt` from the latest git commit that changes the canonical
  `posts/<slug>.md` source file.
- When a post is shared externally, the system shall provide a post-specific OGP
  image generated from durable post metadata.
- When a Japanese post is published and not explicitly excluded, the system shall
  be able to generate an English version without requiring a manual translation
  pass first.
- When generated English content passes automated translation review and
  deterministic checks, the system shall publish it with a visible translation
  note instead of requiring routine human approval.
- When generated English content fails automated checks, the system shall keep it
  unpublished and expose the failure reason for manual review.
- When an English version is generated, the author shall be able to inspect,
  edit, unpublish, reject, or regenerate it independently from the Japanese
  source.
- When a localized post route is shared externally, the system shall generate an
  OGP image for that locale-specific path.
- When a URL changes after publication, the system shall provide an explicit
  redirect path instead of silently losing old links.
- When the author reviews readership signals, Cloudflare-provided telemetry
  shall be the primary source of truth.
- When the author source/projection contract changes, the system shall make that
  contract explicit in code and docs before generated values are written into
  projection frontmatter.

## WordPress Patterns To Translate

| WordPress pattern | Useful idea | Author-source translation |
| --- | --- | --- |
| SEO metadata and structured data | Metadata, canonical URLs, XML sitemaps, schema, previews, and content health checks | Generate SEO metadata into the Astro projection; render and validate sitemap/RSS/schema/OGP from that projection |
| Custom fields and content modeling | Add structured editorial fields without hardcoding theme behavior | Generate structured projection fields only when they drive rendering or editorial decisions, and keep them out of author source |
| Taxonomy and internal discovery | Help readers and the author traverse old posts | Generate flat tags and optional series into committed projection frontmatter, with cross-post index artifacts when useful |
| Multilingual publishing | Keep translated versions discoverable without making every translation a separate manual project | Generate English source/projection outputs from Japanese source posts and expose locale-specific URLs and OGP images |
| Table of contents | Derive navigation from headings for long-form posts | Generate TOC from rendered Markdown headings in `PostPage.astro` or a focused component |
| Redirect and 404 maintenance | Preserve old links and surface broken URLs | Start with repository redirect config or Cloudflare rules; add editor support only if manual maintenance becomes frequent |
| Popular posts and stats | Show what is being referenced | Use Cloudflare telemetry as the source of truth; optionally map paths to posts, tags, and series into generated state for editorial interpretation |

## Baseline And Adaptive Scope

Baseline capabilities:

- durable post rendering with title, content, date-prefixed slugs, SEO metadata,
  and localized routes
- retrieval backbone: tags, archive, search entry point, RSS/sitemap checks, and
  simple related navigation based on deterministic signals
- generated projection metadata for tags, series, workflow-derived updated dates,
  status notes, and related-post input slugs
- editorial automation state for temporary metadata candidates, summaries,
  English versions, OGP inputs, and publish-check results
- deterministic OGP generation from a base image and durable text, with
  locale-aware wrapping and cache-safe URLs
- English auto-publication after automated translation, automated review, and
  deterministic checks pass, with a visible translation note
- Cloudflare-first telemetry with only durable derived editorial aggregates
  stored when needed

Adaptive capabilities:

- richer series modeling and navigation beyond the baseline
- embedding-based related posts or semantic clustering
- advanced publish health scoring
- a mandatory human review gate for English translations, but only if measured
  translation quality or pipeline reliability is not good enough for
  auto-publish
- repository reporting over Cloudflare-derived aggregates
- newsletter, ActivityPub, or other distribution channels
- additional admin UI around low-frequency maintenance tasks
- alternative LLM providers or Cloudflare Worker implementations when operational
  evidence justifies the split

Adaptive capabilities should remain reversible. If a feature creates maintenance
burden, low-quality metadata, or little recall value after real use, remove it or
fold it back into a simpler workflow.

## Projection Metadata Boundaries

The recall metadata contract defines field shape and ownership before the
individual recall surfaces are implemented. `project:content` owns writing
post-scoped generated metadata into projection frontmatter. Recall features may
also add cross-post generated artifacts when those artifacts avoid inefficient
runtime scans or make a public surface clearer. This issue defines the shared
field boundary; the child implementation issues own field-specific generation,
index artifacts, and UI behavior:

- `tags`: shape and public meaning are part of this contract; generation,
  normalization, tag index artifacts, archive routes, and tag URLs belong to
  `shuymn_me-1er.2.2`.
- `updatedAt`: shape and canonical-source git commit basis are part of this
  contract; the deploy-time artifact shape, source-commit lookup, and
  date-display behavior belong to `shuymn_me-1er.2.3`.
- `relatedPostSlugs`: shape and deterministic-input meaning are part of this
  contract; signal selection and generation belong to `shuymn_me-1er.2.6`.
- `series` and `statusNote`: shape and projection location are part of this
  contract; thought-continuity semantics and rendering belong to
  `shuymn_me-1er.3`.
- Search-specific index data is not part of this baseline metadata contract
  until `shuymn_me-1er.2.5` chooses the compact search surface.

All baseline projection metadata fields are optional. Invalid present metadata
or generated public data should fail the projection workflow. Missing metadata
should be omitted and handled by consumers as absent, not inferred from author
source frontmatter, filesystem timestamps, page-render-time git calls, or
runtime LLM calls.

## Editorial Automation

Direct writing remains human-centered: title, core argument, examples, and final
publication judgment stay under the author's control. Work around writing should
be automated when it can be derived from the post or from existing site
structure:

- tags
- series metadata
- summaries and descriptions
- OGP image text and layout inputs
- related posts
- English article generation
- table-of-contents data
- internal link suggestions
- publish checklist findings
- stale, superseded, or materially updated status hints

Use a layered automation approach:

1. Deterministic extraction from headings, links, existing taxonomies, slugs,
   dates, code blocks, and known project names.
2. Existing non-LLM methods for search, similarity, link analysis, and content
   health checks.
3. LLM-assisted suggestions for semantic tags, series placement, summary,
   related posts, and editorial findings.

LLM-generated editorial metadata is proposed metadata, not hidden authority. It
may live as generated state while being evaluated, but it becomes public
metadata only when the workflow writes it into projection frontmatter or another
documented generated public data artifact, or when the deploy workflow writes a
documented publish-time public artifact.

## OGP Image Generation

Post-specific OGP images are distribution automation, not manual editorial work.
They should be generated from durable post metadata rather than hand-designed for
each post.

Start with deterministic template generation from a stable visual template:

- base image
- site name
- post title
- primary tag or series when available and visually useful
- locale

The OGP URL should include a stable version component derived from durable
metadata or source content. Social preview caches are often outside the site's
control, so changing post metadata must be able to produce a new image URL
without relying only on cache purge.

The renderer must not depend on LLMs or image-generation models. It must use
locale-aware wrapping and must not split English words, Japanese word segments,
code identifiers, or URLs in the middle. If a single unbreakable token cannot fit
within the image width, the renderer should reduce font size or use a deliberate
overflow fallback instead of inserting an arbitrary mid-word break.

Do not choose the rendering library on aesthetics alone. The implementation must
prove that the selected renderer works in both local development and the
Cloudflare runtime before it becomes the primary OGP path. If a dynamic PNG route
requires unsupported runtime behavior, generate cacheable assets ahead of time
and serve those assets instead.

## English Article Generation

English article generation remains an explicit target after the Japanese
author source cutover. The goal is not to turn every post into a polished
bilingual publication by hand; it is to make English distribution available when
useful while keeping the Japanese post as the source record.

The future implementation should be an author source command that:

- reads eligible Japanese author source and generated projection metadata
- treats the Japanese post body as source data, not as prompt instructions
- asks translator and reviewer calls for small structured outputs
- uses Markdown as the LLM body boundary and author source as the storage
  boundary
- preserves code blocks, links, headings, Markdown tables, and technical
  identifiers
- records source hashes, prompt versions, reviewer versions, provider details,
  gate results, and failure reasons
- promotes passing candidates into English source/projection outputs
- keeps failed generations unpublished
- never silently overwrites manually edited English source
- renders the visible translation note from a fixed site template

Published Japanese posts should be eligible by default unless the author
explicitly disables translation or a deterministic precheck rejects the post.
Mandatory human review should be added only after measured quality, failure rate,
or operational noise proves the automated gates are insufficient.

## Infrastructure Telemetry

Access analytics are not a content-source concern for this site. Cloudflare
should own raw traffic and infrastructure signals:

- page views and path-level traffic
- referrers and search-entry paths
- countries or coarse geography if needed
- bot and crawler traffic
- 404s and other status codes
- cache behavior and performance signals

Repository tooling may consume or display derived insights only when they help
operate the content:

- mapping paths back to posts, tags, and series
- identifying old posts that still receive traffic and may need updates
- identifying broken links or missing redirects
- finding topic clusters that are repeatedly referenced
- comparing Cloudflare path data with committed publication metadata

Do not build first-party pageview collection unless Cloudflare cannot provide a
required signal.

## Implementation Sequence

Completed cutover foundation:

- The authoring content contract is defined in `docs/design/authoring-content-contract.md`.
- Japanese author source lives under root `posts/*.md`.
- Historical Japanese post bodies were recovered from git history; see
  `docs/design/japanese-source-recovery.md`.
- EmDash runtime integration, scripts, seed/bootstrap/deploy paths,
  dependencies, environment requirements, and operational instructions have been
  removed from the deployable target.
- Public Japanese post routes prerender from author source and generated
  projection frontmatter.

Next product work:

- Rebaseline open bd issues that still mention EmDash or rich-frontmatter
  assumptions.
- Add recall backbone features: tags, archives, search entry point, RSS/sitemap
  verification, and deterministic related navigation.
- Add thought-continuity features: series support, table of contents, visible
  update/status notes, and related posts from deterministic signals.
- Add distribution automation: deterministic OGP images and author source English
  generation.
- Add maintenance feedback: publish checklist, internal link checks, redirect
  rules, and Cloudflare-first telemetry interpretation.

## Implementation Boundaries

- Prefer author source contract changes before adding editor or CMS
  dependencies.
- Keep author source, generated state, and build projection as separate layers.
- Keep public content static-first. Use SSR only for surfaces with real
  request-time state, such as authenticated preview, admin/editor helpers,
  generation endpoints, or telemetry interpretation.
- Keep raw access analytics in Cloudflare unless there is a concrete signal the
  platform cannot provide.
- Keep generated OGP images cacheable, deterministic, runtime-compatible, and
  versioned by source content or generated projection metadata.
- Keep future English generation gated by automated review and deterministic
  checks, but do not make English generation a dependency of the current
  deployment gate.
- Do not add a feature unless it improves at least one of recall, readability,
  maintenance, distribution, or reduction of non-writing editorial toil.

## Verification Plan

For each implementation slice:

- Run the narrowest relevant check first.
- For author source contract changes, validate author source parsing, generated
  metadata validation, generated state isolation, and build projection output
  with focused tests before changing routes.
- For future English generation, test the full auto-publish path against local
  source/projection data and verify note rendering, source linkage, slug
  stability, preserved code blocks, preserved links, preserved Markdown tables,
  and recorded gate results before considering the workflow valid.
- For generated OGP images, verify the selected renderer locally and in the
  Cloudflare runtime, including long Japanese and English titles, before making
  it the primary `og:image` path.
- For Cloudflare telemetry, verify credentials remain outside public state and
  that only durable derived aggregates are written to generated state.
- For page/component changes, run `pnpm run typecheck`.
- Before marking a non-trivial slice done, run `pnpm run build`.
- Capture the exact commands and notable output in the completion report.

## Related Documents

- [ADR 0001: Position The Site As A Memorandum-First Blog Platform](../adr/0001-blog-platform-direction.md)
- [ADR 0003: Adopt Astro Author Source Public Path](../adr/0003-adopt-astro-author-source-public-path.md)
- [Authoring Content Contract](authoring-content-contract.md)
- [Japanese Source Recovery](japanese-source-recovery.md)
