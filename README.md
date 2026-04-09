# Choreography

A family chore management app that makes getting things done fun. Parents manage chores and prizes; kids earn coins by completing chores and spend them in the prize shop. A weekly leaderboard keeps sibling competition friendly.

## Features

- **Parent dashboard** — create and manage chores (daily/weekly, coin reward, emoji icon, optional kid assignment), kids, prizes, and family settings
- **Kid dashboard** — personalised greeting, remaining-chore count, chore cards with one-tap completion
- **Prize shop** — kids browse and redeem coins for prizes created by parents
- **Leaderboard** — weekly rankings by coins earned across the family
- **Activity log** — chronological feed of chore completions and prize redemptions
- **Data export** — download all family data as JSON from Settings
- **PIN-based kid login** — kids sign in with a shared family code + a unique 4–6 digit PIN; no email required

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 Runes |
| Language | TypeScript 5 |
| Database | SQLite via libsql + Drizzle ORM |
| Auth | bcrypt passwords (parents) · bcrypt PINs (kids) · cookie sessions |
| Logging | pino + pino-pretty |
| Runtime | Node.js 20 |
| Container | Docker + Docker Compose |
| Tests | Vitest (integration) · Playwright (e2e) |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Copy env and configure
cp .env.example .env
# Edit .env — at minimum set SESSION_SECRET to a random 32+ char string

# 3. Apply database migrations
npm run db:migrate

# 4. (Optional) Seed demo data
npm run db:seed

# 5. Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `file:./data/choreography.db` | Path to SQLite database file |
| `SESSION_SECRET` | *(none)* | **Required.** Random secret for signing session cookies (32+ chars) |
| `PORT` | `3000` | Port the production server listens on |
| `LOG_LEVEL` | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |

## Docker

### Quick start

```bash
# Copy and configure env
cp .env.example .env
# Set a strong SESSION_SECRET in .env

docker compose up
```

The app is available at [http://localhost:3000](http://localhost:3000). The SQLite database is persisted in `./data/` on the host via a bind mount.

### Build only

```bash
docker build -t choreography .
```

## Database

Migrations are managed with Drizzle Kit and run automatically on startup in both development and production.

```bash
# Generate a new migration after schema changes
npm run db:generate

# Apply pending migrations manually
npm run db:migrate

# Seed the database with demo data (dev only)
npm run db:seed
```

## Testing

```bash
# Run all integration tests (Vitest)
npm test

# Run in watch mode
npm run test:watch

# Run e2e tests (Playwright — requires dev server running)
npm run test:e2e

# Type-check the project
npm run check
```

## Project Structure

```
src/
  lib/
    components/       # Shared Svelte components (LeaderboardRow, etc.)
    server/
      auth.ts         # Password/PIN hashing, session management
      db/
        index.ts      # DB client + auto-migrate on startup
        schema.ts     # Drizzle schema (families, parents, kids, chores, …)
        utils.ts      # ULID generation, family code helpers
  routes/
    (auth)/           # Login + signup pages (no session required)
    (app)/            # Authenticated pages
      chores/         # Kid chore dashboard
      prizes/         # Kid prize shop
      leaderboard/    # Family leaderboard
      admin/
        chores/       # Parent chore management
        kids/         # Parent kid management
        prizes/       # Parent prize management
        activity/     # Activity log
        settings/     # Family settings + data export
    api/
      export/         # GET /api/export — full JSON data export
drizzle/              # SQL migration files
tests/
  integration/        # Vitest server-side tests
  e2e/                # Playwright browser tests
```

## How It Works

1. **Sign up** — a parent creates a family account at `/signup`. A unique family code is generated automatically.
2. **Add kids** — from Admin → Kids, add each child with a display name, avatar emoji, and a 4–6 digit PIN (unique within the family).
3. **Create chores** — from Admin → Chores, create chores with a coin reward, frequency, and optional kid assignment.
4. **Create prizes** — from Admin → Prizes, create prizes with a coin cost for kids to redeem.
5. **Kids log in** — kids go to `/login`, switch to "I'm a Kid", enter the family code (shown in Settings) and their PIN.
6. **Earn & spend** — kids complete chores to earn coins and redeem prizes to spend them.
7. **Compete** — the Leaderboard tab shows weekly rankings across the family.
