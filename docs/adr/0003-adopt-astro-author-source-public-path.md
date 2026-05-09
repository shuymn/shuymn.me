# ADR 0003: Adopt Astro Author Source Public Path

Status: Accepted
Date: 2026-05-09
Updated: 2026-05-10

## Context

ADR 0002 evaluated Markdown author source before adding more
CMS-specific blog-platform work. The spike showed that Astro can render
repository post content and that Markdown is the right body boundary for Coding
Agent drafting, review, translation, and deterministic validation.

The important correction from the spike is that the accepted target is not "one
Markdown file with every durable and generated field in frontmatter." The normal
writing flow starts with title and body. Generated editorial metadata should be
separate until it is accepted or deterministically promoted.

The target needs to support:

- Coding Agent assisted drafting, review, and translation
- a canonical body that remains repository-backed, diffable, and Markdown
- Cloudflare deployment
- mostly static public content
- request-time surfaces only when they have a concrete reason
- future browser editing only if it does not move the canonical post body out of
  repository files

Image upload and external asset storage remain deferred.

## Decision

Adopt an Astro authoring architecture as the public-content target.

The public blog path is implemented from repository Markdown author source,
projected into Astro's rendering/build contract. A deployable branch must not
require CMS runtime reads, CMS scripts, CMS dependencies, CMS environment
variables, or a remote structured body store for normal public rendering.

The authoring content contract has three layers:

- Author source: title and body in Markdown files, plus only the minimal publish
  envelope needed to keep the file addressable. The slug is derived from the
  extensionless filename and starts with the publication date.
- Generated state: separate suggestion or run records for prompt versions,
  provider output, confidence, validation failures, and rejected candidates. This
  state is not public metadata until accepted or deterministically promoted.
- Build projection: a regenerable Astro input layer that combines author source
  with deterministic derived metadata into the shape Astro pages and content
  collections need.

Frontmatter may be used in the Astro projection, but it must not become the
primary storage location for generated editorial state.

The route strategy is explicit and locale-aware:

- Japanese source posts live as root `posts/<slug>.md`.
- The current source tree has no locale directory because only Japanese source is
  canonical.
- English generated posts are outside the current deployment gate.
- `/en/posts/<slug>` remains the reserved public route contract for future
  translations.
- Public URLs remain `/posts/<slug>` for the default locale and
  `/en/posts/<slug>` for English.
- Cloudflare Static Assets must drop trailing slashes so deployed
  `folder/index.html` assets preserve the Astro `trailingSlash: "never"` public
  URL contract.
- Static paths come from projected entries, not from empty global i18n
  route duplication.

The rendering model is static-first:

- Published post detail pages, home pages, tag pages, archive pages, RSS,
  sitemap, deterministic related posts, and deterministic OGP outputs should be
  pre-rendered when their inputs are committed before deploy.
- SSR remains available only for surfaces with real request-time state, such as
  authenticated preview, generation endpoints, admin/editor helpers, or
  telemetry interpretation.
- If request-time surfaces remain useful, keep the Cloudflare adapter and mark
  public content routes with explicit pre-rendering.

Do not introduce a CMS as the primary source of truth. A supporting editor layer
may be evaluated later only if normal posting needs a browser UI, and it must
write the author source contract rather than own the canonical body.

## Consequences

- Public blog implementation work targets Markdown author source and generated
  projection.
- Historical CMS implementation details are migration evidence, not current
  instructions.
- English generation is deferred until after the Japanese author source deployment
  and should write through the same author source/projection contract.
- Browser-based editing is deferred. Editor, Coding Agent, and command-line
  workflows are sufficient until actual posting friction proves otherwise.
- Any future editor/CMS must preserve Markdown author source as canonical and
  must be replaceable without changing public rendering contracts.
- Existing bd issues that still assume the old implementation boundary should be
  replaced, superseded, or rewritten against the authoring architecture.

## Implementation Status And Release Gate

As of 2026-05-10, the deployable target is implemented for the Japanese site:

- Japanese author source lives under root `posts/<slug>.md`, outside `src/`,
  with source frontmatter containing only `title`.
- `pnpm run project:content -- --check` verifies that
  `src/content/posts/ja/<slug>.md` is the current Astro build projection.
- Historical Japanese Markdown was recovered from git history and recorded in
  `docs/design/japanese-source-recovery.md`.
- Static `home-about` copy is owned by the home page component with locale
  branches because it shares links and is not independently authored content.
- Public home and post detail rendering reads Astro files and post content
  collections.
- The Astro config uses the Cloudflare adapter directly, and `wrangler.jsonc`
  configures Static Assets HTML handling to keep `/posts/<slug>` canonical
  rather than redirecting to `/posts/<slug>/`.
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
- [Authoring Content Contract](../design/authoring-content-contract.md)
- [Japanese Source Recovery](../design/japanese-source-recovery.md)
- [ADR 0002: Spike Markdown Author Source Before Further CMS Commitment](0002-spike-markdown-author-source.md)
- [Markdown Author Source Spike](../design/markdown-author-source-spike.md)
