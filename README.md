# shuymn.me

Personal website and blog built with Astro local content sources.

## Setup

Use Node.js 24 and pnpm.

```bash
pnpm install
pnpm run dev
```

Build and validate the Cloudflare Worker output without deploying with:

```bash
pnpm run deploy:dry-run
```

## Environment

Local secrets are loaded through direnv and `.envrc`.

```bash
cp .env.example .env
eval "$(direnv hook zsh)"
direnv allow
```

Install direnv with your package manager first, then add the shell hook command
to your shell profile. For shells other than zsh, use the hook command shown by
the direnv documentation.

`.env.example` records the current local environment contract. Keep real values
in `.env`; it is ignored by git.
