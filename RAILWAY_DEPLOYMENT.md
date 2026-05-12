# Railway deployment — `pg-b2b-demo-backend`

This walks you through deploying the Medusa backend (`apps/backend`) and a Postgres database to Railway. Follow it click-by-click.

You will end up with:

- Railway project: **`pg-b2b-demo-backend`**
- Two services in that project: **`pg-b2b-demo-db`** (Postgres) and **`pg-b2b-demo-backend`** (the Medusa app)
- A public URL like `https://pg-b2b-demo-backend-production.up.railway.app`

---

## 0. Prerequisites

- A Railway account ([railway.com](https://railway.com)) with a payment method on file (free trial covers initial usage; expect ~$5–10/month for a low-traffic demo)
- The repo pushed to GitHub: `Metamorf-aus/saas-b2b-platform`, branch `main`

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

### 3b. Settings → Build

| Field | Value |
|---|---|
| Builder | **Dockerfile** |
| Dockerfile Path | `Dockerfile` |
| Build Command | *(leave blank)* |

> The `Dockerfile` at the repo root handles everything: installing dependencies, building the Medusa backend + admin bundle, and setting the start command.

### 3c. Settings → Deploy

| Field | Value |
|---|---|
| Custom Start Command | *(leave blank — the Dockerfile `CMD` handles it)* |
| Pre-deploy Command | `cd apps/backend && pnpm medusa db:migrate` |
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
| `PORT` | `9000` | |
| `STORE_CORS` | *(temporary)* `*` | We'll lock this down to the Netlify URL in step 8 |
| `ADMIN_CORS` | *(temporary)* `*` | Same — locked down later |
| `AUTH_CORS` | *(temporary)* `*` | Same — locked down later |
| `MEDUSA_ADMIN_EMAIL` | `Billy@thepg.com.au` | Admin dashboard login |
| `MEDUSA_ADMIN_PASSWORD` | `Precision3062` | Admin dashboard login |
| `DISABLE_MEDUSA_ADMIN` | `false` | Keep the admin dashboard enabled |

`REDIS_URL` is optional. The starter works without it — skip unless you want event subscribers / job queues.

---

## 5. First deploy + capture the public URL

1. Settings → Networking → click **"Generate Domain"**.
2. Railway gives you a URL like `pg-b2b-demo-backend-production.up.railway.app`.
3. **Copy that URL.** Go to Variables, set `MEDUSA_BACKEND_URL=https://pg-b2b-demo-backend-production.up.railway.app`.
4. Go to **Deployments** tab → **⋯** on the latest → **Redeploy**.
5. Build takes **5–10 minutes** (the Dockerfile compiles the admin bundle — this is normal). Watch the build logs for "Building admin..." messages.
6. When the deploy log shows the server started, visit `https://<your-railway-url>/health` — it should return `{"status":"ok"}`.

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

If a seed fails because data already exists, it's safe to skip that script — don't run any script twice.

---

## 7. Get the publishable API key

1. Open **`https://<your-railway-url>/app`** in a browser.
2. Log in with **`Billy@thepg.com.au` / `Precision3062`**.
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
| Build fails "could not find index.html in admin build directory" | Builder is still Nixpacks/Railpack. Go back to step 3b and change Builder to **Dockerfile**. |
| Deploy fails "Cannot find module medusa-config" | Custom Start Command is not blank. Go back to step 3c and clear it. |
| Pre-deploy `db:migrate` fails with connection error | `DATABASE_URL` is resolving to empty. In Variables, replace `${{Postgres.DATABASE_URL}}` with the raw connection string (Railway → Postgres service → Variables → copy `DATABASE_URL` value → paste into backend service `DATABASE_URL`). |
| Startup crash: server starts but `/health` 404s | Confirm `PORT=9000` is set in Variables. |
| Admin dashboard at `/app` returns 404 | Confirm `DISABLE_MEDUSA_ADMIN=false` and redeploy. |
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
