FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# Build-time inputs used only for SSR compilation in the builder stage.
# Keep runtime secrets in container runtime env, not build args.
ARG BUILD_ORIGIN=http://localhost:3000
ARG BUILD_AUTH_MODE=local
ARG BUILD_BETTER_AUTH_SECRET=build-time-placeholder-secret-at-least-32-characters

# Pass builder args through to env consumed by auth/bootstrap during `npm run build`.
ENV ORIGIN=${BUILD_ORIGIN}
ENV AUTH_MODE=${BUILD_AUTH_MODE}
ENV BETTER_AUTH_SECRET=${BUILD_BETTER_AUTH_SECRET}

# Build the SvelteKit app
RUN npm run build

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production

LABEL org.opencontainers.image.title="Choreography" \
	org.opencontainers.image.description="Family chore-tracking and reward app" \
	org.opencontainers.image.source="https://github.com/sullyTheDev/choreography" \
	org.opencontainers.image.licenses="MIT"

WORKDIR /app

# su-exec: drop-privilege helper (like gosu, but tiny — standard on Unraid images)
RUN apk add --no-cache su-exec

# Install production dependencies only (no devDeps, no tsx, no drizzle-kit, etc.)
COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

# Copy build artifacts and migration files
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/migrate.mjs ./build/migrate.mjs

# Persistent data directory for SQLite
RUN mkdir -p data

# Entrypoint handles PUID/PGID ownership and privilege drop
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000
# Defaults; override via environment variables at runtime
ENV PUID=1000
ENV PGID=1000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:${PORT}/ > /dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
