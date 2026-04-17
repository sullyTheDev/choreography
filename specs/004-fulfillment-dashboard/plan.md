# Implementation Plan: Fulfillment Dashboard

**Branch**: `004-add-redemption-dashboard` | **Date**: 2026-04-16 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/004-fulfillment-dashboard/spec.md`

## Summary

Add a parent/admin-only approvals inbox at `/admin/approvals` for pending prize redemptions, plus a pending-count badge on the admin landing page card. The implementation extends existing SvelteKit server-load and form-action patterns, uses Skeleton v4 table/pagination/badge UI patterns, updates redemption state (`pending` -> `fulfilled`) or deletes dismissed rows, and records fulfillment in `activity_events` using existing event conventions.

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20 LTS  
**Primary Dependencies**: SvelteKit 2, Svelte 5 Runes, Drizzle ORM, `@skeletonlabs/skeleton-svelte` v4, Tailwind CSS v4, `@lucide/svelte`  
**Storage**: SQLite via Drizzle ORM + libsql (`drizzle-orm/libsql`)  
**Testing**: Vitest integration + Playwright e2e (`npm test`)  
**Target Platform**: Self-hosted SvelteKit SSR web app  
**Project Type**: Full-stack web application (single SvelteKit project)  
**Performance Goals**: Primary Fulfill interaction completes in <=5 seconds UX target (spec SC-001); server-side action target p95 <300ms at family scale  
**Constraints**: Family-scoped admin visibility only, Dismiss has confirmation while Fulfill remains single-tap, no refund logic on dismiss, Skeleton v4 first for UI primitives  
**Scale/Scope**: Single-family admin queue, realistic <=200 pending rows per family, pagination defaults to small page size for rapid scanning

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Family-Centered Product Slices | PASS | Direct parent workflow improvement: quick review and fulfillment of kid prize requests |
| II. Self-Hostable and Open by Default | PASS | Uses existing SvelteKit + SQLite stack; no hosted-only services |
| III. Privacy and Parent Control First | PASS | Route is admin-only and family-scoped; no third-party analytics added |
| IV. Test-First, Correct, Accessible Delivery | PASS | Plan includes integration + e2e acceptance coverage for pending/fulfill/dismiss/empty states |
| V. Observable Simplicity | PASS | Extends existing server action patterns, logs fulfillment/dismiss operations with existing logger/activity model |
| VI. Skeleton UI System First | PASS | Table/pagination/badge/buttons use Skeleton/Tailwind patterns already used in admin activity page |

## Project Structure

### Documentation (this feature)

```text
specs/004-fulfillment-dashboard/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── form-actions.md
└── tasks.md                 # Created later by /speckit.tasks
```

### Source Code (repository root)

```text
src/
├── routes/
│   ├── (app)/
│   │   ├── admin/
│   │   │   ├── +page.server.ts                 # NEW: load pending count for Manage card badge
│   │   │   ├── +page.svelte                    # UPDATED: add Approvals card + numeric badge
│   │   │   ├── approvals/
│   │   │   │   ├── +page.server.ts             # NEW: pending list load + fulfill/dismiss actions
│   │   │   │   └── +page.svelte                # NEW: full-width table, sorting, pagination, actions, empty state
│   │   │   └── activity/
│   │   │       ├── +page.server.ts             # UPDATED: ensure prize_fulfilled event appears consistently
│   │   │       └── +page.svelte                # potentially minor label/icon polish if needed
│   │   └── member/
│   │       └── prizes/my-prizes/+page.server.ts # unchanged source of pending records
│   └── kiosk/
│       └── ...                                  # no change expected for this feature
├── lib/
│   └── server/
│       └── db/schema.ts                         # no schema change expected

tests/
├── integration/
│   └── admin-approvals.test.ts                  # NEW: load/fulfill/dismiss/family-scope/concurrency tests
└── e2e/
    └── approvals-dashboard.test.ts              # NEW: admin workflow and badge/empty-state UX
```

**Structure Decision**: Keep a single SvelteKit app structure and extend existing admin route patterns (`+page.server.ts` + `+page.svelte`) without introducing new services or packages.

## Phase 0: Research

Research output: [research.md](research.md)

Resolved technical decisions:

1. Admin Manage page currently has only [src/routes/(app)/admin/+page.svelte](../../src/routes/(app)/admin/+page.svelte); add [src/routes/(app)/admin/+page.server.ts](../../src/routes/(app)/admin/+page.server.ts) for badge count while preserving existing card layout.
2. Use existing event model in [src/lib/server/db/schema.ts](../../src/lib/server/db/schema.ts): write `activity_events` with `eventType='prize_fulfilled'` and metadata on Fulfill.
3. Preserve transaction and fail/error conventions used in [src/routes/(app)/member/prizes/my-prizes/+page.server.ts](../../src/routes/(app)/member/prizes/my-prizes/+page.server.ts) and [src/routes/(app)/admin/family/+page.server.ts](../../src/routes/(app)/admin/family/+page.server.ts).
4. Reuse Skeleton pagination and filter patterns from [src/routes/(app)/admin/activity/+page.svelte](../../src/routes/(app)/admin/activity/+page.svelte) for table paging/sorting UX.

## Phase 1: Design and Contracts

Design outputs:

1. Data model: [data-model.md](data-model.md)
2. Contracts: [contracts/form-actions.md](contracts/form-actions.md)
3. Developer quickstart: [quickstart.md](quickstart.md)

Design highlights:

1. No schema migration needed; feature uses existing `prize_redemptions.status` values and `activity_events` table.
2. Approvals queries are strictly family-scoped and pending-only.
3. Concurrency behavior is explicit: when row no longer pending, return handled conflict response and refresh list.
4. Dismiss action is destructive and requires UI confirmation before posting action.

## Phase 2: Implementation Planning Approach

Planned execution slices (for /speckit.tasks generation):

1. Add admin manage badge data loading and Approvals card UI.
2. Build approvals load query + sort/pagination + empty state UI.
3. Implement Fulfill action with activity event logging and conflict handling.
4. Implement Dismiss action (delete) with confirmation and conflict handling.
5. Add integration and e2e acceptance coverage for pending-only view, fulfill, dismiss, empty state, and family scope.

## Constitution Check (Post-Design Re-check)

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Family-Centered Product Slices | PASS | User stories remain independent and testable (view queue, fulfill, dismiss) |
| II. Self-Hostable and Open by Default | PASS | No external runtime dependency introduced |
| III. Privacy and Parent Control First | PASS | Family-bound filters are part of every load/action contract |
| IV. Test-First, Correct, Accessible Delivery | PASS | Planned tests cover acceptance criteria and table-action flows |
| V. Observable Simplicity | PASS | Existing logger + activity_events reused; no extra abstraction layer |
| VI. Skeleton UI System First | PASS | Design prescribes Skeleton table/pagination/button/badge primitives |

## Complexity Tracking

No constitution violations identified; complexity exemptions not required.

