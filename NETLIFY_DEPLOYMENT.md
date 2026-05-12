# Netlify deployment — `pg-b2b-demo-storefront`

This walks you through deploying the Next.js storefront (`apps/storefront`) to Netlify and protecting it with a site password.

You will end up with:

- Netlify site: **`pg-b2b-demo-storefront`**
- A public URL like `https://pg-b2b-demo-storefront.netlify.app`
- Site-wide password protection (Netlify Pro feature)

---

## 0. Prerequisites

- Netlify Pro plan (you confirmed you're on this) — needed for site-password protection
- The Railway backend already deployed and the **publishable API key** in hand (from `RAILWAY_DEPLOYMENT.md` step 7)

---

## 1. Create the site

1. Open **[app.netlify.com](https://app.netlify.com)**.
2. Top-right **"Add new site"** → **"Import an existing project"**.
3. **"Deploy with GitHub"** → authorise if needed → select **`Metamorf-aus/saas-b2b-platform`**.
4. Branch to deploy: **`main`**.

---

## 2. Build settings

When prompted (or under Site configuration → Build & deploy → Continuous deployment), set:

| Field | Value |
|---|---|
| Base directory | `apps/storefront` |
| Build command | `cd ../.. && pnpm install --frozen-lockfile && pnpm --filter @b2b-starter/storefront build` |
| Publish directory | `apps/storefront/.next` |
| Functions directory | *(leave blank)* |

> Note: the filter uses the exact workspace package name `@b2b-starter/storefront`. If you ever fork this repo and rename the package, update this build command accordingly.

### Next.js plugin

Netlify's Next.js Runtime should auto-install. Confirm under **Site configuration → Build & deploy → Build plugins** that `@netlify/plugin-nextjs` is enabled. If not, add it from the Plugins directory.

---

## 3. Rename the site

Site configuration → General → Site details → **"Change site name"** → set to `pg-b2b-demo-storefront`.

Your URL becomes `https://pg-b2b-demo-storefront.netlify.app`.

---

## 4. Set environment variables

Site configuration → Environment variables → **"Add a variable"** for each:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://pg-b2b-demo-backend-production.up.railway.app` *(from Railway step 5)* |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | *(the `pk_01H…` key from Railway step 7)* |
| `NEXT_PUBLIC_BASE_URL` | `https://pg-b2b-demo-storefront.netlify.app` |
| `NEXT_PUBLIC_DEFAULT_REGION` | `au` |
| `REVALIDATE_SECRET` | *(any random string, e.g. `openssl rand -hex 16`)* |
| `NODE_VERSION` | `20` |

Optional (only set if you wired Stripe/etc.):

| `NEXT_PUBLIC_MEDUSA_PAYMENTS_PUBLISHABLE_KEY` | *(leave blank for demo)* |
| `NEXT_PUBLIC_MEDUSA_PAYMENTS_ACCOUNT_ID` | *(leave blank for demo)* |

---

## 5. Trigger the first deploy

Deploys → **"Trigger deploy"** → "Deploy site". Watch the build log. First build takes ~3–5 minutes.

When the green check appears, open the URL. You should see the Precision-branded storefront with products in AUD. The home page should load and category navigation should work.

---

## 6. Enable site-password protection

Now to gate it behind a password.

1. Site configuration → **Access & security** → **Visitor access**.
2. **"Site protection"** → choose **"Password protection"**.
3. Set the password (suggest something memorable for stakeholders, e.g. `precision-demo-2026`).
4. Save. Netlify immediately enforces the gate.
5. Test in an incognito window: visit your URL → password prompt → enter password → site loads.

> Stakeholders enter the password once per session; bookmarkable as long as the cookie persists.

---

## 7. Smoke test the full flow

In an incognito window with the site password:

| Step | Expected |
|---|---|
| Visit storefront | Precision logo in nav, products listed in AUD |
| Click a product | Detail page renders, "Add to cart" button visible |
| Add to cart → open cart drawer | Item shown, no free-shipping nudge, no promo code field |
| Click "Account" → Sign in | Login form |
| Sign in as `Billy@thepg.com.au` / `Precision3062` | Account dashboard, sidebar shows "Department" not "Company", no "Quotes" entry |
| Click "Department" link | Procurement department details, Quantity Limit visible (not Spending Limit) |
| Logout | Returns to public storefront |

If any of these fail, see Troubleshooting below.

---

## 8. Update Railway CORS

Now that the storefront URL is fixed, lock down CORS on Railway. Go back to `RAILWAY_DEPLOYMENT.md` step 8 and replace the `*` placeholder values with `https://pg-b2b-demo-storefront.netlify.app`.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails: "package not found" | The build command filter must match the workspace package name exactly. Confirm with `node -p "require('./apps/storefront/package.json').name"` — it should be `@b2b-starter/storefront`. |
| Build fails: out of memory | Site configuration → Environment variables → add `NODE_OPTIONS=--max_old_space_size=4096`. |
| Site loads but products don't | Wrong publishable key, or wrong backend URL. Check browser devtools network tab — calls to backend should return 200. |
| Storefront calls backend but gets CORS errors | Railway `STORE_CORS` is wrong. See `RAILWAY_DEPLOYMENT.md` step 8. |
| Login at /account/login fails | The backend admin user (Billy) is *not* the storefront customer. Both accounts share `Billy@thepg.com.au` + `Precision3062`. The storefront customer was created by the seed in `RAILWAY_DEPLOYMENT.md` step 6c. If that seed didn't run, the storefront login will fail. |
| Password gate not appearing | Confirm you're on Netlify Pro (Free plan doesn't support site password). |

---

## Summary

After completing all steps you have:

- Storefront at `https://pg-b2b-demo-storefront.netlify.app`, password-protected
- Storefront login: `Billy@thepg.com.au` / `Precision3062`
- Backend admin still at `https://pg-b2b-demo-backend-production.up.railway.app/app` (separate URL, same credentials, no password gate — that's an admin tool, not stakeholder-facing)

You're now ready to fill placeholders in `DEMO_HANDOVER.md` and present.
