# Development setup (this fork)

This repo is a fork of [medusajs/b2b-starter](https://github.com/medusajs/b2b-starter) (monorepo: `apps/backend` = Medusa v2, `apps/storefront` = Next.js 15, pnpm + turbo). This guide supplements the upstream README with fork-specific and OS-specific notes.

## Prerequisites

- **Node.js 20+**
- **pnpm 9** — pinned via `packageManager`; with corepack enabled the right version is used automatically
- **PostgreSQL 15+** — a native install or Docker both work; only a reachable server is needed
- **Redis: not required locally.** Without `REDIS_URL` the backend falls back to in-memory event bus/cache/locking (fine for dev; hosted environments use managed Redis)

## First-time setup

```bash
pnpm install

# create the database (any name; keep it in sync with .env)
createdb b2b_dev   # or: psql -U postgres -c "CREATE DATABASE b2b_dev"
```

Create `apps/backend/.env` from `apps/backend/.env.template` and set:

```bash
DATABASE_URL=postgres://<user>:<password>@localhost:5432/b2b_dev
DB_NAME=b2b_dev
JWT_SECRET=<any-random-string>     # required — no fallback since v2.18 config
COOKIE_SECRET=<any-random-string>  # required — no fallback since v2.18 config
```

Omit `REDIS_URL` unless you run Redis.

Then:

```bash
cd apps/backend
pnpm medusa db:migrate            # runs migrations AND the one-time data seed
pnpm medusa user -e admin@test.com -p supersecret   # local admin login
```

`db:migrate` executes `src/migration-scripts/initial-data-seed.ts` on a fresh DB: sales channel, publishable API key, Europe region (gb/de/dk/se/fr/es/it), warehouse + shipping options, global product options, and 8 demo products.

Create `apps/storefront/.env.local` from `apps/storefront/.env.template` and set:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<pk_... from admin Settings → Publishable API Keys>
NEXT_PUBLIC_BASE_URL=http://localhost:8000
NEXT_PUBLIC_DEFAULT_REGION=de
```

> **Region gotcha:** the seed creates only a Europe region. `NEXT_PUBLIC_DEFAULT_REGION` must be one of its country codes (e.g. `de`) — the template's `us` 404s on every page.

To grab the publishable key without opening the admin:

```bash
psql -U postgres -d b2b_dev -t -A -c "SELECT token FROM api_key WHERE type='publishable' LIMIT 1"
```

## Running

```bash
pnpm dev          # root: backend + storefront via turbo
```

- Backend + admin: http://localhost:9000 (admin UI at `/app`)
- Storefront: http://localhost:8000

> **Production builds:** `next build` (and therefore the root `pnpm build`) needs the **backend running** — the storefront pre-renders category/collection pages via `generateStaticParams` at build time. Start the backend first, then build the storefront. `medusa build` also runs `medusa lint`; lint **errors** fail the backend build.

Reset the database at any time with drop + create + `db:migrate` (the seed re-runs on a fresh DB).

## Windows notes

- Use **Git Bash** for the backend test scripts (`test:unit` etc.) — they use `VAR=x` env prefixes that PowerShell/cmd don't support.
- Stopping `pnpm dev` can orphan `node` processes that keep ports 8000/9000 bound. Find and kill them with:
  ```powershell
  Get-NetTCPConnection -LocalPort 8000,9000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

## Dependency policy (freeze)

Versions are **frozen** as of 2026-07-30: Medusa **2.18.0**, Next **15.5.21**, pnpm lockfile authoritative. Rules:

1. No ad-hoc `pnpm up` / version bumps. CI installs with `--frozen-lockfile`; a drifted lockfile fails the build.
2. Upgrades happen deliberately by merging the upstream starter: `git fetch upstream && git merge upstream/main`, then install → migrate → build → smoke-test before merging to `main`.
3. `upstream` = https://github.com/medusajs/b2b-starter.

## Branch / merge conventions

- Branch per issue: `aviral/smd-<n>-<slug>` (Linear-generated name).
- Merge to `main` only after the build is green and both apps have been smoke-tested locally.
- Conventional commits (`feat:`, `fix:`, `chore:`, `docs:` …).
