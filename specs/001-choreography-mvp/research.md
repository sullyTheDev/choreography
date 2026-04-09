# Research: Choreography MVP

**Feature**: Choreography MVP
**Date**: 2026-04-08
**Phase**: 0 — Outline & Research

## R1: SvelteKit + Drizzle ORM + SQLite Stack

**Task**: Research best practices for SvelteKit with Drizzle ORM and SQLite for a self-hosted web app.

**Decision**: Use SvelteKit 2.x with `@sveltejs/adapter-node` for Docker deployment. Drizzle ORM with `better-sqlite3` driver provides a code-first schema with type-safe queries and zero-config SQLite. `drizzle-kit` generates SQL migration files from schema diffs.

**Rationale**:
- SvelteKit's server-side rendering and form actions provide a full-stack framework in a single project, aligning with Constitution Principle V (Observable Simplicity).
- Drizzle ORM is lightweight, TypeScript-native, and supports both SQLite and PostgreSQL via dialect abstraction. Switching to PostgreSQL later requires only changing the driver and connection config — the schema and queries remain identical.
- `better-sqlite3` is synchronous and fast for single-process use, ideal for a self-hosted container.
- `adapter-node` produces a standard Node.js server that works in Docker without platform-specific adapters.

**Alternatives considered**:
- **Prisma**: Heavier runtime, requires a binary engine, more complex Docker builds. Drizzle is leaner and more transparent.
- **Knex.js**: Query builder only, no code-first schema generation or type-safe table definitions. Drizzle covers both.
- **adapter-auto**: Auto-detects platform but adds ambiguity in Docker. `adapter-node` is explicit and predictable.

---

## R2: Authentication Strategy for Parents and Kids

**Task**: Research authentication approach that supports parent email/password and kid PIN login within a family scope.

**Decision**: Cookie-based sessions with `httpOnly` secure cookies. Parent accounts use email + bcrypt-hashed password. Kid profiles use a family-scoped numeric PIN (4–6 digits), validated server-side. Sessions are stored in SQLite (session table) for simplicity and self-hosted portability.

**Rationale**:
- Cookie-based sessions are the simplest secure auth mechanism for SSR apps — no client-side token management needed.
- Family-scoped PINs for kids avoid requiring email addresses for children (Constitution Principle III — Privacy and Parent Control).
- SQLite session table keeps everything in one database file, simplifying backup and self-hosting.
- bcrypt is well-established for password hashing with configurable work factor.

**Alternatives considered**:
- **JWT tokens**: Stateless but harder to revoke, overkill for a single-container app. Sessions in SQLite are simpler.
- **OAuth/SSO**: Too complex for MVP; would require external identity providers, breaking self-hosting simplicity.
- **Lucia Auth library**: Good abstraction but adds a dependency. For MVP, a thin session helper (~50 lines) is sufficient and more transparent.

---

## R3: Docker Containerization Strategy

**Task**: Research Docker setup for a SvelteKit + SQLite application.

**Decision**: Single-stage production Dockerfile using `node:20-alpine`. Multi-stage build: stage 1 installs dependencies and runs `vite build`, stage 2 copies the built output and runs `node build/index.js`. SQLite database file is stored on a Docker volume mount for persistence. `docker-compose.yml` provides a one-command startup.

**Rationale**:
- Alpine-based image minimizes container size (~150MB).
- Multi-stage build separates build tooling from runtime, reducing attack surface.
- Volume mount for SQLite ensures data persists across container restarts and upgrades.
- `docker-compose.yml` lowers the barrier for self-hosters (Constitution Principle II).

**Alternatives considered**:
- **Bun runtime**: Faster startup but less mature ecosystem and `better-sqlite3` compatibility concerns. Node.js 20 LTS is the safer choice.
- **Distroless image**: Smaller but harder to debug. Alpine strikes a good balance.
- **PostgreSQL in compose**: Overkill for MVP. SQLite keeps the stack to a single container. PostgreSQL can be added as an optional compose profile later.

---

## R4: Drizzle ORM Code-First Schema and Migration Workflow

**Task**: Research Drizzle ORM code-first approach with SQLite and migration generation.

**Decision**: Define all tables in `src/lib/server/db/schema.ts` using Drizzle's `sqliteTable()` builder. Run `drizzle-kit generate` to produce SQL migration files in `drizzle/`. Run `drizzle-kit migrate` (or programmatic `migrate()` on app startup) to apply pending migrations. The schema file is the single source of truth.

**Rationale**:
- Code-first means the TypeScript schema drives the database — no separate SQL files to maintain manually.
- `drizzle-kit generate` diffs the current schema against the last known state and produces incremental migration SQL files automatically.
- Running migrations on startup ensures the database is always up-to-date in self-hosted deployments without manual intervention.
- Drizzle's `sqliteTable` and `pgTable` share nearly identical APIs, so the schema can be ported to PostgreSQL by swapping the table builder and driver.

**Alternatives considered**:
- **Manual SQL migrations**: Error-prone and tedious. Code-first eliminates drift between schema and code.
- **Push mode (drizzle-kit push)**: Applies schema directly without migration files — useful for dev but not appropriate for production where migration history matters.

---

## R5: Coin Balance Consistency

**Task**: Research how to ensure coin balances are always consistent (SC-006).

**Decision**: Coin balance is a **derived value**, not a stored column. It is computed as `SUM(chore_completion.coins_awarded) - SUM(prize_redemption.coin_cost)` for each kid. This eliminates drift between the balance and the transaction log. For display performance, the balance can be cached in the kid record and recomputed on each transaction within a SQLite transaction.

**Rationale**:
- A derived balance is provably consistent — there is no separate counter that can get out of sync.
- SQLite transactions are fast enough for single-family use; a cache column is optional but can be added with a trigger or recomputation on write.
- This approach satisfies SC-006 (every coin is traceable) by design.

**Alternatives considered**:
- **Stored balance column only**: Simpler reads but risks inconsistency if a bug skips the update. Rejected for MVP where correctness is prioritized.
- **Event sourcing**: Academically clean but overkill for a family chore app. Simple transaction tables achieve the same auditability.

---

## R6: Styling and Theming Approach

**Task**: Research styling strategy consistent with the mockup's warm beige/orange design language.

**Decision**: Use plain CSS with CSS custom properties (variables) for the theme. SvelteKit's scoped `<style>` blocks handle component styles. Global theme variables (colors, spacing, border-radius) are defined in `app.css`. No CSS framework needed for the MVP's simple card-based layout.

**Rationale**:
- The mockup is a straightforward card layout with a header, tabs, and list — no complex grid or animation system needed.
- CSS custom properties provide a single place to adjust the color palette (beige backgrounds, orange/amber accents, green completion states).
- Avoiding a CSS framework (Tailwind, Bootstrap) reduces bundle size and keeps the project simple for contributors (Constitution Principle V).

**Alternatives considered**:
- **Tailwind CSS**: Powerful but adds build complexity and a learning curve for contributors. The MVP's styling needs are simple enough for plain CSS.
- **Skeleton UI / DaisyUI**: Pre-built Svelte component libraries, but they impose their own design system which would fight the custom mockup aesthetic.

---

## R7: Structured Logging

**Task**: Research structured logging for a SvelteKit application in Docker.

**Decision**: Use `pino` for server-side structured JSON logging. Integrate via SvelteKit's `hooks.server.ts` to log each request. Log chore completions, prize redemptions, auth events, and errors as structured JSON to stdout. Docker captures stdout natively.

**Rationale**:
- Pino is the fastest Node.js JSON logger and works naturally with Docker log drivers.
- Structured logs in JSON are parseable by any log aggregation tool if the self-hoster chooses to add one later.
- Logging to stdout follows the 12-factor app pattern and keeps the container stateless (logs are not written to the SQLite volume).

**Alternatives considered**:
- **Winston**: Heavier, more config. Pino is faster and simpler.
- **Console.log**: Not structured, hard to parse. Pino adds minimal overhead.
