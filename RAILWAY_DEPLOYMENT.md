# Railway deployment — `pg-b2b-demo-backend`

This walks you through deploying the Medusa backend (`apps/backend`) and a Postgres database to Railway. Follow it click-by-click.

You will end up with:

- Railway project: **`pg-b2b-demo-backend`**
- Two services in that project: **`pg-b2b-demo-db`** (Postgres) and **`pg-b2b-demo-backend`** (the Medusa app)
- A public URL like `https://pg-b2b-demo-backend-production.up.railway.app`

---

## 0. Prerequisites

- A Railway account ([railway.com](https://railway.com)) with a payment method on file (free trial covers initial usage; expect ~$5–10/month for a low-traffic demo)
- The fork pushed to GitHub: `Metamorf-aus/saas-b2b-platform`, branch `main` (merge `claude/review-attached-docs-49sSU` into main first)

---

## 1. Create the project

1. Open **[railway.com/new](https://railway.com/new)**.
2. Click **"Deploy from GitHub repo"**.
3. Authorise Railway to access `Metamorf-aus/saas-b2b-platform` if you haven't already.
4. Select **`Metamorf-aus/saas-b2b-platform`**.
5. When asked, click **"Add variables later"** (we'll set them in step 4).
6. Once created, **rename the project** to `pg-b2b-demo-backend` (top-left → ⋯ → Rename).

---

## 2. Add the Postgres database

1. In the project canvas, click **"+ Create"** (top-right) → **"Database"** → **"Add PostgreSQL"**.
2. Click the new database service tile and **rename it** to `pg-b2b-demo-db` (Settings → Service Name).
3. Done. Railway exposes its connection string at `${{Postgres.DATABASE_URL}}` for any other service in the same project.

---

## 3. Configure the backend service

Click on the backend service tile (the one connected to GitHub).

### 3a. Settings → Source

| Field | Value |
|---|---|
| Repository | `Metamorf-aus/saas-b2b-platform` |
| Branch | `main` |
| Root Directory | *(leave blank — repo root)* |
| Watch Paths | `apps/backend/**` *(optional, prevents storefront-only changes from triggering rebuilds)* |

### 3b. Settings → Build

| Field | Value |
|---|---|
| Builder | **Nixpacks** *(default)* |
| Build Command | `pnpm install --frozen-lockfile && pnpm --filter @b2b-starter/backend build` |
| Pre-deploy Command | `cd apps/backend && pnpm medusa db:migrate` |

### 3c. Settings → Deploy

| Field | Value |
|---|---|
| Start Command | `cd apps/backend && pnpm start` |
| Healthcheck Path | `/health` *(optional)* |
| Restart Policy | `On Failure` |

---

## 4. Set environment variables

In the backend service, go to **Variables**. Add the following.

> ⚠️ Generate strong random strings for `JWT_SECRET` and `COOKIE_SECRET`. On any terminal: `openssl rand -base64 32`. Do **not** use the placeholder values in production.

| Variable | Value | Notes |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway substitutes the live Postgres connection string |
| `JWT_SECRET` | *(random, ~32 chars)* | |
| `COOKIE_SECRET` | *(random, ~32 chars)* | |
| `NODE_ENV` | `production` | |
| `STORE_CORS` | *(temporary)* `*` | We'll lock this down to the Netlify URL in step 8 |
| `ADMIN_CORS` | *(temporary)* `*` | Same — locked down later |
| `AUTH_CORS` | *(temporary)* `*` | Same — locked down later |
| `MEDUSA_BACKEND_URL` | *(leave blank for now)* | Set after step 5 once Railway gives the public URL |
| `DISABLE_MEDUSA_ADMIN` | `false` | Keep the admin dashboard enabled |

`REDIS_URL` is optional. The starter works without it — skip unless you want event subscribers / job queues.

---

## 5. First deploy + capture the public URL

1. Settings → Networking → click **"Generate Domain"**.
2. Railway gives you a URL like `pg-b2b-demo-backend-production.up.railway.app`.
3. **Copy that URL.** Go to Variables, set `MEDUSA_BACKEND_URL=https://pg-b2b-demo-backend-production.up.railway.app`.
4. Railway will redeploy automatically.

Watch the **Deploy logs** until you see Medusa booted (`✓ Server is ready on port ...`). The `db:migrate` pre-deploy command runs first and you should see the schema migrations apply.

---

## 6. Run the seed scripts (one-time)

Once the backend is live, seed it. In Railway, click the backend service → top-right **⋯ menu → "Open Shell"** (or use the Railway CLI: `railway shell`).

Run, in this order:

```bash
cd apps/backend

# 6a. Backend admin user (logs into /app dashboard)
pnpm medusa user -e Billy@thepg.com.au -p Precision3062

# 6b. Foundation: store, region, products
pnpm medusa exec ./src/migration-scripts/initial-data-seed.ts

# 6c. B2B layer: 3 Departments + Billy's storefront customer & employee record
pnpm medusa exec ./src/migration-scripts/demo-b2b-seed.ts
```

If a seed fails because data already exists, it's safe — the seed isn't idempotent, so only run each script once.

---

## 7. Get the publishable API key

1. Open **`https://<your-railway-url>/app`** in a browser.
2. Log in with **`Billy@thepg.com.au` / `Precision3062`** (the admin user from step 6a).
3. Go to **Settings → Publishable API Keys**.
4. There should be one called **"Default Publishable API Key"** (created by the initial seed).
5. Click it and **copy the key value** — looks like `pk_01H...`.
6. **Save this key.** You need it for the Netlify storefront in `NETLIFY_DEPLOYMENT.md` step 4.

---

## 8. Lock down CORS (after Netlify is live)

Once the Netlify storefront is deployed and you have its URL (e.g. `https://pg-b2b-demo-storefront.netlify.app`), come back here:

1. Backend service → Variables.
2. Replace the temporary `*` values:

| Variable | New value |
|---|---|
| `STORE_CORS` | `https://pg-b2b-demo-storefront.netlify.app` |
| `ADMIN_CORS` | `https://pg-b2b-demo-storefront.netlify.app,https://<your-railway-url>` |
| `AUTH_CORS` | `https://pg-b2b-demo-storefront.netlify.app,https://<your-railway-url>` |

3. Railway redeploys. Verify storefront → backend calls work.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with "pnpm: command not found" | Confirm Builder is Nixpacks (it auto-detects pnpm from the lockfile). If it persists, set `NIXPACKS_PKGS=pnpm` in Variables. |
| Migration fails with "database does not exist" | The Postgres service hasn't finished provisioning. Wait 30s and redeploy. |
| `pnpm medusa user` says command not found in shell | You're in the wrong directory. `cd apps/backend` first. |
| Admin dashboard at `/app` returns 404 | Confirm `DISABLE_MEDUSA_ADMIN=false` and rebuild. |
| Storefront says "CORS blocked" | You haven't done step 8 yet, or there's a typo in the URL. |

---

## Summary

After completing all steps you have:

- Backend at `https://pg-b2b-demo-backend-production.up.railway.app`
- Admin dashboard at `https://pg-b2b-demo-backend-production.up.railway.app/app`
- Login: `Billy@thepg.com.au` / `Precision3062`
- Publishable key copied for the Netlify step
- Database seeded with 3 Departments and 8 products in AUD

Now go to **`NETLIFY_DEPLOYMENT.md`**.
