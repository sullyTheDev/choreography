# Contracts: Fulfillment Dashboard

**Feature**: `004-fulfillment-dashboard`  
**Date**: 2026-04-16

This document defines load-data and form-action contracts for the admin approvals workflow.

## Load Contracts

### GET /admin (manage landing)

Files:

- [src/routes/(app)/admin/+page.server.ts](../../../src/routes/(app)/admin/+page.server.ts)
- [src/routes/(app)/admin/+page.svelte](../../../src/routes/(app)/admin/+page.svelte)

Authorization:

- Requires authenticated admin session.

Response shape additions:

```ts
{
  pendingApprovalsCount: number;
}
```

Behavior:

1. Count is number of `prize_redemptions` rows where `family_id=session.familyId` and `status='pending'`.
2. Value is displayed as numeric badge on Approvals card.

### GET /admin/approvals

Files:

- [src/routes/(app)/admin/approvals/+page.server.ts](../../../src/routes/(app)/admin/approvals/+page.server.ts)
- [src/routes/(app)/admin/approvals/+page.svelte](../../../src/routes/(app)/admin/approvals/+page.svelte)

Authorization:

- Requires authenticated admin session.

Query parameters:

| Name | Type | Required | Default | Notes |
|------|------|----------|---------|-------|
| `page` | number | no | `1` | 1-based pagination |
| `sort` | string | no | `requestedAt` | allowed: `requestedAt`, `memberName`, `prizeName`, `coinCost` |
| `dir` | string | no | `asc` | allowed: `asc`, `desc` |

Response shape:

```ts
{
  items: Array<{
    redemptionId: string;
    prizeId: string;
    prizeName: string;
    prizeEmoji: string;
    memberId: string;
    memberName: string;
    requestedAt: string;
    coinCost: number;
  }>;
  totalCount: number;
  page: number;
  pageSize: number;
  sort: 'requestedAt' | 'memberName' | 'prizeName' | 'coinCost';
  dir: 'asc' | 'desc';
}
```

Behavior:

1. Includes only pending redemptions in current admin family.
2. Default ordering is oldest first (`requestedAt asc`).
3. Empty list renders friendly empty-state message.

## Action Contracts

### POST /admin/approvals?action=fulfill

File: [src/routes/(app)/admin/approvals/+page.server.ts](../../../src/routes/(app)/admin/approvals/+page.server.ts)

Request fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `redemptionId` | string | yes | Must belong to current family and be `pending` |

Success response:

```ts
{ success: true }
```

Conflict response (already handled by another admin):

```ts
{ success: false, conflict: 'already_processed' }
```

Failure response:

- `fail(400, { error: string })` for validation issues.
- `error(403, 'Forbidden')` for non-admin access.

Side effects:

1. Update redemption status `pending -> fulfilled`.
2. Insert `activity_events` row:
   - `eventType='prize_fulfilled'`
   - `entityType='prize_redemption'`
   - `entityId=redemptionId`
   - `deltaCoins=0`
   - metadata includes `prizeId`, `prizeTitle`, `fromStatus`, `toStatus`, and source.

### POST /admin/approvals?action=dismiss

File: [src/routes/(app)/admin/approvals/+page.server.ts](../../../src/routes/(app)/admin/approvals/+page.server.ts)

Request fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `redemptionId` | string | yes | Must belong to current family and be `pending` |

Success response:

```ts
{ success: true }
```

Conflict response (already handled by another admin):

```ts
{ success: false, conflict: 'already_processed' }
```

Failure response:

- `fail(400, { error: string })` for validation issues.
- `error(403, 'Forbidden')` for non-admin access.

Side effects:

1. Delete pending redemption row.
2. No coin refund, no recalculation, no compensating event required.
3. UI requires dismiss confirmation before submitting action.
