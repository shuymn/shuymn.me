# ADR 0001: Position The Site As A Memorandum-First Blog Platform

Status: Accepted
Date: 2026-05-08

## Context

`shuymn.me` has moved from Next.js to Astro + EmDash. The site is a personal
site, but its primary practical role is a blog. The author wants to record
AI-related thinking and implementation decisions regularly so that past context
remains searchable and reusable.

WordPress has mature blogging conventions and plugin ecosystems, but many of
those practices are aimed at traffic growth, ads, affiliate publishing, and
conversion optimization. Those are not the goal for this site.

## Decision

Treat `shuymn.me` as a memorandum-first blog platform.

Adopt WordPress-derived ideas only when they improve one of these outcomes:

- recall of past thinking
- readability of individual posts
- maintenance of published URLs and metadata
- distribution through standard blog surfaces
- reduction of non-writing editorial work

Do not adopt features whose main purpose is advertising, affiliate revenue,
growth funnels, or traffic-driven content production.

Treat the baseline as the minimum acceptable blog platform rather than the
smallest possible first slice. The baseline includes the recall backbone,
deterministic OGP generation, gated English auto-publication, and
Cloudflare-first telemetry. Features that require more evidence, such as
mandatory human review for English translations, embedding-based related posts,
or EmDash-side analytics reports, stay adaptive and reversible.

For implementation, keep public rendering surfaces in site-native EmDash schema,
Astro pages, and components. Use first-party EmDash plugins for editorial
automation around writing, including tag suggestions, series suggestions,
summaries, English article generation, OGP image generation inputs, related
posts, publish checks, and maintenance hints.

Do not treat EmDash plugins as the default implementation boundary for every
feature. Plugins are appropriate for editing lifecycle hooks, suggestion
generation, review state, admin UI, constrained provider calls, and content
writes that the verified standard content API can express. Features that need
public cacheable routes, durable localized content creation, translation linkage,
taxonomy relationship writes, Cloudflare bindings, infrastructure telemetry, or
long-running jobs should not be forced into a standard plugin. If the verified
standard plugin surface cannot express the whole contract, use site-native Astro
routes, host-side APIs, CLI automation, trusted first-party extensions, or
standalone Cloudflare Workers instead.

For the currently installed EmDash 0.9.0 API, the standard plugin
`content:write` surface writes collection field data and optional SEO metadata,
but not `slug`, `status`, `locale`, `translationOf`, author/byline,
`publishedAt`, publish state, or taxonomy relationships. English
auto-publication, accepted taxonomy assignments, and public OGP image delivery
therefore need a verified host-side/API/CLI/trusted-extension path rather than a
pure standard plugin implementation.

Plugin hooks are triggers, not the sole source of durable publishing changes.
`content:beforeSave` must stay deterministic and must not call LLM providers.
`content:afterSave` and `content:afterPublish` may mark generated suggestions
stale or enqueue review work, but accepted metadata, taxonomy, locale, and
translation writes must go through an explicit admin action, CLI path, or private
host-side automation path that is authenticated, narrowly scoped, and verifies the
resulting EmDash record.

Generated editorial metadata must be inspectable and overrideable. LLM metadata
output is accepted as a suggestion layer, not as hidden authority. English
translation records follow the separate gated auto-publication path.

Post-specific OGP images should be generated automatically from durable post
metadata. Start with deterministic, cacheable template-generated images and keep
the current static fallback for pages or failures that do not have a generated
image. The OGP renderer should compose a stable base image with accepted text such
as the author-written title and optional tag or series label. It should not use
image-generation AI. For English posts, the title may come from the
automated-reviewed English article-generation workflow, but the image rendering
process remains deterministic.

Generated OGP image URLs should be versioned by accepted metadata so social
preview caches can observe changes. The renderer must be proven in the Cloudflare
runtime before a dynamic route becomes the primary path; otherwise, generate and
serve cacheable assets ahead of time.

OGP title wrapping must use locale-aware segmentation and must not split English
words, Japanese word segments, code identifiers, or URLs in the middle. If a token
cannot fit, use controlled font scaling or an explicit overflow fallback rather
than arbitrary mid-word breaking.

English article generation remains in scope. Generated English posts should be
derived from the Japanese source, run through automated translation review and
deterministic checks, then auto-published with a visible note that the Japanese
post is canonical. The note should be rendered from a fixed site template, not
from LLM output. Translator and reviewer prompts must treat the Japanese post body
as source data rather than instructions. The existing English route shape makes
rendering feasible, but the implementation must explicitly solve localized
content creation and source/translation linkage instead of assuming the standard
plugin API can write every required field.

English generation eligibility should be automatic by default for published
Japanese posts. A post should be skipped only when the author explicitly disables
translation or a deterministic precheck rejects unsupported content, missing
required fields, or known-private material.

English generation is a two-stage workflow: first create a source-versioned
candidate with automated review results, then auto-publish it through a write path
that can set `slug`, `locale`, and `translationOf` and verify the result. A human
review gate should be added only if measured translation quality or pipeline
reliability is not good enough for automatic publication, such as repeated
semantic mistranslations, frequent check false positives or false negatives,
regeneration churn, or reader/editor reports. Regeneration must not silently
overwrite an edited English version, and failed generations must not block the
Japanese publication flow.

Locale-aware OGP generation is also in scope. Because OGP image paths can be
separate per locale and slug, generated OGP routes are a lower-risk first slice
than full translated content writes.

Access analytics are infrastructure telemetry, not EmDash-owned content data.
Cloudflare is the primary source of truth for raw traffic, status-code, cache,
bot, and performance signals. EmDash may later interpret Cloudflare path data in
terms of posts, tags, series, and maintenance needs, but it should not collect
page views itself by default.

## Consequences

- Early work should prioritize tags, search, archives, series, updated-date
  visibility, RSS/sitemap checks, and table-of-contents support, with automation
  for metadata that is not direct writing.
- SEO work should focus on accurate metadata, canonical URLs, structured data,
  and share previews, not keyword score chasing. SEO feedback should be
  checklist-style guidance rather than a writing target.
- Tagging, series placement, summaries, related posts, and stale-content hints
  should be generated or suggested by deterministic methods and LLM-backed
  plugin workflows before requiring manual input.
- Plugin-backed automation should stop at suggestion or review state when the
  standard plugin API cannot express the durable write. Host-side code should own
  public routes, localized content identity, and infrastructure integrations.
- LLM-backed work should be observable, idempotent, and retryable. It should not
  block ordinary save/publish operations.
- English article generation should auto-publish passing translations with a
  visible note and preserve the Japanese source record as authoritative.
- OGP image work should begin with a generated route or cacheable asset based on
  a base image, title, optional tag or series, locale, site identity, and accepted
  metadata version, with verified word-boundary wrapping for Japanese and English
  titles.
- Analytics work should start from Cloudflare telemetry. Any EmDash-side
  analytics feature should be an interpreter that maps infrastructure data to
  content maintenance questions, not a parallel pageview collector.
- The content model can break backward compatibility when needed because the
  repository explicitly does not require compatibility unless requested.

## Related Design

- [Blog Platform Design](../design/blog-platform.md)
