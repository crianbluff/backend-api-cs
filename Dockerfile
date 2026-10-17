# ─── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:20.20.2-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig.json ./

RUN npm ci --ignore-scripts

COPY src/ ./src/

RUN npm run build


# ─── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20.20.2-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts \
    && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/scripts/ ./src/scripts

RUN addgroup -S appgroup \
    && adduser -S appuser -G appgroup \
    && mkdir -p /app/logs \
    && chown -R appuser:appgroup /app

USER appuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3001}/health || exit 1


CMD ["node", "dist/server.js"]
