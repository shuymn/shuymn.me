# Blog Platform Design

Status: Draft
Date: 2026-05-08

## Context

`shuymn.me` is a personal site and mostly-blog built with Astro and EmDash. The
site should become the primary place to preserve what the author was thinking,
building, and deciding at a point in time, especially around AI-related work.

The main value is personal recall and durable reference. External publishing
value is useful, but secondary. The platform should therefore borrow mature
blogging patterns from WordPress without drifting into affiliate, ad, or
conversion-driven publishing.

Current implementation baseline:

- The EmDash `posts` collection supports `drafts`, `revisions`, `search`, and
  `seo`.
- Post fields are currently limited to `title`, `description`, and `content`.
- The site renders a home page, localized home pages, and localized post detail
  pages.
- The site already has Japanese and English public routes, but English post
  generation is not automated.
- OGP images currently fall back to one static default image through
  `DEFAULT_OG_IMAGE_URL`.
- There are no current taxonomies, series, archive pages, search page, related
  post surfaces, redirect management, or post-level publishing checklist.

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
- Translate proven WordPress plugin patterns into EmDash-native schema, pages,
  and plugins only when they improve recall, readability, maintenance, or
  distribution.

## Non-Goals

- Advertising, affiliate disclosure workflows, ad placement, or revenue
  optimization.
- Growth-hacking funnels, popups, gated content, aggressive newsletter prompts,
  or conversion-rate tooling.
- Keyword-stuffed publishing workflows where SEO score is more important than
  accurate personal records.
- Broad CMS generalization beyond this personal blog unless a feature has clear
  reuse value inside EmDash.
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
  shall be the primary source of truth and EmDash shall only map those signals to
  content metadata for editorial interpretation.

## WordPress Patterns To Translate

| WordPress pattern | Representative plugin family | Useful idea | EmDash translation |
| --- | --- | --- | --- |
| SEO metadata and structured data | Yoast SEO, All in One SEO | Metadata, canonical URLs, XML sitemaps, schema, previews, and content health checks | Keep EmDash `seo` support, add post-level meta rendering checks, sitemap/RSS verification, generated OGP images, and automated checklist feedback where possible |
| Custom fields and content modeling | Advanced Custom Fields | Add structured editorial fields without hardcoding theme behavior | Extend `seed/seed.json` only for fields that drive rendering, editorial decisions, or accepted generated metadata |
| Taxonomy and internal discovery | WordPress categories/tags, related/popular post plugins | Help readers and the author traverse old posts | Add flat `tag`, optional hierarchical `category`, and a `series` model, but populate them through deterministic and LLM-assisted suggestions before asking for manual upkeep |
| Multilingual publishing | WPML, Polylang, TranslatePress | Keep translated versions discoverable without making every translation a separate manual project | Generate annotated English versions from Japanese source posts, auto-publish when automated gates pass, preserve source/translation linkage, and expose locale-specific URLs and OGP images |
| Table of contents | TOC block/plugin family | Derive navigation from headings for long-form posts | Generate TOC from rendered Portable Text headings in `PostArticle.astro` or a focused component |
| Redirect and 404 maintenance | Redirection | Preserve old links and surface broken URLs | Start with static redirect config or Cloudflare rules; add an EmDash admin/plugin surface only if manual maintenance becomes frequent |
| Popular posts and stats | WP Popular Posts, Jetpack Stats | Show what is being referenced | Use Cloudflare telemetry as the source of truth; optionally map paths to posts, tags, and series inside EmDash for editorial interpretation |

## Baseline And Adaptive Scope

Do not optimize for the smallest possible first slice if it fails the actual blog
use case. The baseline should be large enough to make frequent writing, recall,
sharing, and English distribution useful without turning the first implementation
into a complete publishing suite.

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
- Cloudflare-first telemetry with only derived editorial aggregates flowing back
  into EmDash when needed

Adaptive capabilities:

- richer series modeling and navigation beyond the baseline
- embedding-based related posts or semantic clustering
- advanced publish health scoring
- a mandatory human review gate for English translations, but only if measured
  translation quality or pipeline reliability is not good enough for auto-publish
- EmDash-side reporting over Cloudflare-derived aggregates
- newsletter, ActivityPub, or other distribution channels
- additional admin UI around low-frequency maintenance tasks
- alternative LLM providers or Cloudflare Worker implementations when operational
  evidence justifies the split

Adaptive capabilities should remain reversible. If a feature creates maintenance
burden, low-quality metadata, or little recall value after real use, remove it or
fold it back into a simpler workflow.

Baseline means the minimum acceptable blog platform, not a single tiny first
commit. The slices below can ship incrementally, but deterministic OGP generation
and gated English auto-publication are baseline requirements, not optional polish.

## EmDash Plugin Boundary

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

## EmDash Content Model Direction

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
creation: a translated sibling needs locale, slug, and source/translation linkage
that may not be writable through the current standard plugin content API. If the
standard plugin cannot create that record correctly, use the smallest trusted
plugin or host-side API extension needed to write the localized content
explicitly.

English generation should be two-stage, but not human-gated by default. Stage one
creates a source-versioned generated candidate with translated fields and gate
metadata. Stage two automatically publishes the English record when translation
review and deterministic checks pass, using an API surface that can set `slug`,
`locale`, `translationOf`, and the Japanese source `publishedAt`, then verifies
that the returned record is linked to the Japanese source as intended. If
measured quality, failure rate, or operational noise is not good enough, add a
human review gate at that point. Regeneration should be explicit when the
Japanese source changes; it should not silently overwrite an edited English
version.

The human gate decision should be evidence-driven rather than precautionary by
default. Add mandatory human approval only after observed failures such as
repeated semantic mistranslations, frequent deterministic-check false positives
or false negatives, excessive regeneration churn, or reader/editor reports that
the visible translation note and automated review are insufficient. Until then,
failed or unsupported generations should stop as unpublished candidates while the
Japanese publication flow remains unblocked.

The baseline implementation path is the host-side
`pnpm run generate:english` command. It scans published Japanese posts, skips
posts with `english_generation_disabled`, calls OpenRouter through Cloudflare AI
Gateway for translation and a separate review pass, writes English candidates
through the EmDash REST client with `locale: "en"`, `translationOf`, and the
exact same `slug` as the Japanese source, publishes with the Japanese source
`publishedAt` only after review and deterministic gates pass, and stores failure
reasons in the English draft candidate. The English title never drives the
localized slug; URLs remain stable across locales. The translator performs
field-to-field metadata translation instead of synthesizing descriptions from
the body: source `title` becomes English `title`, source `description` becomes
English `description` only when it is set, and source SEO meta description
becomes English SEO meta description only when it is set. English SEO title is
derived from the English post title only when the Japanese source has SEO title
set. If an already linked English record has slug, optional metadata, or
published date drift, the command repairs that drift without calling the LLM.
The OpenRouter API key and Cloudflare AI Gateway account, gateway name, and
token are provided through environment variables or matching CLI flags.
Translator and reviewer responses are constrained by AI SDK structured output
with Zod schemas so the contract is enforced by the caller instead of prompt text
alone. The automated translation review is a publishability gate, not a
code-review or proofreading pass: it reports only blockers that mean the English
article must not be published. If a blocker exists, `passed` is false and the
blocker appears in `failures` so the edit loop can act on it; if no blocker
exists, `passed` is true and `failures` is empty. When the automated review
fails, the command makes a bounded review-fix pass through an `editTranslation`
tool rather than asking the translator to regenerate the whole article. The edit
tool returns exact `field` + `oldText` + `newText` diffs only; the caller applies
them only when `oldText` appears exactly once in the target field, then re-runs
review on the edited candidate. Existing English records are protected by
source-version and generated-content hashes: source changes require explicit
`--regenerate`, and apparent manual edits require `--force`. The command is
cron/Worker-callable automation, not a pure standard plugin, because the durable
write needs locale, slug, publish state, and translation linkage.

The command uses Markdown as the LLM boundary and Portable Text as the storage
boundary. It reads source posts from EmDash, derives `contentMarkdown`, asks the
translator to return `contentMarkdown`, converts that Markdown back to Portable
Text before writing, and stores the converted Portable Text in EmDash. This
accepts the known limits of Markdown-to-Portable-Text conversion in exchange for
a much smaller structured output schema and a body format that the translation
and review prompts can handle reliably. EmDash table blocks are a supported
bridge case: source tables are rendered as Markdown tables for translation,
translated Markdown tables are converted back to EmDash table blocks, and the
deterministic gate rejects table count drift. If an unexpected per-post error
occurs after generation starts, the command stops the run instead of continuing
to spend provider calls on later posts.

OpenRouter-style HTTP providers fit the standard plugin model better than direct
Cloudflare Workers AI bindings because plugin network access can be expressed as
`network:request` with `allowedHosts`. Cloudflare Workers AI can still be a later
host-side option if the runtime exposes the needed binding cleanly.

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

EmDash may consume or display derived insights only when they help operate the
content:

- mapping paths back to `posts`, tags, and series
- identifying old posts that still receive traffic and may need updates
- identifying broken links or missing redirects
- finding topic clusters that are repeatedly referenced
- comparing Cloudflare path data with EmDash publication metadata

Do not build first-party pageview collection in EmDash unless Cloudflare cannot
provide a required signal. If an EmDash plugin is added later, it should act as
an analytics interpreter, not as the primary analytics collector.

Cloudflare telemetry ingestion should not depend on the standard plugin context.
Prefer a host-side script, scheduled job, standalone Cloudflare Worker, or another
Cloudflare-native workflow that reads Cloudflare APIs or datasets with
infrastructure-managed credentials, stores only derived aggregates needed for
editorial interpretation, and exposes those aggregates to EmDash for display.

### Sections And Widgets

Use EmDash sections/widgets for stable site-level surfaces:

- profile/about content
- search entry points
- recent posts
- tag or topic index
- series index

Avoid sidebar clutter until the site has enough content to justify it.

## Implementation Sequence

### Baseline Slice 1: Recall Backbone

- Add `tag` taxonomy, tag archive pages, and an automated tag suggestion path.
- Add a search page or compact search entry point.
- Add RSS and sitemap verification.
- Show published and updated dates consistently.
- Add a simple archive grouped by year/month.

### Baseline Slice 2: Thought Continuity

- Add `series` support with automated series suggestions.
- Render series navigation on post pages.
- Add related posts from deterministic signals such as shared tags, series, or
  recency.
- Add an optional status note for exploratory/outdated/superseded posts.
- Add a generated table of contents for long posts.

### Baseline Slice 3: Distribution Automation

- Add generated OGP images for posts from deterministic templates.
- Add locale-aware OGP images for English post routes.
- Improve remaining social preview metadata.
- Add English generation for eligible published Japanese posts, with opt-out and
  deterministic precheck exclusions, automated translation review, auto-publish
  gates, visible translation notes, and source/translation linkage.

### Baseline Slice 4: Maintenance Feedback

- Add an automated publish checklist derived from site requirements.
- Add automated link integrity checks for internal post links.
- Add redirect rules for changed slugs or imported legacy URLs.
- Use Cloudflare telemetry as the primary analytics source for readership and
  operational signals.

### Adaptive Follow-Ups

- Add embedding-based related posts or semantic clustering only if deterministic
  related navigation is not enough.
- Add mandatory human review for English translations only if measured quality or
  reliability proves the auto-publish baseline too noisy.
- Add EmDash-side reporting that maps Cloudflare paths to posts, tags, and
  series only if Cloudflare-native views are not enough.
- Consider newsletter or ActivityPub only if publishing cadence makes it useful.

## Implementation Boundaries

- Prefer schema, page, and component changes for public rendering surfaces.
- Prefer first-party EmDash plugins for editorial automation that is adjacent to
  writing but should not be manual writing work.
- Use plugin lifecycle hooks, plugin-scoped storage, admin UI, or host-side
  support when generated metadata needs review, persistence, or provider
  configuration.
- Treat plugin hooks as triggers for review state, not as the sole mechanism for
  durable publishing changes.
- Put accepted writes behind explicit admin-only actions, CLI-controlled actions,
  or private automation paths that are authenticated, narrowly scoped, and able to
  verify returned records after writes that affect slug, locale, translation
  linkage, taxonomy relations, or public metadata.
- Keep `output: "server"` and avoid static-generation assumptions for EmDash
  content.
- Keep all content queries wired to `Astro.cache.set(cacheHint)` when APIs
  provide cache hints.
- Use `entry.id` for post slugs and `entry.data.id` for EmDash APIs that need
  database IDs.
- Keep raw access analytics in Cloudflare unless there is a concrete signal the
  platform cannot provide.
- Keep generated OGP images cacheable, deterministic, runtime-compatible, and
  versioned by accepted metadata.
- Keep English generation gated by automated review and deterministic checks.
  Human review should be added only if measured quality or pipeline reliability is
  not good enough for automatic publication.
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

Using deterministic checks and LLM-backed suggestions inside a first-party EmDash
plugin keeps original Japanese writing human-controlled while removing repetitive
metadata work. English translation follows the separate gated auto-publication
path. This needs a careful acceptance path and clear fallback behavior when the
plugin API cannot write a specific relation directly.

### EmDash-Collected Analytics

Collecting page views directly in EmDash would mirror common WordPress plugin
patterns, but it duplicates infrastructure data the author can already inspect
through Cloudflare. It also adds privacy, retention, and performance concerns to
the CMS layer without improving the writing workflow.

### Cloudflare-Backed Telemetry

Using Cloudflare as the primary telemetry source keeps raw access data at the
edge and lets EmDash stay focused on content semantics. EmDash can still provide
value by interpreting Cloudflare path-level data in terms of posts, tags, series,
and maintenance needs.

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
plugin-assisted automation from the start. Keep access analytics Cloudflare-first
and add EmDash interpretation only if raw telemetry needs content-aware context.
Generate OGP images through deterministic base-image and text composition.
Continue English article generation as a gated auto-publishing baseline, and solve
localized content creation explicitly rather than assuming the current plugin API
already covers every write path.

## Verification Plan

For each implementation slice:

- Run the narrowest relevant check first.
- For schema or seed changes, run the seed/bootstrap flow needed to prove the
  schema loads.
- Before using an EmDash plugin API for a durable write, verify the current
  installed EmDash API can express the required fields or relation. If it cannot,
  move that write to a host-side API, CLI command, or trusted first-party
  extension.
- For plugin-triggered automation, prove that repeated saves produce one
  idempotent suggestion per source version rather than duplicate or stale
  generated state.
- For English generation, test the full auto-publish path against local EmDash data
  and verify the resulting English record has the expected note section, the same
  `slug` as its Japanese source, the same published date as its Japanese source,
  `locale`, source linkage, preserved code blocks, preserved links, preserved
  Markdown tables, and recorded gate results before considering the workflow
  valid.
- For generated OGP images, verify the selected renderer locally and in the
  Cloudflare runtime, including long Japanese and English titles, before making it
  the primary `og:image` path.
- For OGP text wrapping, test English titles, Japanese titles, mixed
  Japanese/English titles, code identifiers, and URLs to prove that line breaks do
  not split words or tokens mid-segment.
- For Cloudflare telemetry, verify credentials remain outside public/plugin-owned
  state and that EmDash only receives the derived aggregates needed for editorial
  interpretation.
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
