<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa B2B Starter
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/develop/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="Medusa is released under the MIT license." />
  </a>
  <a href="https://github.com/medusajs/medusa/blob/develop/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

# Medusa B2B Starter

An official Medusa starter for B2B ecommerce, built with [Medusa](https://medusajs.com) and [Next.js 15](https://nextjs.org). It covers common business-to-business requirements out of the box and is designed to be customized and extended.

## AKLAST — Türkiye (B2C + B2B) kurulum notları

Bu repo `aklast.com.tr` için Medusa v2 tabanlı B2C (perakende) + B2B (bayi) lastik/jant platformuna dönüştürüldü.

### Ödeme sağlayıcıları — iyzico kararı

- **Aktif:** `pp_tr_manual_havale` (Havale/EFT) ve `pp_tr_manual_kapida` (Kapıda ödeme) [backend/src/providers/turkish-manual-payment.ts](`app/apps/backend/src/providers/turkish-manual-payment.ts` dosage) — her ikisi de canlı e2e ile kanıtlı: `scripts/e2e-manual-payments.mjs` (payment session → admin capture → sipariş, KDV %20 tutarlı).
- **iyzico: KURULMADI (bilinçli karar).** Sandbox'ta kart/virtual POS uçtan uca testini doğrulayabilecek hesap/servis kanıtı sağlanamadı; plan gereği "uçtan uca test edilemiyorsa kurma" kuralına bağlı kalındı. Repo genelinde iyzico referansı yoktur. iyzico entegrasyonu gerektiğinde `medusa-config.ts`'e `medusa-payment-iyzico` tarzı bir provider eklenecek ve önce sandbox'ta uçtan uca test edilecek.

### Kanıt betikleri (canlı backend karşı koşulur)

| Betik | Kulanımda kapsam |
|---|---|
| `../scripts/bootstrap-aklast.mjs` | TRY bölgesi, KDV %20, satış kanalları, bayi grupları (idempotent) |
| `../scripts/import-products.mjs` | Lastik/jant CSV içe aktarma + bayi fiyat listesi kuralı (`customer.groups.id`, idempotent) |
| `../scripts/e2e-price-list.mjs` | Bayi/perakende fiyat ayrımı (ürün + sepet, `is_calculated_price_price_list`) |
| `../scripts/e2e-credit-account.mjs` | Cari hesap: sepet→kargo→vadeli sipariş→limit aşımı reddi→tahsilat |
| `../scripts/e2e-manual-payments.mjs` | Havale/EFT + Kapıda ödeme uçtan uca checkout |
| `../scripts/e2e-quote.mjs` | Bayi RFQ: quote oluştur→fiyat teklifi→send→preview→accept→sipariş |
| `../scripts/verify-storefront.mjs` | `/tr` ana sayfa, `/tr/store`, Türkçe karakterli handle'lı ürün sayfaları |

## Features

- **Company management** — Create and manage companies, invite employees, and assign roles
- **Spending limits** — Set per-employee spending limits with configurable reset frequencies
- **Approval workflows** — Require admin or sales manager approval before orders are placed
- **Quote management** — Allow customers and merchants to negotiate quotes with messaging
- **Order editing** — Adjust order items, pricing, and totals after placement
- **Bulk add-to-cart** — Add multiple products to the cart at once
- **Promotions** — Manual and automatic promotion support with free shipping progress
- **Full ecommerce** — Products, collections, cart, checkout, and order history

## Getting Started

### Deploy with Medusa Cloud

The fastest way to get started is deploying with [Medusa Cloud](https://cloud.medusajs.com):

1. [Create a Medusa Cloud account](https://cloud.medusajs.com)
2. Deploy this starter directly from your dashboard

### Local Installation

> **Prerequisites:**
>
> - [Node.js](https://nodejs.org/) v22.23.4+
> - [PostgreSQL](https://www.postgresql.org/) v15+
> - [pnpm](https://pnpm.io/) v9 (pinned to `pnpm@9.15.0` via `packageManager`)

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/medusajs/b2b-starter.git
cd b2b-starter
pnpm install
```

2. Set up environment variables for the backend:

```bash
cp apps/backend/.env.template apps/backend/.env
```

3. Set the database URL in `apps/backend/.env`:

```bash
# Replace with actual database URL, make sure the database exists.
DATABASE_URL=postgres://postgres:@localhost:5432/medusa-b2b-starter
```

4. Run migrations:

```bash
cd apps/backend
pnpm medusa db:migrate
```

5. Add admin user:

```bash
cd apps/backend
pnpm medusa user -e admin@test.com -p supersecret
```

6. Start Medusa backend:

```bash
cd apps/backend
pnpm dev
```

7. Open the admin dashboard at `localhost:9000/app` and log in. Retrieve your publishable API key at Settings > Publishable API key.

8. Set up environment variables for the storefront:

```bash
cp apps/storefront/.env.template apps/storefront/.env.local
```

9. Update `apps/storefront/.env.local` with your Medusa publishable API key:

```bash
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_6c3...
```

10. Start storefront:

```bash
cd apps/storefront
pnpm dev
```

The storefront runs on `http://localhost:8000`.

You can also run the following command from the root to start both backend and storefront:

```bash
pnpm dev
```

## Project Structure

```text
apps/
├── backend/      # Medusa v2 app: custom modules (company, quote, approval), API routes, workflows, admin extensions
└── storefront/   # Next.js 15 App Router storefront
```

The repo is a pnpm workspace orchestrated by [Turborepo](https://turborepo.com). Root scripts (`dev`, `build`, `lint`, `test:integration:http`) run in each app.

## Configuration

### Backend (`apps/backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string (optional) |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `COOKIE_SECRET` | Secret used to sign session cookies |
| `STORE_CORS` / `ADMIN_CORS` / `AUTH_CORS` | Allowed origins for the store, admin, and auth APIs |

### Storefront (`apps/storefront/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | URL of the Medusa backend |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Publishable API key (required) |
| `NEXT_PUBLIC_BASE_URL` | Public URL of the storefront |
| `NEXT_PUBLIC_DEFAULT_REGION` | Default region code (e.g. `us`) |
| `NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY` | Medusa Payments publishable key (optional) |
| `NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID` | Medusa Payments account ID (optional) |
| `REVALIDATE_SECRET` | Secret for on-demand cache revalidation |

## Building with AI Agents

- [`AGENTS.md`](./AGENTS.md): commands, structure, where to find things, and conventions for coding agents.
- Package docs: installed `@medusajs/*` packages ship an `AGENTS.md` in `node_modules/@medusajs/<pkg>/` (Medusa releases after v2.21.2).
- [Medusa agent skills](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills) for backend, admin, and storefront work.
- Docs MCP server: `claude mcp add --transport http medusa https://docs.medusajs.com/mcp`
- Medusa Cloud MCP server (Cloud users): `claude mcp add --transport http medusa-cloud https://cloud.medusajs.com/mcp`

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa B2B Commerce Recipe](https://docs.medusajs.com/resources/recipes/b2b)
- [Build with LLMs and AI](https://docs.medusajs.com/learn/introduction/build-with-llms-ai)
- [Medusa docs for LLMs (llms.txt)](https://docs.medusajs.com/llms.txt)
- [Next.js Documentation](https://nextjs.org/docs)
- [Discord Community](https://discord.gg/xpCwq3Kfn8)

## License

Licensed under the [MIT License](./LICENSE).
