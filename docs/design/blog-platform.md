# Blog Platform Design

Status: Draft
Date: 2026-05-08

## Context

`shuymn.me` is a personal site and mostly-blog built with Astro and local
Markdown content collections. The site should become the primary place to
preserve what the author was thinking, building, and deciding at a point in
time, especially around AI-related work.

The main value is personal recall and durable reference. External publishing
value is useful, but secondary. The platform should therefore borrow mature
blogging patterns from WordPress without drifting into affiliate, ad, or
conversion-driven publishing.

Current implementation baseline:

- Published posts are repository-local Markdown files under
  `src/content/posts/<locale>/<slug>.md` as the current migration projection,
  not as the final author-source contract.
- Stable home/profile sections are repository-local Markdown files under
  `src/content/site-sections/<locale>/`.
- The site renders the home page, localized home pages, and localized post
  detail pages from Astro content collections instead of EmDash runtime reads.
- The site has Japanese public post routes. English post routes remain reserved
  for future generated translations, but generated English post files and the
  English generation pipeline are intentionally outside the current cutover.
- OGP images currently fall back to one static default image through
  `DEFAULT_OG_IMAGE_URL`.
- There are no current taxonomies, series, archive pages, search page, related
  post surfaces, redirect management, or post-level publishing checklist.

Foundation reconsideration:

- ADR 0002 pauses further CMS commitment while a local Markdown-family canonical
  source spike is evaluated.
- ADR 0003 resolves the spike direction: the next public-content target is an
  Astro-only local-source architecture.
- `docs/design/local-source-contract.md` defines the minimum file layout and
  projection command for the EmDash-free cutover.
- The memorandum-first goals in this document remain in force. EmDash-specific
  implementation assumptions below are historical context or unpublished
  migration references, not part of the deployable replacement target.
- The local-source spike is motivated by Coding Agent assisted drafting,
  reviewable local diffs, Markdown as the translation boundary, and avoiding a
  cloud-hosted Portable Text canonical body.
- The local-source target is not a rich-frontmatter authoring model. The final
  contract must separate author-written source, accepted metadata, generated
  suggestion state, and the Astro build projection.
- Image upload and external asset storage are intentionally deferred from that
  spike.

Atomic cutover status:

- The replacement target is no longer a mixed EmDash/local-Markdown branch.
- The deployable target uses Astro local source, accepted metadata, and a build
  projection for Japanese posts.
- Blog author source and accepted metadata live under root `content/`, outside
  `src/`. `src/content/posts/` is the Astro projection, not the canonical source.
- Japanese canonical post bodies have been reconciled with the historical
  Markdown sources available in git history under `_posts/`.
- EmDash runtime, scripts, dependencies, seed/bootstrap/deploy paths,
  environment requirements, and operational instructions have been removed from
  the deployable target, except for archived ADR/design history.
- English generation is a post-cutover follow-up. No generated `en/*.md` files
  are required for the EmDash-free deployment.

## Local Source Model

The deployable target is local-source first, not CMS first and not
frontmatter-first.

Author source:

- contains the post title and body in a Markdown-family format
- keeps only the minimal publish envelope needed to make the source addressable
- remains the part Coding Agents and local editors primarily draft, review, and
  translate

Accepted metadata:

- is stored in local sidecar data, not mixed into the author-written body file by
  default
- contains durable publishing inputs such as slug, publication date, update date,
  tags, series, summary, SEO metadata, OGP inputs, redirects, visibility status,
  and material revision notes
- is inspectable and overrideable before generated values affect published pages

Generated state:

- stores suggestions, prompt versions, provider output, validation failures,
  rejected candidates, and retry state separately from both author source and
  accepted metadata
- may be committed only when it is useful evidence; it is never the hidden source
  of published truth

Build projection:

- combines author source and accepted metadata into the Astro collection or
  loader shape required by public pages
- is regenerable implementation output, so it can evolve when Astro or editor
  tooling changes
- must be the only layer that adapts to Astro-specific schema/frontmatter
  constraints

## Goals

- Make old thinking easy to rediscover by topic, series, time, and search.
- Keep the writing flow light enough for frequent notes, not only polished
  essays.
- Automate editorial metadata and maintenance work that is not the act of
  writing itself.
- Preserve provenance: publication date, update date, revisions, and visible
  status for materially revised posts.
- Provide enough SEO and sharing metadata for posts to travel well, without
  optimizing the whole site around traffic acquisition.
- Generate post-specific OGP images automatically so sharing quality does not
  depend on manual image production.
- Generate English versions of eligible published posts automatically while
  preserving automated quality gates and the Japanese source as the primary
  record.
- Treat traffic and infrastructure telemetry as a Cloudflare concern first, not
  as an EmDash content-management concern.
- Translate proven WordPress plugin patterns into Astro-native routes,
  deterministic scripts, or replaceable editor helpers only when they improve
  recall, readability, maintenance, or distribution.

## Non-Goals

- Advertising, affiliate disclosure workflows, ad placement, or revenue
  optimization.
- Growth-hacking funnels, popups, gated content, aggressive newsletter prompts,
  or conversion-rate tooling.
- Keyword-stuffed publishing workflows where SEO score is more important than
  accurate personal records.
- Broad CMS generalization beyond this personal blog.
- Perfect first-pass automation for every editorial feature. The first version
  should satisfy baseline requirements and leave lower-confidence ideas easy to
  add, remove, or revise after real use.

## User Stories And Requirements

The requirements use EARS notation.

- When the author publishes a post, the system shall preserve title,
  description, content, slug, publication date, update date, SEO metadata, and
  revision history.
- When a post covers a durable topic, the system shall infer or suggest flat
  tags without requiring the author to maintain them manually.
- When a post belongs to an ongoing line of thought, the author shall be able to
  accept, reject, or adjust a suggested series and readers shall be able to
  navigate the series.
- When the system generates editorial metadata, the author shall be able to
  inspect and override it before it becomes durable published metadata.
- When a reader wants prior thinking on a topic, the system shall expose search,
  tags, archives, and related posts before relying on external search engines.
- When a post is long-form, the system shall expose a table of contents derived
  from headings without requiring duplicated manual markup.
- When a post has been materially updated after publication, the page shall make
  the update date visible near the publication date.
- When a post is shared externally, the system shall provide a post-specific OGP
  image generated from durable post metadata.
- When a Japanese post is published and not explicitly excluded, the system shall
  generate an English version without requiring a manual translation pass first.
- When generated English content passes automated translation review and
  deterministic checks, the system shall publish it with a visible translation
  note instead of requiring routine human approval.
- When generated English content fails automated checks, the system shall keep it
  unpublished and expose the failure reason for manual review.
- When an English version is generated, the author shall be able to inspect, edit,
  unpublish, reject, or regenerate it independently from the Japanese source.
- When a localized post route is shared externally, the system shall generate an
  OGP image for that locale-specific path.
- When a URL changes after publication, the system shall provide an explicit
  redirect path instead of silently losing old links.
- When the author reviews readership signals, Cloudflare-provided telemetry
  shall be the primary source of truth and local metadata shall only store
  derived editorial interpretation when it is worth preserving.
- When the local source/metadata/projection contract changes, the system shall
  make that contract explicit in code and docs before generated values are
  written into durable metadata.

## WordPress Patterns To Translate

| WordPress pattern | Representative plugin family | Useful idea | Local-source translation |
| --- | --- | --- | --- |
| SEO metadata and structured data | Yoast SEO, All in One SEO | Metadata, canonical URLs, XML sitemaps, schema, previews, and content health checks | Store accepted SEO metadata in local sidecar data; render and validate sitemap/RSS/schema/OGP from the build projection |
| Custom fields and content modeling | Advanced Custom Fields | Add structured editorial fields without hardcoding theme behavior | Keep structured fields in the accepted metadata contract only when they drive rendering, editorial decisions, or accepted generated metadata |
| Taxonomy and internal discovery | WordPress categories/tags, related/popular post plugins | Help readers and the author traverse old posts | Add flat tags and optional series as accepted metadata populated through deterministic and LLM-assisted suggestions before asking for manual upkeep |
| Multilingual publishing | WPML, Polylang, TranslatePress | Keep translated versions discoverable without making every translation a separate manual project | After the EmDash-free cutover, generate annotated English source/metadata siblings from Japanese source posts and expose locale-specific URLs and OGP images |
| Table of contents | TOC block/plugin family | Derive navigation from headings for long-form posts | Generate TOC from rendered Markdown headings in `PostArticle.astro` or a focused component |
| Redirect and 404 maintenance | Redirection | Preserve old links and surface broken URLs | Start with local redirect config or Cloudflare rules; add editor support only if manual maintenance becomes frequent |
| Popular posts and stats | WP Popular Posts, Jetpack Stats | Show what is being referenced | Use Cloudflare telemetry as the source of truth; optionally map paths to posts, tags, and series into local derived metadata for editorial interpretation |

## Baseline And Adaptive Scope

Do not optimize for the smallest possible final platform if it fails the actual
blog use case. The product baseline should be large enough to make frequent
writing, recall, sharing, and English distribution useful without turning the
implementation into a complete publishing suite.

The current EmDash-free cutover has a narrower release gate: recover the
Japanese local source, implement the source/metadata/projection boundary, and
remove EmDash from the deployable target. English generation remains a product
baseline after that cutover, but it is not a gate for this deployment.

Baseline capabilities:

- durable post rendering with title, description, content, dates, revisions, SEO
  metadata, and localized routes
- retrieval backbone: tags, archive, search entry point, RSS/sitemap checks, and
  simple related navigation based on deterministic signals such as shared tags,
  series, or recency
- editorial automation state for generated tags, series, summaries, related-post
  hints, English versions, OGP inputs, and publish-check results
- deterministic OGP generation from a base image and accepted text, with
  locale-aware wrapping and cache-safe URLs
- English auto-publication after automated translation, automated review, and
  deterministic checks pass, with a visible translation note
- Cloudflare-first telemetry with only durable derived editorial aggregates
  stored in local metadata when needed

Adaptive capabilities:

- richer series modeling and navigation beyond the baseline
- embedding-based related posts or semantic clustering
- advanced publish health scoring
- a mandatory human review gate for English translations, but only if measured
  translation quality or pipeline reliability is not good enough for auto-publish
- local reporting over Cloudflare-derived aggregates
- newsletter, ActivityPub, or other distribution channels
- additional admin UI around low-frequency maintenance tasks
- alternative LLM providers or Cloudflare Worker implementations when operational
  evidence justifies the split

Adaptive capabilities should remain reversible. If a feature creates maintenance
burden, low-quality metadata, or little recall value after real use, remove it or
fold it back into a simpler workflow.

Baseline means the minimum acceptable blog platform, not a single tiny first
commit. The slices below can ship incrementally, but deterministic OGP generation
and gated English auto-publication remain product baseline requirements after the
EmDash-free cutover, not optional polish.

## Historical EmDash Plugin Boundary

This section is retained as historical design evidence for why the EmDash plugin
path is no longer the deployable target. Do not use it as the current
implementation direction.

EmDash plugins should be treated as an editorial-extension mechanism, not as the
default home for every blog-platform feature. The current plugin surface is
valuable for hooks, review UI, plugin-scoped state, content reads, limited content
writes, media access, and outbound HTTP through declared capabilities. It is not a
full substitute for site-native Astro routes, host-side APIs, EmDash core content
APIs, or Cloudflare infrastructure integrations.

Use a first-party EmDash plugin when the feature is naturally attached to the
editing lifecycle:

- generating or refreshing suggestions after save or publish
- storing review state, prompt versions, and provider configuration
- showing admin UI for generated suggestions
- calling an HTTP LLM provider through declared network capabilities
- writing accepted metadata when the standard content API can express the write

Avoid forcing a feature into a standard plugin when it needs control over the
content envelope or public delivery surface:

- `slug`, `status`, `locale`, `translationOf`, author, byline, or translation
  group writes
- taxonomy relationship writes that are not exposed through plugin context
- public cacheable binary routes such as generated OGP images
- RSS, sitemap, archive, search, and other public page routing
- direct Cloudflare bindings, Cloudflare Analytics, logs, or other infrastructure
  telemetry
- long-running batch jobs, retries, or work that must survive request lifecycle
  failures

When the standard plugin surface cannot express the required contract, prefer the
smallest site-native, host-side API, CLI, trusted first-party extension, or
standalone Cloudflare Worker that does. A plugin may still own suggestion
generation and review state, but durable publishing actions should live where the
relevant EmDash or infrastructure API is available.

Verified boundary for the currently installed EmDash 0.9.0 API:

- Standard plugins can declare `content:read`, `content:write`, `media:read`,
  `media:write`, `network:request`, scoped storage, KV, hooks, and plugin routes.
- Standard plugin `content:write` exposes `ctx.content.create`, `update`, and
  `delete`, but its write input is collection field data plus optional `seo`.
  It does not expose the full content envelope needed for `slug`, `status`,
  `locale`, `translationOf`, author/byline, `publishedAt`, or publishing state.
- EmDash's REST/API handler and CLI content command can create localized
  translation siblings with `slug`, `locale`, and `translationOf`, then publish
  the result. Use that host-side/API/CLI path for English auto-publication unless
  the standard plugin API grows an equivalent verified contract.
- Taxonomy relationship writes are available through EmDash's content-term API
  and database repository, not through the current plugin context. A plugin may
  propose accepted terms, but the actual relationship write should use a private
  host-side/API path or trusted first-party extension.
- Plugin routes return JSON-shaped API responses through
  `/_emdash/api/plugins/...`; they are not the right primary surface for public,
  cacheable binary OGP images. OGP rendering should live in an Astro route,
  pre-generation CLI, host-side service, or standalone Worker depending on
  Cloudflare runtime proof.
- Sandboxed plugins run in isolated workers with capability-gated access,
  restricted HTTP through `allowedHosts`, no Node built-ins, resource limits, and
  no direct Cloudflare bindings. Cloudflare Analytics, R2/D1 binding work,
  scheduled durable jobs, and raw infrastructure telemetry should stay outside
  the standard plugin.

Verification evidence: `package.json` uses `emdash` 0.9.0; inspected
`node_modules/emdash/src/plugins/types.ts`, `plugins/context.ts`,
`plugins/hooks.ts`, `api/schemas/content.ts`, `api/handlers/content.ts`,
`astro/routes/api/content/[collection]/index.ts`,
`astro/routes/api/content/[collection]/[id]/publish.ts`,
`astro/routes/api/content/[collection]/[id]/terms/[taxonomy].ts`,
`plugins/routes.ts`, `astro/routes/api/plugins/[pluginId]/[...path].ts`, and
`cli/commands/content.ts`.

Use a standalone Cloudflare Worker when the work is primarily infrastructure-side:

- reading Cloudflare Analytics, logs, queues, schedules, R2, D1, Workers AI, or
  other Cloudflare bindings directly
- running scheduled or retryable jobs outside the Astro request lifecycle
- isolating credentials and operational permissions away from EmDash admin/plugin
  state
- exposing a narrow internal API that EmDash or a CLI can call after explicit
  acceptance

Do not split work into a Worker only for architectural neatness. If the standard
plugin surface can express the task cleanly, keep it in the plugin.

Hard rules for plugin-backed automation:

- Do not call LLM providers from `content:beforeSave`; saving content must remain
  fast and deterministic.
- Treat `content:afterSave` and `content:afterPublish` as best-effort triggers.
  They may mark suggestions stale, enqueue work, or refresh non-critical review
  state, but they must not be the only path that makes durable publishing changes.
- Require idempotency keys based on post ID, locale, source revision or
  `updatedAt`, provider, and prompt version for generated suggestions.
- Keep accepted writes behind an explicit admin action, CLI command, or private
  automation path that is authenticated, narrowly scoped, and able to verify the
  returned EmDash record.
- Use trusted first-party extensions only for code that needs process, database,
  runtime binding, or custom rendering access. Do not install third-party trusted
  plugins for these capabilities.
- Keep secrets in environment or infrastructure bindings. Plugin storage may hold
  preferences and generated state, not long-lived Cloudflare or LLM secrets unless
  the storage and admin surface have been explicitly reviewed for that purpose.

## Historical Host-Side Automation Boundary

This section describes the pre-ADR-0003 EmDash deployment and automation
boundary. It is retained as evidence for why durable publishing writes should be
owned by a narrower first-party contract, not as the current implementation
target.

The removed implementation used host-side scripts for schema deployment and
English generation against an EmDash HTTP endpoint. Those scripts, seed files,
environment variables, and package dependencies are no longer part of the
deployable target. The durable lesson that remains is narrower: future
automation should read local author source and accepted metadata, produce a
reviewable diff or generated-state record, and write accepted values through the
local source contract rather than through a CMS-owned body store.

If a future Cloudflare-native workflow or GitHub Action is added, it should call
the same local-source command used by humans and should keep credentials,
idempotency, dry-run behavior, fail-fast validation, and post-write verification
explicit. Do not recreate a separate CMS deployment path unless a later ADR
reintroduces a CMS boundary.

## Historical EmDash Content Model Direction

This section describes the EmDash-era model that informed the local-source
contract. New implementation work should translate the durable parts into author
source, accepted metadata, generated state, and build projection instead of
adding EmDash schema or plugins.

### Posts

Keep `posts` as the only primary publishing collection for now. Add fields only
when they directly support recall, publishing quality, or rendering:

- `summary`: short durable abstract distinct from SEO-only description.
- `original_context`: optional note about project, repo, experiment, or event
  that produced the post.
- `status_note`: optional visible note for draft-like, exploratory, outdated, or
  superseded posts.
- `canonical_url`: optional external canonical target if a post is syndicated.

Do not add fields for campaign tracking, affiliate state, or lead-generation
copy.

### Taxonomies

Add taxonomies in this order:

1. `tag`: flat terms for concepts, technologies, projects, and recurring
   questions.
2. `series`: flat or hierarchical terms for ongoing thought sequences.
3. `category`: optional hierarchical taxonomy only if tags become too broad.

Tags should remain author-centered and retrieval-oriented. A tag is worth adding
when the author expects to search for it later.

### Editorial Automation

Direct writing remains human-centered: title, core argument, examples, and final
publication judgment should stay under the author's control. Work around the
writing should be automated when it can be derived from the post or from existing
site structure:

- tags
- series suggestions
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

LLM-generated editorial metadata should be treated as proposed metadata, not as
hidden authority. The system should either store it separately as generated
suggestions or require an explicit acceptance path before it becomes published
metadata. English translation records are handled separately by the gated
auto-publication workflow.

The first implementation target is a first-party EmDash editorial automation
plugin plus a narrow host-side acceptance path. The plugin can react to
`content:afterSave` and `content:afterPublish` by marking suggestions stale,
reading the post, and preparing plugin-scoped review state. LLM calls should run
from an explicit admin action, private plugin route, host-side job, or CLI command
where timeouts, retries, provider credentials, and user feedback are observable.
If the standard plugin API cannot write a required taxonomy relation or
locale-aware content field, add the smallest host-side API or trusted first-party
extension needed instead of pretending the pure plugin surface can do it.

### OGP Image Generation

Post-specific OGP images are distribution automation, not manual editorial work.
They should be generated from durable post metadata rather than hand-designed for
each post.

Start with deterministic template generation from a stable visual template:

- base image
- site name
- post title
- primary tag or series when available and visually useful
- locale

The first rendering path should prefer a server route such as
`/og/posts/[slug].png` or an equivalent cacheable generated asset. The current
static `DEFAULT_OG_IMAGE_URL` should remain as a fallback for home pages,
not-found pages, and generation failures.

The OGP URL should include a stable version component derived from accepted
metadata, such as locale plus an `updatedAt` or content-hash segment. Social
preview caches are often outside the site's control, so changing post metadata
must be able to produce a new image URL without relying only on cache purge.

Generated OGP images should be:

- legible at social-preview sizes
- visually consistent with the site
- stable for the same published metadata
- cacheable at the edge
- free of clickbait, ad-style calls to action, or decorative noise
- wrapped at locale-aware word or line-break boundaries, without splitting English
  words, Japanese word segments, code identifiers, or URLs in the middle

The OGP renderer itself should not depend on LLMs or image-generation models. For
Japanese posts, the author-written title is the primary text input. For generated
English posts, the English title may be LLM-generated and automated-reviewed as
part of the article generation workflow, but image rendering should remain
deterministic composition of the base image and accepted title or tag text.

Do not choose the rendering library on aesthetics alone. The implementation must
prove that the selected renderer works in both local development and the
Cloudflare runtime before it becomes the primary OGP path. If a dynamic PNG route
requires Node-only libraries, native binaries, unsupported font handling, or
direct media writes that the Cloudflare runtime or sandboxed EmDash plugins cannot
provide, generate a cacheable asset ahead of time through a host-side service or
CLI and serve that asset instead. A plugin can still own review state,
regeneration triggers, and provider settings.

The renderer should use bundled or repo-owned base images and fonts rather than
fetching remote assets during preview generation. Long Japanese and English
titles must be layout-tested before the route is considered done. Text wrapping
should use a real segmentation algorithm, such as Unicode line-breaking rules,
`Intl.Segmenter` where runtime support is available, or a Cloudflare-compatible
library with equivalent behavior. If a single unbreakable token cannot fit within
the image width, the renderer should reduce font size or use a deliberate overflow
fallback instead of inserting an arbitrary mid-word break.

OGP generation should be locale-aware. Because localized routes already use
distinct paths, the OGP route can also be distinct, such as
`/og/posts/[slug].png` for the default locale and `/en/og/posts/[slug].png` or
an equivalent localized path for English. This is lower risk than generating
translated content records because the route can render from the already-resolved
post data for that locale and fall back cleanly when localized content is not
available.

### English Article Generation

English article generation remains an explicit target. The goal is not to turn
every post into a polished bilingual publication by hand. The goal is to make
English distribution available when useful, while keeping the Japanese post as
the source record.

Suitability should not become a hidden manual selection gate. Published Japanese
posts should be eligible for English generation by default unless the author
explicitly disables translation for that post or a deterministic precheck rejects
unsupported content such as missing required fields, unsupported block types, or
known-private material.

The generated English workflow should:

- read the Japanese post after save or publish
- treat the Japanese post body as source data, not as instructions to the
  translator or reviewer prompts
- translate field-to-field: Japanese title to English title, Japanese
  description to English description only when the source description is set, and
  Japanese SEO meta description to English SEO meta description only when the
  source SEO meta description is set
- keep English SEO title equal to the English post title when the Japanese source
  has SEO title set; otherwise leave English SEO title unset
- request translator and reviewer outputs through schema-backed structured
  output, not through prompt-only JSON formatting
- use Markdown as the LLM body boundary and Portable Text as the storage boundary
- preserve code blocks, links, headings, Markdown tables, and technical
  identifiers
- run automated translation review, preferably with a separate prompt or reviewer
  pass from the translator
- run deterministic checks for required note section, source linkage, preserved
  code blocks, preserved links, Markdown table count, and unsupported content
  patterns
- record the source post, source revision or `updatedAt`, generation timestamp,
  provider, prompt version, reviewer version, and gate results
- publish automatically when gates pass
- keep failed generations unpublished with a visible failure reason
- allow independent editing, unpublishing, rejection, and regeneration
- expose the English version at the existing English route shape
- render a visible note section from a fixed site template at the beginning that
  explains the English text is automatically translated and that the Japanese post
  is the canonical source

The current public route shape makes rendering the English page feasible:
localized paths are already distinct. The harder contract is durable content
creation: a translated sibling needs locale, slug, source/translation linkage,
generated-state provenance, and accepted metadata promotion without making the
LLM output a large JSON document tree.

English generation should be two-stage, but not human-gated by default. Stage one
creates a source-versioned generated candidate with translated fields and gate
metadata under generated state. Stage two promotes a passing candidate into
English author source and accepted metadata, preserving `slug`, `locale`,
source/translation linkage, and the Japanese source `publishedAt`. If measured
quality, failure rate, or operational noise is not good enough, add a human
review gate at that point. Regeneration should be explicit when the Japanese
source changes; it should not silently overwrite an edited English version.

The human gate decision should be evidence-driven rather than precautionary by
default. Add mandatory human approval only after observed failures such as
repeated semantic mistranslations, frequent deterministic-check false positives
or false negatives, excessive regeneration churn, or reader/editor reports that
the visible translation note and automated review are insufficient. Until then,
failed or unsupported generations should stop as unpublished candidates while the
Japanese publication flow remains unblocked.

The future baseline implementation path should be a local-source command. It
will scan published Japanese author source and accepted metadata, skip posts
whose accepted metadata disables translation, call a translator and separate
review pass, write generated candidates as generated state, then promote passing
results into `content/source/posts/en/<slug>.md` and
`content/metadata/posts/en/<slug>.json`. The English title never drives the
localized slug; URLs remain stable across locales. The translator should perform
field-to-field metadata translation instead of synthesizing descriptions from
the body: source `title` becomes English `title`, source `description` becomes
English `description` only when it is set, and source SEO meta description
becomes English SEO meta description only when it is set. English SEO title is
derived from the English post title only when the Japanese source has SEO title
set.

Translator and reviewer responses should use small structured outputs: translated
title, optional metadata fields, Markdown body, review pass/fail, and concrete
failure reasons. Do not ask the model to emit complex Portable Text-like JSON.
Markdown remains the translation body boundary and local author source remains
the storage boundary. Existing deterministic protections still apply: preserve
table count, code fence count, links, source-version hashes, and manual-edit
guards; source changes require explicit regeneration, and apparent manual edits
require explicit force.

### Infrastructure Telemetry

Access analytics are not an EmDash source-of-truth concern for this site. Unlike
a typical WordPress installation where analytics often live inside CMS plugins,
this personal site can use the hosting and edge layer directly.

Cloudflare should own raw traffic and infrastructure signals:

- page views and path-level traffic
- referrers and search-entry paths
- countries or coarse geography if needed
- bot and crawler traffic
- 404s and other status codes
- cache behavior and performance signals

Local-source tooling may consume or display derived insights only when they help
operate the content:

- mapping paths back to `posts`, tags, and series
- identifying old posts that still receive traffic and may need updates
- identifying broken links or missing redirects
- finding topic clusters that are repeatedly referenced
- comparing Cloudflare path data with accepted publication metadata

Do not build first-party pageview collection unless Cloudflare cannot provide a
required signal. If a browser editor or CMS layer is added later, it should act
as an analytics interpreter, not as the primary analytics collector.

Cloudflare telemetry ingestion should not depend on the standard plugin context.
Prefer a host-side script, scheduled job, standalone Cloudflare Worker, or another
Cloudflare-native workflow that reads Cloudflare APIs or datasets with
infrastructure-managed credentials and stores only derived aggregates needed for
editorial interpretation.

### Sections And Widgets

Use local site-section content and Astro components for stable site-level
surfaces:

- profile/about content
- search entry points
- recent posts
- tag or topic index
- series index

Avoid sidebar clutter until the site has enough content to justify it.

## Implementation Sequence

### Cutover Slice 1: Local Source Contract

- Define the author-source file shape for Japanese posts, including whether title
  is stored as a heading, minimal frontmatter, or another explicit envelope.
- Define accepted metadata sidecars for slug, dates, summary, SEO metadata,
  tags, series, OGP inputs, redirects, visibility status, and material revision
  notes.
- Define generated-state storage separately from accepted metadata, including
  prompt/provider versions, suggestions, validation failures, and rejected
  candidates.
- Define the build projection that feeds Astro pages or content loaders from
  author source plus accepted metadata.

### Cutover Slice 2: Historical Japanese Recovery

- Recover the previous Japanese Markdown sources from git history where they
  exist.
- Reconcile recovered source with the current EmDash-exported migration
  snapshot.
- Preserve public `/posts/<slug>` URLs while moving canonical Japanese source
  into the new local-source contract.
- Do not generate or require English `en/*.md` files in this slice.

### Cutover Slice 3: EmDash Removal

- Completed for the deployable target: EmDash runtime integration, scripts,
  seed/bootstrap/deploy paths, dependencies, environment requirements, and
  operational instructions were removed.
- Archived ADR/design context remains as historical evidence only.
- Public Japanese post routes prerender from local source and accepted metadata
  without EmDash reads.

### Product Baseline After Cutover

- Add recall backbone features: tags, archives, search entry point, RSS/sitemap
  verification, and deterministic related navigation.
- Add thought-continuity features: series support, table of contents, visible
  update/status notes, and related posts from deterministic signals.
- Add distribution automation: deterministic OGP images and, after the cutover,
  gated English generation through the local-source contract.
- Add maintenance feedback: publish checklist, internal link checks, redirect
  rules, and Cloudflare-first telemetry interpretation.

## Implementation Boundaries

- Prefer local author-source and metadata contract changes before adding editor
  or CMS dependencies.
- Keep author source, accepted metadata, generated state, and build projection as
  separate layers. Do not store generated suggestions in hand-authored post
  frontmatter by default.
- Keep the build projection regenerable. Astro schema or loader details belong in
  projection code, not in the authoring contract.
- Keep public content static-first. Use SSR only for surfaces with real
  request-time state, such as authenticated preview, admin/editor helpers,
  generation endpoints, or telemetry interpretation.
- Put accepted metadata writes behind explicit local commands, editor actions, or
  private automation that can validate and diff the resulting sidecar data.
- Keep raw access analytics in Cloudflare unless there is a concrete signal the
  platform cannot provide.
- Keep generated OGP images cacheable, deterministic, runtime-compatible, and
  versioned by accepted metadata.
- Keep future English generation gated by automated review and deterministic
  checks, but do not make English generation a dependency of the current
  EmDash-free cutover.
- Do not add a feature unless it improves at least one of recall, readability,
  maintenance, distribution, or reduction of non-writing editorial toil.

## Alternatives Considered

### Manual Editorial Metadata

Asking the author to manually maintain tags, series, summaries, related posts,
and checklists would keep the first implementation simple, but it would make the
blog harder to use regularly. It also pushes work onto the least valuable part of
the writing process.

### Fully Automatic Publishing Metadata

Automatically applying every LLM suggestion would reduce friction, but it risks
polluting durable metadata with unstable model output and makes later retrieval
less trustworthy.

### Plugin-Assisted Editorial Automation

Using deterministic checks and LLM-backed suggestions still keeps original
Japanese writing human-controlled while removing repetitive metadata work. The
accepted version of this approach is no longer an EmDash plugin: suggestions
should be stored as generated state and promoted into accepted local metadata
through an explicit acceptance path.

### EmDash-Collected Analytics

Collecting page views directly in EmDash would mirror common WordPress plugin
patterns, but it duplicates infrastructure data the author can already inspect
through Cloudflare. It also adds privacy, retention, and performance concerns to
the CMS layer without improving the writing workflow.

### Cloudflare-Backed Telemetry

Using Cloudflare as the primary telemetry source keeps raw access data at the
edge. The local metadata layer can still preserve derived editorial
interpretation of Cloudflare path-level data when it helps with posts, tags,
series, and maintenance needs.

### Manual OGP Image Production

Creating a bespoke OGP image for every post would improve sharing quality, but it
does not fit the expected writing cadence. It also shifts attention from the post
itself to design production.

### Template-Generated OGP Images

Generating OGP images from post metadata keeps sharing previews useful without
adding manual work. This should be the initial approach because it is
deterministic, cacheable, and easy to inspect.

### Image-Generation-Based OGP Art

Using image-generation models for OGP images would add cost, latency, visual
instability, and review burden without improving the memorandum-first publishing
workflow. It is not part of the current OGP direction. The accepted path is
composition of a stable base image with accepted post text.

### Manual English Translation

Manually translating every post would maximize authorial control, but it is too
expensive for the expected posting cadence and would make English distribution a
separate writing project.

### Ungated English Publishing

Publishing generated English posts without automated review, deterministic checks,
source linkage, or a visible translation note would reduce friction, but it can
introduce semantic drift and make the public archive less trustworthy.

### Human-Gated English Publishing

Requiring human approval before every English publication maximizes authorial
control, but it recreates the manual workload the automation is meant to remove.
It should be added only after the baseline automated pipeline proves insufficient
in practice.

### Gated English Auto-Publishing

Generating English versions, running automated translation review, applying
deterministic checks, and publishing only passing results keeps translation effort
low while preserving source provenance and failure visibility. This is the
preferred baseline direction, with implementation work focused on the content-write
boundary for localized sibling records.

### Start With Site-Native Features

Adding only schema, pages, and components first keeps the public surface small,
but it does not address the author's stated desire to avoid non-writing manual
work.

Chosen approach: build public rendering surfaces site-natively, but design
taxonomies, series, summaries, related posts, and editorial checks around
local-source generated-state and acceptance workflows from the start. Keep access
analytics Cloudflare-first and store only derived interpretation in local
metadata when it is worth preserving. Generate OGP images through deterministic
base-image and text composition. Resume English article generation after the
EmDash-free cutover as a gated auto-publishing baseline, and solve localized
source/metadata creation explicitly rather than assuming a CMS plugin owns the
write path.

## Verification Plan

For each implementation slice:

- Run the narrowest relevant check first.
- For local-source contract changes, validate author-source parsing, accepted
  metadata parsing, generated-state isolation, and build projection output with
  focused tests before changing routes.
- For historical Japanese recovery, compare recovered Markdown sources with the
  migration snapshot and record any intentional differences before treating a
  post as canonical.
- For accepted metadata automation, prove that repeated runs produce idempotent
  suggestions and do not overwrite accepted values without an explicit
  acceptance or force path.
- For future English generation, test the full auto-publish path against local
  source/metadata data and verify note rendering, source linkage, slug
  stability, preserved code blocks, preserved links, preserved Markdown tables,
  and recorded gate results before considering the workflow valid.
- For generated OGP images, verify the selected renderer locally and in the
  Cloudflare runtime, including long Japanese and English titles, before making it
  the primary `og:image` path.
- For OGP text wrapping, test English titles, Japanese titles, mixed
  Japanese/English titles, code identifiers, and URLs to prove that line breaks do
  not split words or tokens mid-segment.
- For Cloudflare telemetry, verify credentials remain outside public/plugin-owned
  state and that only durable derived aggregates are written to local metadata.
- For page/component changes, run `pnpm run typecheck`.
- Before marking a non-trivial slice done, run `pnpm run build`.
- Capture the exact commands and notable output in the completion report.

## References

- [Yoast SEO on WordPress.org](https://wordpress.org/plugins/wordpress-seo/)
- [All in One SEO on WordPress.org](https://wordpress.org/plugins/all-in-one-seo-pack/)
- [Advanced Custom Fields on WordPress.org](https://wordpress.org/plugins/advanced-custom-fields/)
- [Redirection on WordPress.org](https://wordpress.org/plugins/redirection/)
- [WP Popular Posts on WordPress.org](https://wordpress.org/plugins/wordpress-popular-posts/)
- [Jetpack on WordPress.org](https://wordpress.org/plugins/jetpack/)
- [Tidy Table of Contents on WordPress.org](https://wordpress.org/plugins/tidy-table-of-contents/)
