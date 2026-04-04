# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@9

COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile

COPY backend/ ./backend/
RUN cd backend && pnpm run prisma:generate && pnpm run build

# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN npm install -g pnpm@9

# Create non-root user
RUN addgroup --system aegis && adduser --system --ingroup aegis aegis

COPY --from=builder /app/backend/package.json ./
COPY --from=builder /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma

RUN chown -R aegis:aegis /app
USER aegis

ENV NODE_ENV=production
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/v1/health || exit 1

CMD ["node", "dist/main"]
