# Base image
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# Install dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/packages/database/package.json ./backend/packages/database/
COPY backend/packages/shared/package.json ./backend/packages/shared/
COPY backend/packages/validation/package.json ./backend/packages/validation/
COPY backend/packages/ui/package.json ./backend/packages/ui/
COPY backend/packages/template-engine/package.json ./backend/packages/template-engine/
COPY backend/packages/document-engine/package.json ./backend/packages/document-engine/
COPY frontend/web/package.json ./frontend/web/
COPY backend/worker/package.json ./backend/worker/
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
FROM dependencies AS prisma-generate
COPY backend/packages/database/prisma ./backend/packages/database/prisma/
RUN pnpm db:generate --filter=@prelegal/database

# Build all packages
FROM prisma-generate AS builder
COPY . .
RUN pnpm build

# Production runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built application
COPY --from=builder --chown=appuser:appgroup /app/frontend/web/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/frontend/web/.next/static ./frontend/web/.next/static
COPY --from=builder --chown=appuser:appgroup /app/frontend/web/public ./frontend/web/public
COPY --from=builder --chown=appuser:appgroup /app/backend/packages/database/prisma ./backend/packages/database/prisma

USER appuser
EXPOSE 3000
CMD ["node", "frontend/web/server.js"]