# ADR 0003: Adopt Astro-Only Local Source Public Path

Status: Accepted
Date: 2026-05-09

## Context

ADR 0002 started a local Markdown-family canonical source spike before investing
further in EmDash-specific extension work or a Sanity migration. The spike
proved that Astro can render a strict local Markdown content collection and can
pre-render a route while the current project still uses `output: "server"`.

The spike also clarified a sharper architectural point: if local Markdown is the
canonical post source, EmDash should not remain a long-term public content
runtime. Keeping EmDash only to work around a CMS surface would preserve the same
maintenance pressure that motivated the spike.

The follow-up review corrected one important assumption from the first proof:
the target is not "one Markdown file with every durable and generated field in
frontmatter." The intended writing flow starts with title and body. Metadata such
as tags, series, summaries, SEO text, OGP inputs, and translation state should be
generated or suggested after writing, then accepted explicitly before it becomes
durable publishing input. Putting all of that into post frontmatter would make
generated state look like author-written source and would make the LLM output
contract larger than necessary.

The target still needs to support:

- Coding Agent assisted drafting, review, and translation
- a canonical body that remains local, diffable, and Markdown-family
- Cloudflare deployment
- mostly static public content
- request-time surfaces only when they have a concrete reason
- future browser editing only if it does not move the canonical post body out of
  local files

Image upload and external asset storage remain deferred.

## Decision

Adopt an Astro-only local-source architecture as the next public-content target.

The public blog path should be implemented from repository-local
Markdown-family author source plus local metadata files, projected into Astro's
rendering/build contract. This is an atomic cutover target, not a staged
deployment plan: a branch that still requires EmDash scripts, dependencies,
environment variables, Portable Text storage, or CMS runtime surfaces is still
migration work in progress and must not be treated as the deployable
replacement.

The existing EmDash implementation may remain only as the currently deployed
site or as local migration evidence while the replacement is prepared. It should
not coexist with local Markdown in a deployed target architecture.

The local source contract has four layers:

- Author source: title and body in Markdown-family files, plus only the minimal
  publish envelope needed to keep the file addressable. Generated editorial
  metadata should not be authored into this layer.
- Accepted metadata: local sidecar data for durable publishing inputs such as
  slug, publication date, update date, tags, series, summaries, SEO metadata,
  OGP inputs, redirects, visibility status, and revision/status notes.
- Generated state: separate suggestion or run records for prompt versions,
  provider output, confidence, validation failures, and rejected candidates. This
  state is not public metadata until accepted or deterministically promoted.
- Build projection: a regenerable Astro input layer that combines author source
  and accepted metadata into the shape Astro pages, content collections, or
  loaders need. This projection is implementation output, not hand-authored
  canonical content.

Frontmatter may still be used as a thin compatibility envelope when it is the
lowest-risk bridge into Astro, but it must not become the primary storage
location for generated editorial state.

The target route strategy is explicit and locale-aware:

- Japanese source posts live under a locale-bearing path in the local source
  tree.
- English generated posts are out of this cutover. `/en/posts/<slug>` remains
  the reserved public route contract for future translations, but this branch
  does not require `en/*.md` files or an English generation pipeline before
  deployment.
- Content collection IDs must preserve locale path segments so localized posts
  cannot collide.
- Public URLs should remain `/posts/<slug>` for the default locale and
  `/en/posts/<slug>` for English.
- Static paths should be generated from local projected entries, not from empty
  global i18n route duplication.

The target rendering model is static-first:

- Published post detail pages, home pages, tag pages, archive pages, RSS,
  sitemap, deterministic related posts, and deterministic OGP outputs should be
  pre-rendered when their inputs are committed before deploy.
- SSR remains available only for surfaces with real request-time state, such as
  authenticated preview, generation endpoints, admin/editor helpers, or
  telemetry interpretation.
- If no request-time surface is needed after EmDash removal, the site should move
  toward Astro static output and Cloudflare static asset hosting.
- If request-time surfaces remain useful, keep the Cloudflare adapter and mark
  public content routes with explicit pre-rendering rather than making public
  content depend on runtime CMS reads.

Do not introduce a CMS as the primary source of truth now. A supporting editor
layer may be evaluated later only if normal posting needs a browser UI:

- Keystatic is the best first editor candidate because it supports Astro and can
  save content to the local file system or GitHub, but it must be evaluated as an
  editor over the local source and metadata sidecar contract, not as a reason to
  switch the body format or own canonical content.
- TinaCMS is a possible editor candidate because it is Git-backed and supports
  Markdown/MDX/JSON, but its GraphQL/backend and visual editing model add more
  moving parts than are justified for the next slice.
- Decap CMS and Pages CMS are Git-backed browser editing layers, but their normal
  workflow writes through GitHub or pull requests. They are not first-choice
  foundations for a workflow that should avoid posting through GitHub-centered
  UI steps.

## Consequences

- The next implementation work should finish the full cutover away from EmDash,
  not make EmDash and local Markdown coexist as peers.
- Existing EmDash code, seed files, and host-side scripts remain useful only as
  unpublished migration references and must be removed from the deployable
  target unless a later ADR explicitly reintroduces a different CMS boundary.
- English generation is deferred until after the EmDash-free Japanese-source
  deployment. When reintroduced, it should write through the same local
  source/metadata/projection contract instead of EmDash APIs or Portable Text.
- The Japanese canonical body should be reconciled against the historical
  Markdown sources in git history instead of treating an EmDash export as final
  truth by default.
- Browser-based editing is deferred. Local editor, Coding Agent, and command-line
  workflows are sufficient until actual posting friction proves otherwise.
- Any future editor/CMS must preserve local Markdown as the canonical source and
  must be replaceable without changing public rendering contracts.
- Existing bd issues that are EmDash-specific should be replaced or superseded
  by local-source implementation issues as migration work begins.

## Implementation Status And Release Gate

As of 2026-05-10, the deployable cutover target is implemented for the Japanese
site:

- Japanese author source lives under `src/content/source/posts/ja/<slug>.md`.
- Accepted Japanese post metadata lives under
  `src/content/metadata/posts/ja/<slug>.json`.
- `pnpm run project:content -- --check` verifies that
  `src/content/posts/ja/<slug>.md` is the current Astro build projection.
- Historical Japanese Markdown was recovered from git history and recorded in
  `docs/design/japanese-source-recovery.md`.
- Published `home-about` site sections are exported to
  `src/content/site-sections/<locale>/home-about.md`.
- Public home and post detail rendering read Astro content collections instead
  of runtime CMS APIs.
- The Astro config uses the Cloudflare adapter directly. The Node adapter,
  EmDash package dependency, seed/bootstrap/deploy/export scripts, patches, and
  EmDash environment variables are removed from the deployable target.
- English generated post files and English generation automation remain outside
  this release gate.

## Checked References

- Astro on-demand rendering:
  <https://docs.astro.build/en/guides/on-demand-rendering/>
- Cloudflare Workers Astro guide:
  <https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/>
- Keystatic introduction and local mode:
  <https://keystatic.com/docs/introduction>,
  <https://keystatic.com/docs/local-mode>
- TinaCMS introduction and Astro guide:
  <https://tina.io/docs>,
  <https://tina.io/docs/frameworks/astro>
- Decap CMS editorial workflow and GitHub backend:
  <https://decapcms.org/docs/editorial-workflows/>,
  <https://decapcms.org/docs/github-backend/>
- Pages CMS introduction:
  <https://pagescms.org/docs/>

## Related Design

- [Blog Platform Design](../design/blog-platform.md)
- [Local Source Contract](../design/local-source-contract.md)
- [Japanese Source Recovery](../design/japanese-source-recovery.md)
- [ADR 0002: Spike Local Markdown Canonical Source Before Further CMS Commitment](0002-spike-local-markdown-canonical-source.md)
- [Local Markdown Canonical Source Spike](../design/local-markdown-canonical-source-spike.md)
