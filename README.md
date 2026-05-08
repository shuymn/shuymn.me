# shuymn.me

Personal website and blog built with Astro and EmDash.

## Setup

Use Node.js 24 and pnpm.

```bash
pnpm install
pnpm run bootstrap
pnpm run dev
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

`.env.example` lists the EmDash, Cloudflare Access, Cloudflare AI Gateway, and
English-generation variables used by this repository. Keep real values in
`.env`; it is ignored by git.
