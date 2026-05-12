FROM node:20-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# Copy entire monorepo
COPY . .

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build the backend (medusa build → apps/backend/.medusa/server/)
RUN pnpm --filter @b2b-starter/backend build

# Install production deps inside the built artifact
RUN cd apps/backend/.medusa/server && npm install --omit=dev

EXPOSE 9000

# Start from the built artifact directory
CMD ["sh", "-c", "cd apps/backend/.medusa/server && npm start"]
