# Implementation Plan: Authentication System Refactor (Local + Generic OIDC)

**Branch**: `005-auth-system-refactor` | **Date**: 2026-04-17 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-auth-system-refactor/spec.md`

## Summary

Replace the in-house password/PIN plus cookie-session engine with `better-auth` as the single authentication layer while preserving self-hosted SvelteKit architecture and existing SQLite/Drizzle database. Deliver three runtime-driven login modes (`local`, `oidc`, `both`), generic OIDC support, deterministic local-account linking for first-time OIDC sign-in, and explicit operator-focused logging for OIDC misconfiguration scenarios.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS  
**Primary Dependencies**: SvelteKit 2, Svelte 5 Runes, Drizzle ORM, `@skeletonlabs/skeleton-svelte` v4, Tailwind CSS v4, `@lucide/svelte`, `better-auth`  
**Storage**: SQLite via Drizzle ORM + libsql (`drizzle-orm/libsql`) using existing `DATABASE_URL`  
**Testing**: Vitest integration + Playwright e2e + SvelteKit type/lint checks (`npm test`, `npm run test:e2e`, `npm run lint`)  
**Target Platform**: Self-hosted SvelteKit SSR web app (Node runtime, Docker optional)  
**Project Type**: Full-stack web application (single SvelteKit project)  
**Performance Goals**: Maintain login UX completion target from spec (`<=60s` in user tests), keep auth route/server action p95 under 300ms at family-scale workloads  
**Constraints**: Must fully remove legacy custom auth/session flow, must use generic OIDC only (no vendor SDKs), must keep local fallback behavior in `AUTH_MODE=both` when OIDC is misconfigured, must produce structured DevOps logs for configuration/claim failures, must enforce `OIDC_ZERO_MATCH_POLICY` (`deny` or `provision`, default `deny`), must preserve Skeleton v4-first UI policy  
**Scale/Scope**: Single-tenant family instances; expected active sessions per family in low hundreds; auth migration applies across all authenticated routes and admin/member role checks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Family-Centered Product Slices | PASS | Login and account-linking behavior directly supports parent/member family workflows |
| II. Self-Hostable and Open by Default | PASS | Keeps SvelteKit + SQLite self-host stack; OIDC remains optional and generic |
| III. Privacy and Parent Control First | PASS | No new analytics/data export paths; identity handling remains first-party and least-data |
| IV. Test-First, Correct, Accessible Delivery | PASS | Plan includes integration/e2e acceptance coverage for all auth modes and failure scenarios |
| V. Observable Simplicity | PASS | Consolidates auth into one engine (`better-auth`) and adds explicit structured error logging |
| VI. Skeleton UI System First | PASS | Login page updates continue to use Skeleton + Tailwind patterns |

## Project Structure

### Documentation (this feature)

```text
specs/005-auth-system-refactor/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-contracts.md
└── tasks.md                 # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── app.d.ts                                     # UPDATE: App.Locals typing for better-auth session/user shape
├── hooks.server.ts                              # UPDATE: replace legacy validateSession flow with better-auth handler/session loading
├── lib/
│   ├── auth.ts                                  # NEW: betterAuth() server configuration
│   ├── auth-client.ts                           # NEW: Svelte client auth helper
│   └── server/
│       ├── auth.ts                              # REMOVE/REWRITE: legacy hashing/session helpers no longer auth authority
│       └── db/
│           ├── index.ts                         # REUSE existing DB connection for better-auth adapter
│           └── schema.ts                        # UPDATE: add/align users, sessions, accounts (and supporting auth tables)
├── routes/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/+server.ts             # NEW: better-auth route handler
│   ├── (auth)/
│   │   └── login/
│   │       ├── +page.server.ts                 # UPDATE: runtime auth-mode config + error reporting inputs
│   │       └── +page.svelte                    # UPDATE: mode-aware local/oidc/both UI rendering
│   └── logout/+page.server.ts                  # UPDATE: sign out via better-auth session API

drizzle/
├── 00xx_better_auth_refactor.sql                # NEW migration(s): auth table alignment and data backfill/linking support
└── meta/_journal.json                           # UPDATE: migration journal entry

tests/
├── integration/
│   ├── auth-local.test.ts                       # NEW: local auth behavior
│   ├── auth-oidc.test.ts                        # NEW: oidc config/claim/linking behavior
│   └── auth-session-guards.test.ts              # NEW/UPDATED: route guard behavior from better-auth session
└── e2e/
    └── login-modes.test.ts                      # NEW: local/oidc/both rendering and fallback behavior
```

**Structure Decision**: Keep a single SvelteKit application and replace existing auth internals in place, introducing only `better-auth` server/client configuration modules and a dedicated auth API catch-all route.

## Phase 0: Research

Research output: [research.md](research.md)

Resolved technical decisions:

1. Reuse existing Drizzle/libsql database connection (`src/lib/server/db/index.ts`) as the storage layer for `better-auth`; do not create a second auth database.
2. Implement `better-auth` as the sole session authority by removing cookie-token validation in `hooks.server.ts` and replacing with `better-auth`-driven session extraction.
3. Model OIDC account linking as deterministic claim matching after trim + case-fold normalization, with hard-fail behavior for duplicate matches and missing claims as required by spec clarifications.
4. Support first-time OIDC zero-match behavior via `OIDC_ZERO_MATCH_POLICY`: deny with guidance or provision a new auth user/account mapping.
5. Handle `AUTH_MODE=both` misconfiguration by suppressing OIDC UI affordance while preserving local sign-in, and emit structured operator logs with actionable fields.
6. Keep generic OIDC integration only; no provider-specific SDK adapters.

## Phase 1: Design and Contracts

Design outputs:

1. Data model: [data-model.md](data-model.md)
2. Contracts: [contracts/auth-contracts.md](contracts/auth-contracts.md)
3. Developer quickstart: [quickstart.md](quickstart.md)

Design highlights:

1. Introduce/align `users`, `sessions`, and `accounts` tables for `better-auth` while preserving existing member/family domain data.
2. Add explicit migration/backfill path for linking pre-existing local users to new auth records without duplicate account creation.
3. Define endpoint/UI contracts for mode-driven login rendering, zero-match policy behavior, and auth callbacks.
4. Specify structured logging contract for OIDC misconfiguration, missing claim, and ambiguous-link failures.

## Phase 2: Implementation Planning Approach

Planned execution slices (for /speckit.tasks generation):

1. Install/configure `better-auth` and wire server/client modules plus auth API route.
2. Refactor DB schema/migrations for `better-auth` tables and data-linking rules.
3. Replace legacy hook/session/login/logout flows with `better-auth` session and sign-in flows.
4. Implement `AUTH_MODE`-driven login UI behavior (`local`, `oidc`, `both`) including misconfiguration fallback and messaging.
5. Implement OIDC claim extraction, normalization, linking, zero-match policy handling, and failure handling rules from spec clarifications.
6. Add integration and e2e coverage for auth modes, linking, and error observability.

## Constitution Check (Post-Design Re-check)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Family-Centered Product Slices | PASS | Stories remain independently testable (local, oidc, hybrid/linking) |
| II. Self-Hostable and Open by Default | PASS | No hosted-only dependency required; OIDC optional |
| III. Privacy and Parent Control First | PASS | Identity data use remains minimal (issuer + account claim mapping) |
| IV. Test-First, Correct, Accessible Delivery | PASS | Contracts and quickstart define acceptance-focused test gates |
| V. Observable Simplicity | PASS | Single auth engine reduces bespoke complexity and adds structured logging hooks |
| VI. Skeleton UI System First | PASS | Login UX contract uses existing Skeleton/Tailwind components and patterns |

## Complexity Tracking

No constitution violations identified; complexity exemptions not required.
