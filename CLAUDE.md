# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Install dependencies (uses Bun package manager)
bun install

# Development server with Turbopack
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Linting
bun run lint      # Check for linting issues
bun run lint:fix  # Auto-fix linting issues

# Code formatting (using Biome)
bun run fmt       # Check formatting
bun run fmt:fix   # Auto-fix formatting
```

## Architecture Overview

This is a personal blog/portfolio site built with Next.js 15's App Router. The architecture follows a static-first approach where blog posts are markdown files that get statically generated at build time.

### Key Architectural Decisions

1. **Static Blog Generation**: Blog posts live in `_posts/` as markdown files with frontmatter. They're parsed at build time using `gray-matter` and rendered with `react-markdown`.

2. **App Router Structure**: Uses Next.js 15 App Router with:
   - `src/app/page.tsx` - Home page listing all posts
   - `src/app/posts/[slug]/page.tsx` - Individual post pages with static generation
   - All posts are pre-rendered at build time via `generateStaticParams()`

3. **Markdown Processing Pipeline**:
   - Posts are read from filesystem in `src/lib/posts.ts`
   - Frontmatter requires: `title`, `date`, `description`, optional `cardImage`
   - Markdown rendering uses async components with Shiki for syntax highlighting
   - Additional plugins: `remark-gfm`, `rehype-raw`, `rehype-figure`

4. **Styling**: Tailwind CSS v4 with typography plugin for prose content

5. **TypeScript Configuration**: 
   - Strict mode enabled
   - Path alias `@/*` maps to `./src/*`
   - Target ES2017 for compatibility

6. **Code Quality Tools**:
   - Biome for formatting (not linting)
   - ESLint + eslint-config-next for linting
   - textlint for Japanese technical writing

### Adding New Blog Posts

Create a new markdown file in `_posts/` with the naming convention `YYYY-MM-DD-slug-name.md`:

```markdown
---
title: "Post Title"
date: "YYYY-MM-DD"
description: "Brief description"
cardImage: "/path/to/image.jpg"  # Optional
---

Post content here...
```

The slug in the URL will be derived from the filename (without date prefix and .md extension).