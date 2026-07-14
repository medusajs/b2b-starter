FROM node:20-bookworm-slim

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV MEDUSA_DISABLE_TELEMETRY=1
ENV STORE_CORS=http://localhost:3000
ENV ADMIN_CORS=http://localhost:9000,http://localhost:7001
ENV AUTH_CORS=http://localhost:3000,http://localhost:9000
ENV REDIS_URL=redis://redis:6379
ENV JWT_SECRET=supersecret
ENV COOKIE_SECRET=supersecret
ENV DATABASE_URL=postgres://postgres:postgres@postgres:5432/medusa-b2b-headless?sslmode=disable

RUN corepack enable

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/backend/package.json apps/backend/package.json

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm --filter @b2b-starter/backend build

RUN mkdir -p /app/apps/backend/public \
  && if [ ! -e /app/apps/backend/public/admin ]; then ln -s /app/apps/backend/.medusa/server/public/admin /app/apps/backend/public/admin; fi

WORKDIR /app/apps/backend

EXPOSE 9000

CMD ["sh", "-c", "pnpm medusa db:migrate --execute-all-links && exec pnpm medusa start --host 0.0.0.0 --port 9000"]
