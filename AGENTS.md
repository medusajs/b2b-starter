# AGENTS.md

Guidance for AI coding agents working in this repo. `CLAUDE.md` is a symlink to this file.

## Repo at a glance

Turborepo monorepo:

- `apps/backend` — Medusa.js v2 B2B starter (Postgres, Redis)
- `apps/storefront` — Next.js 15 storefront

## Agent skills

### Issue tracker

Issues live in GitHub Issues — use the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: per-app `CONTEXT.md` under `apps/backend/` and `apps/storefront/`, with `CONTEXT-MAP.md` at the root. See `docs/agents/domain.md`.

## Medusa-specific guidance

This repo is a Medusa.js v2 application. When planning, researching, or implementing **anything Medusa-related**, invoke the relevant medusa-dev skill BEFORE writing code:

- `medusa-dev:building-with-medusa` — backend work (modules, workflows, API routes, module links, business logic). REQUIRED for any backend feature.
- `medusa-dev:building-admin-dashboard-customizations` — admin UI work (widgets, custom pages, forms, tables).
- `medusa-dev:building-storefronts` — storefront integration with the Medusa JS SDK (data fetching, React Query patterns).
- `medusa-dev:creating-internal-agents` — when building admin-facing AI agents inside Medusa.
- `medusa-dev:db-generate` — generate migrations after model changes.
- `medusa-dev:db-migrate` — run migrations.
- `medusa-dev:new-user` — create admin users.

For learning the framework end-to-end, use `learn-medusa:learning-medusa`.

The medusa-dev skills contain opinionated patterns and anti-patterns the official docs don't cover — consult them FIRST, then fall back to the Medusa MCP server (`mcp__medusa__ask_medusa_question`) for specific method signatures.
