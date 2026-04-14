# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app


COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /app

# Only copy the built output, migrations, and production node_modules
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/src/migrate.ts ./src/migrate.ts
COPY package.json .

# Persistent data directory for SQLite
RUN mkdir -p data

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run migrations then start the server
CMD ["sh", "-c", "node --import tsx/esm src/migrate.ts && node build/index.js"]
