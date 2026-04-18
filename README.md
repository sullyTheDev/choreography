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
| Auth | better-auth (local email/password · generic OIDC) · bcrypt PINs (kids) |
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
| `BETTER_AUTH_SECRET` | *(none)* | **Required.** Secret for better-auth session signing (32+ chars) |
| `AUTH_MODE` | `local` | Authentication mode: `local`, `oidc`, or `both` |
| `PORT` | `3000` | Port the production server listens on |
| `LOG_LEVEL` | `info` | Pino log level (`trace`, `debug`, `info`, `warn`, `error`) |

#### OIDC / Generic SSO (required when `AUTH_MODE=oidc` or `AUTH_MODE=both`)

| Variable | Default | Description |
|---|---|---|
| `OIDC_ISSUER` | *(none)* | OIDC provider base URL (discovery at `/.well-known/openid-configuration`) |
| `OIDC_CLIENT_ID` | *(none)* | OAuth client ID |
| `OIDC_CLIENT_SECRET` | *(none)* | OAuth client secret |
| `OIDC_ACCOUNT_CLAIM` | `email` | Claim key used to match OIDC identity to a local account |
| `OIDC_ISSUER_LABEL` | `Single Sign-On` | Display label on the OIDC sign-in button |
| `OIDC_ZERO_MATCH_POLICY` | `deny` | When no local match: `deny` blocks sign-in; `provision` creates a new account |

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

### Unraid Quick Config

If you run this container through Unraid Community Applications, set these first:

- Required:
  - `BETTER_AUTH_SECRET` (32+ characters)
  - `ORIGIN` (for example `http://tower.local:3000` or your reverse-proxy URL)
- Usually keep defaults:
  - `DATABASE_URL=file:./data/choreography.db`
  - `AUTH_MODE=local`
  - `LOG_LEVEL=info`
  - `PUID=99`, `PGID=100` (typical Unraid defaults)
- Only for SSO/OIDC:
  - `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`
  - optional: `OIDC_ACCOUNT_CLAIM`, `OIDC_ISSUER_LABEL`, `OIDC_ZERO_MATCH_POLICY`

The included Unraid template file (`unraid/choreography.xml`) maps:
- host path to `/app/data`
- host port to container `3000`
- all supported runtime environment variables

## Database

Migrations are SQL files managed by [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview) and stored in the `drizzle/` folder. They are applied in order to bring the SQLite schema up to date.

### How migrations run

**Local development (`npm run dev`)**
Run migrations manually with `npm run db:migrate` before starting the dev server for the first time, or after pulling schema changes.

**Docker / production**
Migrations run automatically at container startup — before the HTTP server begins accepting requests. The `CMD` in the Dockerfile is:
```
node build/migrate.mjs && node build/index.js
```
`src/migrate.mjs` connects to the database, applies any pending migrations from `drizzle/`, then exits. Only if that succeeds does `node build/index.js` start. This means:
- A failed migration stops the container immediately (visible in `docker compose logs`) rather than silently serving 500 errors.
- There is no race condition — the server never starts with an unmigrated schema.
- The `drizzle/` folder is baked into the production image during the Docker build so the migration files are always available.

### Commands

```bash
# Generate a new migration file after changing src/lib/server/db/schema.ts
npm run db:generate

# Apply pending migrations (local dev)
npm run db:migrate

# Apply pending migrations (production-like)
npm run db:migrate:prod

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

## REST API

The app exposes a **family-scoped REST API** for programmatic access to chores, prizes, redemptions, and activity data.

### Getting Started

1. **Generate an API key** — go to Admin → Settings and click "Generate API Key"
2. **Save the key** — it's shown only once; store it securely
3. **Use Bearer auth** — include `Authorization: Bearer <your-key>` header in requests

### Interactive Documentation

Visit [/api/docs](http://localhost:5173/api/docs) to explore the API with Swagger UI. You can test endpoints directly in the browser by pasting your API key.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/chores` | List all chores |
| POST | `/api/v1/chores` | Create a new chore |
| PUT | `/api/v1/chores?id=...` | Update a chore |
| DELETE | `/api/v1/chores?id=...` | Delete a chore |
| GET | `/api/v1/prizes` | List all prizes |
| POST | `/api/v1/prizes` | Create a new prize |
| PUT | `/api/v1/prizes?id=...` | Update a prize |
| DELETE | `/api/v1/prizes?id=...` | Delete a prize |
| GET | `/api/v1/members` | List family members (read-only) |
| GET | `/api/v1/redemptions` | List redemptions (filterable by status) |
| POST | `/api/v1/redemptions` | Create a redemption |
| PUT | `/api/v1/redemptions?id=...` | Update redemption status |
| GET | `/api/v1/completions` | Get chore completion history (paginated) |
| GET | `/api/v1/activity` | Get unified activity feed (paginated) |

### Example

```bash
# Get all chores for your family
curl -k -H "Authorization: Bearer choreo_xxxxx" https://localhost:5173/api/v1/chores

# Create a new chore
curl -k -X POST https://localhost:5173/api/v1/chores \
  -H "Authorization: Bearer choreo_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"name": "Wash Dishes", "emoji": "🧹"}'

# Update redemption to fulfilled
curl -k -X PUT https://localhost:5173/api/v1/redemptions?id=ulid_here \
  -H "Authorization: Bearer choreo_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"status": "fulfilled"}'
```

See [REST_API.md](REST_API.md) for detailed endpoint documentation and [/api/docs](/api/docs) for the interactive Swagger UI.

