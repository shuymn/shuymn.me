# Japanese Source Recovery

Status: Completed
Date: 2026-05-10
Issue: `shuymn_me-gjp`

## Purpose

Record the evidence and rule used to recover Japanese author source from git
history for the EmDash-free Astro cutover.

## Source Snapshot

Historical source was recovered from:

```text
bbcd28c4ed5148db1422179a082fffc95ef4c29f^:_posts/<slug>.md
```

`bbcd28c4ed5148db1422179a082fffc95ef4c29f` is the commit that removed the
legacy `_posts` directory. Its parent is therefore the latest snapshot where the
Japanese Markdown sources still existed in the repository.

## Recovery Rule

- Author source `title` and body come from the historical `_posts/<slug>.md`
  file.
- Public `slug`, `locale`, `publishedAt`, `updatedAt`, `draft`, `tags`, `seo`,
  `translation`, `visibility`, and `redirects` remain in the accepted metadata
  sidecar.
- Historical frontmatter `description` is copied into accepted metadata when it
  exists.
- Each recovered metadata sidecar records `revision.source = "git-history"`,
  `revision.reconciled = true`, and the exact source path in `revision.notes`.
- Projection files under `src/content/posts/ja` are regenerated from recovered
  source plus accepted metadata.
- Markdown hard breaks that had been encoded as trailing spaces are normalized to
  backslash hard breaks so `git diff --check` remains clean.
- Legacy C0 control characters are removed from recovered bodies. The historical
  snapshot contains at least one invisible control character in prose; preserving
  it would make the local source harder to review without changing the intended
  article text.

## Mapping

| Public slug | Historical path |
| --- | --- |
| `2020-04-02-hello-world` | `_posts/2020-04-02-hello-world.md` |
| `2020-12-22-renewal` | `_posts/2020-12-22-renewal.md` |
| `2020-12-24-ontology` | `_posts/2020-12-24-ontology.md` |
| `2020-12-26-best-buy-this-year` | `_posts/2020-12-26-best-buy-this-year.md` |
| `2020-12-30-good-bye-2020` | `_posts/2020-12-30-good-bye-2020.md` |
| `2021-01-06-happy-new-year` | `_posts/2021-01-06-happy-new-year.md` |
| `2021-01-06-the-journey-of-elaina` | `_posts/2021-01-06-the-journey-of-elaina.md` |
| `2021-01-06-toy-problem` | `_posts/2021-01-06-toy-problem.md` |
| `2021-01-10-intake-vent-replace` | `_posts/2021-01-10-intake-vent-replace.md` |
| `2021-01-21-okamura-sylphy` | `_posts/2021-01-21-okamura-sylphy.md` |
| `2021-02-01-phoenixwan` | `_posts/2021-02-01-phoenixwan.md` |
| `2021-02-18-two` | `_posts/2021-02-18-two.md` |
| `2021-02-21-anger-management` | `_posts/2021-02-21-anger-management.md` |
| `2021-04-24-how-i-gather-techinical-information-in-english` | `_posts/2021-04-24-how-i-gather-techinical-information-in-english.md` |
| `2021-04-28-language-support` | `_posts/2021-04-28-language-support.md` |
| `2021-09-29-alt-docker-for-mac` | `_posts/2021-09-29-alt-docker-for-mac.md` |
| `2021-11-23-m1-pro` | `_posts/2021-11-23-m1-pro.md` |
| `2021-11-27-steam-sale` | `_posts/2021-11-27-steam-sale.md` |
| `2022-01-28-catch-up` | `_posts/2022-01-28-catch-up.md` |
| `2022-02-03-journal` | `_posts/2022-02-03-journal.md` |
| `2022-02-03-organize-mobile-lines` | `_posts/2022-02-03-organize-mobile-lines.md` |
| `2026-04-23-why-interested-in-aituber` | `_posts/2026-04-23-why-interested-in-aituber.md` |

## Verification

Commands:

```bash
pnpm run project:content -- --recover-from-git 'bbcd28c4ed5148db1422179a082fffc95ef4c29f^' --apply --force
pnpm run project:content -- --apply
pnpm run project:content -- --recover-from-git 'bbcd28c4ed5148db1422179a082fffc95ef4c29f^' --check
pnpm run project:content -- --check
```

The recovery command reported `recovered: 22`. The projection check reported
`projections: 22`.
