# Research: Fulfillment Dashboard

**Feature**: `004-fulfillment-dashboard`  
**Phase**: 0 - Outline and Research  
**Date**: 2026-04-16

## Decision 1: Add admin landing load for pending badge

- Decision: Introduce [src/routes/(app)/admin/+page.server.ts](../../src/routes/(app)/admin/+page.server.ts) to query pending redemption count and feed badge data to [src/routes/(app)/admin/+page.svelte](../../src/routes/(app)/admin/+page.svelte).
- Rationale: Current admin landing is Svelte-only and has no data load; badge requires server-side count scoped to admin family.
- Alternatives considered:
  - Query in client after mount: rejected due to flicker and duplicated auth logic.
  - Hardcoded or stale count from layout: rejected due to inconsistency risk and unclear ownership.

## Decision 2: Reuse existing redemption lifecycle and event taxonomy

- Decision: Fulfill transitions `prize_redemptions.status` from `pending` to `fulfilled` and inserts `activity_events` row with `eventType='prize_fulfilled'`.
- Rationale: Existing code already uses `prize_redeemed` when moving `available` -> `pending`; activity UI already understands `prize_fulfilled` labels/icons.
- Alternatives considered:
  - New status names or event types: rejected to avoid divergence and activity feed regressions.
  - Updating only status without activity event: rejected due to acceptance criterion and audit visibility requirements.

## Decision 3: Keep Dismiss as hard delete without coin adjustment

- Decision: Dismiss performs delete of pending redemption row only, no compensating coin event.
- Rationale: Matches clarified scope and out-of-scope statement; coin refunds are explicitly excluded for MVP.
- Alternatives considered:
  - Soft-cancel status: rejected because requirement says delete.
  - Refund workflow: rejected as out of scope.

## Decision 4: Concurrency handling via idempotent conflict response

- Decision: Fulfill and Dismiss actions target rows with predicates `(id, family_id, status='pending')`; if no row matches, return handled response for UI notice "already processed" and refresh.
- Rationale: Prevents stale-row writes and supports multi-admin safety with deterministic behavior.
- Alternatives considered:
  - Throw hard server error on no row found: rejected due to poor UX.
  - Silent success without notice: rejected because users need feedback when actions do not apply.

## Decision 5: Follow Skeleton v4 interaction patterns already used in admin pages

- Decision: Build approvals page as full-width table with sort/pagination controls and row actions styled with Skeleton button presets, reusing patterns from [src/routes/(app)/admin/activity/+page.svelte](../../src/routes/(app)/admin/activity/+page.svelte).
- Rationale: Maintains visual consistency and satisfies constitution principle VI.
- Alternatives considered:
  - Custom CSS table framework: rejected because Skeleton-first is mandatory.
  - Card list instead of table: rejected by spec requirement (must be table).

## Decision 6: Keep storage unchanged (no migration)

- Decision: No new Drizzle migration file; feature is query/action/UI only.
- Rationale: Schema already supports pending/fulfilled statuses and activity events.
- Alternatives considered:
  - Add additional redemption columns: rejected as unnecessary for defined requirements.
