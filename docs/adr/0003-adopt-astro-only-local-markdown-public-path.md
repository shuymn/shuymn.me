# ADR 0003: Adopt Astro-Only Local Markdown Public Path

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

Adopt Astro-only local Markdown as the next public-content target architecture.

The public blog path should be implemented with Astro content collections backed
by repository-local Markdown files. EmDash becomes a transitional dependency and
existing content source only until posts and public surfaces are migrated. New
blog-platform baseline work should not deepen the EmDash dependency unless it is
needed to keep the currently deployed site operational during the transition.

The target route strategy is explicit and locale-aware:

- Japanese source posts live under a locale-bearing path such as
  `src/content/posts/ja/<slug>.md`.
- English generated posts live under the matching English locale path such as
  `src/content/posts/en/<slug>.md`.
- Content collection IDs must preserve locale path segments so localized posts
  cannot collide.
- Public URLs should remain `/posts/<slug>` for the default locale and
  `/en/posts/<slug>` for English.
- Static paths should be generated from local content entries, not from empty
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
  editor over the existing Markdown/frontmatter contract, not as a reason to
  switch the body format or own canonical content.
- TinaCMS is a possible editor candidate because it is Git-backed and supports
  Markdown/MDX/JSON, but its GraphQL/backend and visual editing model add more
  moving parts than are justified for the next slice.
- Decap CMS and Pages CMS are Git-backed browser editing layers, but their normal
  workflow writes through GitHub or pull requests. They are not first-choice
  foundations for a workflow that should avoid posting through GitHub-centered
  UI steps.

## Consequences

- The next implementation work should migrate the public content path away from
  EmDash, not make EmDash and local Markdown coexist as peers.
- Existing EmDash code, seed files, and host-side scripts remain useful only as
  transitional implementation and migration references.
- The English generation path should shift from EmDash API writes to file writes
  against local Markdown plus deterministic validation.
- Browser-based editing is deferred. Local editor, Coding Agent, and command-line
  workflows are sufficient until actual posting friction proves otherwise.
- Any future editor/CMS must preserve local Markdown as the canonical source and
  must be replaceable without changing public rendering contracts.
- Existing bd issues that are EmDash-specific should be replaced or superseded
  by local-source implementation issues as migration work begins.

## Implementation Status

As of 2026-05-09, the first public rendering cutover is complete:

- Published EmDash posts are exported to `src/content/posts/<locale>/<slug>.md`.
- Published `home-about` site sections are exported to
  `src/content/site-sections/<locale>/home-about.md`.
- Public home and post detail rendering read Astro content collections instead
  of EmDash runtime APIs.
- The Astro config no longer installs the EmDash integration, so prerendered
  public content routes are not coupled to EmDash request/session hooks.

The remaining transitional work is explicit: English generation still uses the
EmDash API/client flow and must be migrated to local Markdown file writes before
the EmDash content-management scripts can be removed completely.

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
- [ADR 0002: Spike Local Markdown Canonical Source Before Further CMS Commitment](0002-spike-local-markdown-canonical-source.md)
- [Local Markdown Canonical Source Spike](../design/local-markdown-canonical-source-spike.md)
