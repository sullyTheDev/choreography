# Implementation Plan: Choreography MVP

**Branch**: `001-choreography-mvp` | **Date**: 2026-04-08 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-choreography-mvp/spec.md`

## Summary

Build the Choreography MVP — a family chore management web application where parents create chores and prizes, kids complete chores to earn coins, spend coins in a prize shop, and compete on a family leaderboard. The application is a single SvelteKit project using Drizzle ORM with SQLite (PostgreSQL-ready), containerized with Docker, and fully self-hostable.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS
**Framework**: SvelteKit 2.x (SSR + client, single app)
**ORM**: Drizzle ORM (code-first schema, drizzle-kit migrations)
**Storage**: SQLite via `better-sqlite3` for MVP; Drizzle's dialect abstraction enables PostgreSQL migration later
**Auth**: Cookie-based sessions; parent email/password (bcrypt); kid family-scoped PIN
**Testing**: Vitest (unit + integration), Playwright (E2E / acceptance), axe-core (accessibility)
**Target Platform**: Docker container (Node.js Alpine), self-hosted Linux/macOS/Windows
**Project Type**: web-app (single SvelteKit application)
**Performance Goals**: Page loads < 1s on localhost; chore completion round-trip < 500ms
**Constraints**: Single container, no external services required, SQLite file-based DB
**Scale/Scope**: Single-family MVP, ~8 screens (parent dashboard, kid dashboard, chore CRUD, prize CRUD, prize shop, leaderboard, settings/export, auth)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| # | Principle | Gate | Status |
|---|-----------|------|--------|
| I | Family-Centered Product Slices | Every feature maps to a parent or kid workflow; spec defines 3 independent user stories (P1–P3) | ✅ PASS |
| II | Self-Hostable and Open by Default | Single Docker container, SQLite, no cloud dependencies for core | ✅ PASS |
| III | Privacy and Parent Control First | No third-party analytics; parent-controlled kid profiles; data export/delete in FR-017 | ✅ PASS |
| IV | Test-First, Correct, Accessible Delivery | Spec written first; Vitest + Playwright for acceptance; axe-core for a11y; SC-003 requires 90% coverage | ✅ PASS |
| V | Observable Simplicity | Single SvelteKit app; structured logging via pino; quickstart docs required | ✅ PASS |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-choreography-mvp/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── routes.md        # SvelteKit route contracts
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── server/
│   │   ├── db/
│   │   │   ├── schema.ts          # Drizzle ORM code-first schema
│   │   │   ├── index.ts           # DB connection (SQLite driver)
│   │   │   └── seed.ts            # Optional dev seed data
│   │   ├── auth.ts                # Session + password helpers
│   │   └── logger.ts              # Pino structured logger
│   ├── components/
│   │   ├── ChoreCard.svelte
│   │   ├── Header.svelte
│   │   ├── KidSwitcher.svelte
│   │   ├── NavTabs.svelte
│   │   ├── PrizeCard.svelte
│   │   └── LeaderboardRow.svelte
│   └── stores/
│       └── session.ts             # Client-side session/user store
├── routes/
│   ├── (auth)/
│   │   ├── login/+page.svelte
│   │   └── signup/+page.svelte
│   ├── (app)/
│   │   ├── +layout.svelte         # App shell: header + nav tabs
│   │   ├── +layout.server.ts      # Auth guard + family loader
│   │   ├── chores/
│   │   │   ├── +page.svelte       # Kid chore dashboard
│   │   │   └── +page.server.ts
│   │   ├── prizes/
│   │   │   ├── +page.svelte       # Prize shop
│   │   │   └── +page.server.ts
│   │   ├── leaderboard/
│   │   │   ├── +page.svelte
│   │   │   └── +page.server.ts
│   │   └── admin/
│   │       ├── chores/
│   │       │   ├── +page.svelte   # Parent chore CRUD
│   │       │   └── +page.server.ts
│   │       ├── prizes/
│   │       │   ├── +page.svelte   # Parent prize CRUD
│   │       │   └── +page.server.ts
│   │       ├── kids/
│   │       │   ├── +page.svelte   # Parent kid management
│   │       │   └── +page.server.ts
│   │       └── settings/
│   │           ├── +page.svelte   # Export/delete, leaderboard config
│   │           └── +page.server.ts
│   └── api/
│       └── export/+server.ts      # JSON data export endpoint
├── app.html
├── app.css                         # Global styles (warm beige/orange theme)
└── hooks.server.ts                 # Session middleware + request logging

tests/
├── unit/                           # Vitest: schema helpers, auth logic
├── integration/                    # Vitest: server-side loaders/actions
└── e2e/                            # Playwright: full user journeys

static/
└── favicon.ico

drizzle/                            # Generated migration files (drizzle-kit)

Dockerfile
docker-compose.yml
drizzle.config.ts
svelte.config.js
vite.config.ts
package.json
tsconfig.json
.env.example
```

**Structure Decision**: Single SvelteKit application following its conventional `src/routes` + `src/lib` layout. Server-only code lives in `src/lib/server/`. Drizzle ORM schema is code-first in `src/lib/server/db/schema.ts`; migrations are generated by `drizzle-kit` into `drizzle/`. Docker containerization wraps the entire app. This aligns with Constitution Principle V (Observable Simplicity) — one project, one container, minimal moving parts.

## Complexity Tracking

No constitution violations. Table intentionally left empty.
