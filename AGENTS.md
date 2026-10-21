# AGENTS.md

Medusa B2B Starter: a pnpm + Turborepo monorepo with a Medusa v2 backend (`apps/backend`) and a Next.js 15 storefront (`apps/storefront`). Adds companies, employees, spending limits, approvals, and quotes on top of Medusa commerce.

## Before You Start

1. **Package manager**: read `packageManager` in the root `package.json` (`pnpm@9.15.0`), then confirm with the lockfile (`pnpm-lock.yaml`). Never use npm or yarn here.
2. **Optional apps**: both `apps/backend` and `apps/storefront` exist in this repo. If you work from a fork, run `ls apps` before assuming either is present.
3. **Load the matching Medusa skill**: `building-with-medusa` (backend), `building-admin-dashboard-customizations` (admin UI), `building-storefronts` (storefront). See [Medusa Skills & MCP](#medusa-skills--mcp).
4. **Read the package AGENTS.md** for the `@medusajs/*` package you are about to use. See [Medusa Package Docs](#medusa-package-docs-node_modules).

## Commands

Run from the repo root unless noted. Root scripts fan out through Turborepo.

| Task | Command |
|------|---------|
| Install | `pnpm install` |
| Dev (backend :9000, storefront :8000) | `pnpm dev` |
| Build both apps | `pnpm build` |
| Lint both apps | `pnpm lint` |
| Backend HTTP integration tests | `pnpm test:integration:http` |
| Run a script in one app | `pnpm --filter @b2b-starter/backend <script>` (or `@b2b-starter/storefront`) |
| Run migrations | `cd apps/backend && pnpm medusa db:migrate` |
| Generate migrations for a module | `cd apps/backend && pnpm medusa db:generate <module>` (`company`, `quote`, `approval`) |
| Create admin user | `cd apps/backend && pnpm medusa user -e <email> -p <password>` |

- Node `>=22.22.0` is enforced (`engine-strict=true` in `.npmrc`).
- HTTP integration tests need a reachable PostgreSQL; `@medusajs/test-utils` creates a temporary database per run.
- Do not rely on `pnpm test`, `pnpm test:unit`, or `pnpm test:integration:modules`: no app defines `test`, and there are no `*.unit.spec.ts` or `src/modules/*/__tests__` files, so the latter two exit with "No tests found".

## Directory Structure

```text
.
├── apps/
│   ├── backend/                    # Medusa v2 app (@b2b-starter/backend)
│   │   ├── medusa-config.ts        # Registers company, quote, approval modules
│   │   ├── integration-tests/
│   │   │   ├── http/               # *.spec.ts HTTP tests (admin/, companies/, quotes/)
│   │   │   └── utils/              # Seeders and auth helpers for tests
│   │   └── src/
│   │       ├── admin/              # Admin extensions: routes/ (approvals, companies, quotes), components/, hooks/api/
│   │       ├── api/                # admin/ and store/ routes, middlewares.ts, middlewares/ensure-role.ts
│   │       ├── jobs/               # Scheduled jobs (empty)
│   │       ├── links/              # Module links (company, employee, cart, order, quote, approval)
│   │       ├── migration-scripts/  # initial-data-seed.ts, runs on db:migrate
│   │       ├── modules/            # Custom modules: approval/, company/, quote/
│   │       ├── search/             # Product search indexing helpers
│   │       ├── subscribers/        # Event subscribers (empty)
│   │       ├── types/              # Shared types per domain
│   │       ├── utils/
│   │       └── workflows/          # approval/, company/, employee/, order/, quote/, hooks/ (core-flow hooks)
│   └── storefront/                 # Next.js 15 App Router (@b2b-starter/storefront)
│       └── src/
│           ├── app/[countryCode]/  # (main) and (checkout) route groups
│           ├── lib/
│           │   ├── config.ts       # JS SDK client (`sdk`)
│           │   ├── data/           # Server actions / data fetching per resource
│           │   ├── context/        # React context (cart, etc.)
│           │   └── util/
│           ├── modules/            # UI by feature: account, cart, checkout, products, quotes, ...
│           └── types/
├── eslint.config.ts                # Root ESLint config (@medusajs/eslint-plugin)
├── pnpm-workspace.yaml             # Workspaces: apps/*
└── turbo.json
```

## Where to Look

| Task | Path in this repo | Read first |
|------|-------------------|------------|
| API route | `apps/backend/src/api/{admin,store}/<resource>/route.ts` | `@medusajs/framework`, `@medusajs/medusa` |
| Middleware / auth / validation | `apps/backend/src/api/middlewares.ts`, `src/api/middlewares/` | `@medusajs/framework` |
| Workflow or step | `apps/backend/src/workflows/<domain>/{workflows,steps}/` | `@medusajs/workflows-sdk`, `@medusajs/framework` |
| Reuse or hook into core flows | `apps/backend/src/workflows/hooks/` | `@medusajs/core-flows` |
| Custom module | `apps/backend/src/modules/<name>/` (models, service, migrations) | `@medusajs/framework`, `@medusajs/modules-sdk` |
| Module links | `apps/backend/src/links/` | `@medusajs/link-modules`, `@medusajs/framework` |
| Subscribers / scheduled jobs | `apps/backend/src/subscribers/`, `src/jobs/` | `@medusajs/framework` |
| Admin extensions | `apps/backend/src/admin/routes/`, `src/admin/hooks/api/` | `@medusajs/admin-sdk`, `@medusajs/ui`, `@medusajs/icons` |
| Medusa config | `apps/backend/medusa-config.ts` | `@medusajs/framework`, `@medusajs/medusa` |
| Tests | `apps/backend/integration-tests/http/` | `@medusajs/test-utils` |
| Storefront data fetching | `apps/storefront/src/lib/data/`, `src/lib/config.ts` | `@medusajs/js-sdk`, `@medusajs/types` |
| Storefront search | `apps/storefront/src/lib/search-client.ts` | `@medusajs/instantsearch-adapter` |
| Storefront UI | `apps/storefront/src/modules/`, `src/app/[countryCode]/` | `@medusajs/ui`, `@medusajs/icons` |
| Lint failures | `eslint.config.ts`, `apps/backend/eslint.config.ts`, `apps/storefront/eslint.config.mjs` | `@medusajs/eslint-plugin`, `eslint-config-next` |

## Medusa Package Docs (node_modules)

Published `@medusajs/*` packages ship an `AGENTS.md` at `node_modules/@medusajs/<pkg>/AGENTS.md` (added in [medusajs/medusa#17382](https://github.com/medusajs/medusa/pull/17382)). It documents the API, examples, architecture, and gotchas for the exact installed version. Prefer it over memory.

```bash
find node_modules apps/*/node_modules -maxdepth 6 -path "*/@medusajs/*/AGENTS.md" 2>/dev/null
```

- Older Medusa versions don't include it. This repo pins `2.21.2`, which predates it, so the command currently returns nothing. When it's missing, fall back to the skills and the docs MCP server.
- Never edit files under `node_modules/`.

| Package | Read it for |
|---------|-------------|
| `@medusajs/framework` | Imports for server code: `/http`, `/utils`, `/types`, `/workflows-sdk`, `/zod`; DI container, data models |
| `@medusajs/medusa` | Built-in API routes, validators, and route config you extend |
| `@medusajs/core-flows` | Built-in workflows and their hooks (cart, order, customer) |
| `@medusajs/cart`, `order`, `customer`, `fulfillment`, `stock-location`, `auth`, `user` | Commerce modules this repo resolves via `Modules.*` |
| `@medusajs/admin-sdk`, `@medusajs/ui`, `@medusajs/icons` | Admin route/widget config and UI components |
| `@medusajs/js-sdk`, `@medusajs/types` | Storefront and admin HTTP client and response types |
| `@medusajs/instantsearch-adapter` | Storefront product search |
| `@medusajs/test-utils` | `medusaIntegrationTestRunner` and test DB setup |
| `@medusajs/eslint-plugin` | Lint rules and their fixes |
| `@medusajs/cli` | `medusa` CLI commands (`db:migrate`, `db:generate`, `user`, `exec`) |

In backend server code (`api`, `workflows`, `modules`, `links`, `subscribers`, `jobs`), import from `@medusajs/framework/*` subpaths, not from `@medusajs/utils`, `@medusajs/types`, `@medusajs/workflows-sdk`, etc. directly. Admin (`src/admin`) and storefront code can't import the framework; use `@medusajs/js-sdk`, `@medusajs/types`, and `@medusajs/ui` there.

## Medusa Skills & MCP

Use sources in this order:

1. The package `AGENTS.md` in `node_modules` (exact installed version).
2. Medusa agent skills: `/plugin marketplace add medusajs/medusa-agent-skills`, then `/plugin install medusa-dev@medusa` (other agents: `npx skills add medusajs/medusa-agent-skills`). See [agentic skills](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills).
3. Docs MCP server or plain-text docs:
   - `claude mcp add --transport http medusa https://docs.medusajs.com/mcp`
   - Without MCP: <https://docs.medusajs.com/llms.txt>, or append `.md` to any `docs.medusajs.com` page URL.

**Medusa Cloud MCP** (projects deployed on Medusa Cloud):

```bash
claude mcp add --transport http medusa-cloud https://cloud.medusajs.com/mcp
```

It exposes deployments, build/runtime logs, environment variables, and store data. Use it to debug deploys and production errors.

- Never ask for, store, or handle Cloud credentials.
- Never reveal environment variable values unless the user asks.
- Confirm with the user before any write to a live store.

## Conventions

- Business logic that mutates data lives in workflows; API routes validate input and call a workflow.
- Extend built-in flows with workflow hooks in `src/workflows/hooks/` instead of copying core-flows.
- Custom modules expose a `*_MODULE` constant from `src/modules/<name>/index.ts`; register new modules in `medusa-config.ts` and generate migrations.
- Cross-module relations go in `src/links/`, never as foreign keys between modules.
- Use `MedusaError` instead of generic `Error` (enforced by `@medusajs/eslint-plugin`).
- Storefront data fetching goes through `src/lib/data/*` using the shared `sdk` from `src/lib/config.ts`.

## Common Mistakes

- Guessing Medusa APIs from memory when the package `AGENTS.md` or the docs MCP is available.
- Mutating commerce data through raw module service calls (e.g. `cartModule.updateCarts`) instead of `@medusajs/core-flows` workflows, which skips hooks, events, and compensation.
- Importing from `@medusajs/utils` / `@medusajs/types` in backend server code instead of `@medusajs/framework/*`.
- Changing a data model without running `pnpm medusa db:generate <module>` and committing the migration.
- Running npm or yarn, which ignores `pnpm-lock.yaml` and the workspace setup.
- Calling `pnpm test` and assuming tests passed: it runs nothing.

## Off-Limits

- `node_modules/`: read the package docs there, but never edit installed packages.
- `.env`, `.env.local`: never commit or print values. Edit `.env.template` for new variables.
- `pnpm-lock.yaml`: only change it via `pnpm install`/`pnpm add`.
- Existing migration files in `src/modules/*/migrations/`: generate new ones instead of editing.
- `.medusa/`, `.next/`, `.turbo/`: build output.
