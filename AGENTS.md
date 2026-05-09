<!-- Do not restructure or delete sections. Update inline when behavior changes. -->

## Core Principles

- Execute only what is explicitly requested. No unrequested features, no "while we're at it" work.
- If requirements are ambiguous, ask before proceeding. Never guess.
- Do NOT maintain backward compatibility unless explicitly requested. Break things boldly.
- When implementation changes approved scope or design decisions, update the related Design Doc and ADR in the same task.
- Confirm interpretation in the current response language.
- Never hardcode values. Use configuration, environment variables, or constants.
- Use `uv run` for Python execution by default, including one-off scripts and tooling.
- Never compromise code quality to bypass errors. Fix root causes instead of relaxing conditions, skipping tests, suppressing errors, or adding temporary fixes.
- For non-trivial changes, ask "Would a staff engineer accept this?" and document rationale, impact scope, and verification evidence before marking done.
- Prefer the most elegant solution that stays in scope. For non-trivial changes with material trade-offs, compare up to 2 alternatives and choose the lowest-risk option.
- If new findings invalidate the current plan, stop execution, update the plan, then continue.
- Do not expand scope to adjacent features without explicit approval.
- For long-running sub-agent work, silence alone is not evidence of a stall. If activity indicates progress, keep waiting unless requirements changed or a real blocker is evident.
- Requirement Notation: Uses EARS instead of BDD Given/When/Then for acceptance criteria.

## Development Style

- Develop with TDD: exploration -> Red -> Green -> Refactoring.
- When KPI or coverage targets are given, keep iterating until they are met.
- Use `pnpm` for Node.js package commands. This repository declares `packageManager: pnpm@10.33.3`.
- Use Node.js 24 from `.node-version`.
- Before marking non-trivial code changes done, run the narrowest relevant verification first, then widen only when the blast radius justifies it.
- CI runs `pnpm run lint`, `pnpm run fmt`, `pnpm run typecheck`, and `pnpm run build`.

## Code Design

- Maintain separation of concerns.
- Separate state from logic.
- Prioritize readability and maintainability.
- Define the contract layer strictly, and keep the implementation layer regenerable.
- This is an Astro local-source site, not a Next.js app.
- The target content contract keeps blog author source as title/body Markdown under root `posts/*.md`; derive slug from the extensionless filename and do not store slug in source frontmatter.
- Keep `src/content/posts/` as the Astro build projection only. Generated projection frontmatter may contain derived metadata needed by Astro/public rendering, but it is not the authoring contract.
- Public posts and site sections may project into Astro content collections under `src/content/posts/` and `src/content/site-sections/`; preserve `/posts/<slug>`. `/en/posts/<slug>` is reserved for future generated translations but is not required for the current cutover.
- Public content routes should prerender from local files and must not query a CMS at render time.
- Do not treat a branch that needs CMS runtime/admin surfaces as deployable for the current cutover.
- Historical CMS export/deploy/bootstrap/seed code has been removed from the deployable target; use git history, not live CMS state, for migration evidence.
- Agents must not run production deployment commands such as `wrangler deploy` or `pnpm run deploy`. Stop at build or dry-run validation unless the owner explicitly authorizes deployment in the current turn.

## Project Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
pnpm run deploy:dry-run
pnpm run lint
pnpm run lint:fix
pnpm run fmt
pnpm run fmt:fix
pnpm run typecheck
pnpm run project:content -- --check
pnpm run project:content -- --apply
pnpm run test:local-content
```

## Environment Variables

- No environment variables are required for the current Astro local-source deploy target.
- `.envrc` may still load a local `.env`; keep real values out of git.

## Skills

- No project-specific skill is required for normal Astro local-source work.
- Use Cloudflare-related skills when changing Worker deployment behavior.

## Critical Recap

- Execute only what is explicitly requested.
- If requirements are ambiguous, ask before proceeding.
- Check applicable skills before responding.

<!-- Maintenance: Review this file when adding/removing skills or changing core workflow. Keep each line high-density — if it can be inferred from code or linters, remove it. -->

<!-- BEGIN BEADS INTEGRATION v:1 profile:full hash:f65d5d33 -->
## Issue Tracking with bd (beads)

**IMPORTANT**: This project uses **bd (beads)** for ALL issue tracking. Do NOT use markdown TODOs, task lists, or other tracking methods.

### Why bd?

- Dependency-aware: Track blockers and relationships between issues
- Git-friendly: Dolt-powered version control with native sync
- Agent-optimized: JSON output, ready work detection, discovered-from links
- Prevents duplicate tracking systems and confusion

### Quick Start

**Check for ready work:**

```bash
bd ready --json
```

**Create new issues:**

```bash
bd create "Issue title" --description="Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Issue title" --description="What this issue is about" -p 1 --deps discovered-from:bd-123 --json
```

**Claim and update:**

```bash
bd update <id> --claim --json
bd update bd-42 --priority 1 --json
```

**Complete work:**

```bash
bd close bd-42 --reason "Completed" --json
```

### Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - Work item (tests, docs, refactoring)
- `epic` - Large feature with subtasks
- `chore` - Maintenance (dependencies, tooling)

### Priorities

- `0` - Critical (security, data loss, broken builds)
- `1` - High (major features, important bugs)
- `2` - Medium (default, nice-to-have)
- `3` - Low (polish, optimization)
- `4` - Backlog (future ideas)

### Workflow for AI Agents

1. **Check ready work**: `bd ready` shows unblocked issues
2. **Claim your task atomically**: `bd update <id> --claim`
3. **Work on it**: Implement, test, document
4. **Discover new work?** Create linked issue:
   - `bd create "Found bug" --description="Details about what was found" -p 1 --deps discovered-from:<parent-id>`
5. **Complete**: `bd close <id> --reason "Done"`

### Quality
- Use `--acceptance` and `--design` fields when creating issues
- Use `--validate` to check description completeness

### Lifecycle
- `bd defer <id>` / `bd supersede <id>` for issue management
- `bd stale` / `bd orphans` / `bd lint` for hygiene
- `bd human <id>` to flag for human decisions
- `bd formula list` / `bd mol pour <name>` for structured workflows

### Auto-Sync

bd automatically syncs via Dolt:

- Each write auto-commits to Dolt history
- Use `bd dolt push`/`bd dolt pull` for remote sync
- No manual export/import needed!

### Important Rules

- ✅ Use bd for ALL task tracking
- ✅ Always use `--json` flag for programmatic use
- ✅ Link discovered work with `discovered-from` dependencies
- ✅ Check `bd ready` before asking "what should I work on?"
- ❌ Do NOT create markdown TODO lists
- ❌ Do NOT use external issue trackers
- ❌ Do NOT duplicate tracking systems

For more details, see README.md and docs/QUICKSTART.md.

## Session Completion

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd dolt push
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- END BEADS INTEGRATION -->
