# Medusa B2B Backend

This repository now runs as a headless Medusa backend only. It keeps the custom B2B modules, store APIs, admin APIs, and Medusa admin dashboard, but no longer ships a customer-facing storefront.

## Features

- Company management with employee roles and spending limits
- Approval workflows for company purchases
- Quote management and quote messaging
- Custom store APIs for future web, mobile, or partner clients
- Custom admin APIs and admin dashboard extensions for B2B operations

## Project Layout

- `apps/backend`: the Medusa backend application
- `apps/backend/src/api/store`: customer-facing store API extensions
- `apps/backend/src/api/admin`: admin API extensions
- `apps/backend/src/admin`: custom Medusa admin routes and components
- `apps/backend/src/modules`: custom B2B domain modules

## Local Setup

Prerequisites:

- Node.js 20+
- PostgreSQL 15+
- `pnpm` 9+

1. Install dependencies:

```bash
pnpm install
```

2. Create the backend environment file:

```bash
cp apps/backend/.env.template apps/backend/.env
```

3. Update `apps/backend/.env` with your database URL, secrets, and allowed CORS origins.

4. Run database migrations:

```bash
cd apps/backend
pnpm medusa db:migrate
```

5. Create an admin user:

```bash
cd apps/backend
pnpm medusa user -e admin@test.com -p supersecret
```

6. Start the backend from the repo root:

```bash
pnpm dev
```

The Medusa server and admin dashboard run on `http://localhost:9000`, with the admin UI at `http://localhost:9000/app`.

## Docker

To start the full stack with Docker:

```bash
docker compose up --build
```

That command starts:

- Medusa backend on `http://localhost:9000`
- Medusa admin on `http://localhost:9000/app`
- PostgreSQL with a persistent named volume
- Redis with a persistent named volume

The Docker setup appends `?sslmode=disable` to the internal Postgres URL because Medusa's module migrations otherwise assume SSL for non-`localhost` hostnames such as the Compose service name `postgres`.

Useful follow-up commands:

```bash
docker compose down
docker compose logs -f backend
docker compose exec backend pnpm medusa user -e admin@test.com -p supersecret
```

You can override defaults like `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, `COOKIE_SECURE`, or `MEDUSA_PORT` by exporting them before running `docker compose up --build`.

For local Docker usage over plain `http://localhost`, keep `COOKIE_SECURE=false` so the admin session cookie can be set by the browser. Set it back to `true` when you run the backend behind HTTPS.

## Environment Variables

`apps/backend/.env` supports:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_SECRET` | Secret used to sign JWT tokens |
| `COOKIE_SECRET` | Secret used to sign auth/session cookies |
| `COOKIE_SECURE` | Whether the session cookie requires HTTPS |
| `STORE_CORS` | Comma-separated origins allowed to call public store APIs |
| `ADMIN_CORS` | Comma-separated origins allowed to load the Medusa admin UI |
| `AUTH_CORS` | Comma-separated origins allowed for authenticated browser flows |

If you add an external client later, create a publishable API key in the admin dashboard and point that client to this backend's `/store/*` endpoints.

## Notes

- This codebase remains headless even with the Medusa admin dashboard enabled.
- Removing the storefront does not remove the custom store APIs; those endpoints are still the contract for future clients.
- Quote, approval, and company workflows are still managed by the backend modules in `apps/backend/src`.

## Resources

- [Medusa Documentation](https://docs.medusajs.com)
- [Medusa B2B Commerce Recipe](https://docs.medusajs.com/resources/recipes/b2b)
- [Discord Community](https://discord.gg/xpCwq3Kfn8)

## License

Licensed under the [MIT License](./LICENSE).
