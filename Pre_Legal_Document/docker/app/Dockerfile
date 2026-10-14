# Base image
FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

# Install dependencies
FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/database/package.json ./packages/database/
COPY packages/shared/package.json ./packages/shared/
COPY packages/validation/package.json ./packages/validation/
COPY packages/ui/package.json ./packages/ui/
COPY packages/template-engine/package.json ./packages/template-engine/
COPY packages/document-engine/package.json ./packages/document-engine/
COPY apps/web/package.json ./apps/web/
COPY apps/worker/package.json ./apps/worker/
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
FROM dependencies AS prisma-generate
COPY packages/database/prisma ./packages/database/prisma/
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
COPY --from=builder --chown=appuser:appgroup /app/apps/web/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=appuser:appgroup /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=appuser:appgroup /app/packages/database/prisma ./packages/database/prisma

USER appuser
EXPOSE 3000
CMD ["node", "apps/web/server.js"]