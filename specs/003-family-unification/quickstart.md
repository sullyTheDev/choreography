# Quickstart: Family Unification

**Feature**: `003-family-unification`  
**Branch**: `003-family-unification`

---

## Prerequisites

- Node.js 20 LTS
- npm 10+
- The branch `003-family-unification` checked out

---

## Initial Setup

```bash
# Install dependencies (if not already installed)
npm install

# Apply all DB migrations (creates tables including the new ones from this feature)
npm run db:migrate

# Seed development data (family + members)
npm run db:seed
```

---

## Development Server

```bash
npm run dev
```

App runs at `http://localhost:5173`.

---

## Test Credentials (after seeding)

| Name | Role | Login method | Credential |
|------|------|-------------|------------|
| Parent | admin | email + password | `parent@example.com` / `password123` |
| Emma | member | display name + PIN | Name: `Emma`, PIN: `1234` |
| Jake | member | display name + PIN | Name: `Jake`, PIN: `5678` |

> **Note**: The login UX for member-role users changed in this feature. Members no longer enter a family code — they enter their display name and PIN directly.

---

## Running Tests

```bash
# Unit + integration tests
npm test

# Lint
npm run lint
```

---

## Working with Migrations

When changing `src/lib/server/db/schema.ts`, generate a new migration file:

```bash
# Generate migration SQL from schema diff
npm run db:generate   # runs: drizzle-kit generate

# Inspect generated SQL before applying
cat drizzle/<latest>.sql

# Apply to local dev DB
npm run db:migrate
```

The `drizzle-kit generate` command diffs `schema.ts` against previously applied migrations and emits the minimal SQL to reach the new state.

---

## Key Routes After This Feature

| URL | Description |
|-----|-------------|
| `/admin/family` | Member management (all roles) — replaces `/admin/kids` |
| `/admin/kids` | Redirects to `/admin/family` |
| `/admin/chores` | Chore management — assignee picker shows all members |
| `/chores?member=<id>` | Chores view for selected member — URL param renamed from `?kid=` |
| `/leaderboard` | All members ranked |
| `/prizes` | Prize shop — available to all members |

---

## Resetting the Database

```bash
# Delete local DB and re-run migrations + seed
rm -f data/choreography.db
npm run db:migrate
npm run db:seed
```
