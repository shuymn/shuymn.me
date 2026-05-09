---
slug: local-markdown-canonical-source
locale: ja
title: Local Markdown Canonical Source Spike
description: A minimal local post used to prove an agent-editable Markdown source.
publishedAt: 2026-05-09T00:00:00.000Z
updatedAt: 2026-05-09T00:00:00.000Z
draft: true
tags:
  - blog-platform
  - agent-first
series:
  slug: blog-platform-foundation
  order: 1
seo:
  description: A minimal local Markdown canonical source spike.
translation:
  disabled: false
generation:
  status: draft
---

# Local Markdown source

This sample post proves that a Coding Agent can edit the canonical post body as
plain Markdown while frontmatter keeps durable metadata explicit.

The body intentionally stays simple:

- headings are ordinary Markdown
- links can be compared deterministically
- code blocks can be preserved during translation
- tables remain Markdown tables

```ts
export const canonicalSource = "local-markdown";
```

| Boundary | Candidate |
| --- | --- |
| Authoring | Markdown |
| Rendering | Astro content collection |
| Translation | Markdown body plus small structured metadata |

This spike does not solve image upload.
