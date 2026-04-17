# Data Model: Fulfillment Dashboard

**Feature**: `004-fulfillment-dashboard`  
**Phase**: 1 - Design  
**Date**: 2026-04-16

## Overview

No new tables are required. This feature operates on existing entities with stricter query constraints and explicit state transitions.

## Entities Used

### PrizeRedemption

Source: [src/lib/server/db/schema.ts](../../src/lib/server/db/schema.ts)

Core fields used by this feature:

- `id: string`
- `prizeId: string`
- `memberId: string`
- `familyId: string`
- `coinCost: number`
- `status: 'available' | 'pending' | 'fulfilled'`
- `redeemedAt: string` (ISO timestamp)

Feature-specific constraints:

- Approvals list includes only rows where `status='pending'` and `familyId=session.familyId`.
- Fulfill action allowed only when current row is still pending.
- Dismiss action allowed only when current row is still pending.

### Prize

Core fields used:

- `id: string`
- `familyId: string`
- `title: string`
- `emoji: string`

Used for list context display: emoji + title.

### Member

Core fields used:

- `id: string`
- `displayName: string`
- `avatarEmoji: string`
- `isActive: boolean`

Used for list context display and family scoping through family membership.

### ActivityEvent

Core fields used for fulfill logging:

- `id: string`
- `familyId: string`
- `actorMemberId: string`
- `subjectMemberId: string`
- `eventType: string` (`prize_fulfilled`)
- `entityType: string` (`prize_redemption`)
- `entityId: string` (redemption id)
- `deltaCoins: number` (0)
- `metadata: string` (JSON payload)
- `occurredAt: string`
- `createdAt: string`

## Relationships

1. `PrizeRedemption.prizeId -> Prize.id`
2. `PrizeRedemption.memberId -> Member.id`
3. `PrizeRedemption.familyId -> Family.id`
4. `ActivityEvent.subjectMemberId -> Member.id`

## Derived Read Model (Approvals Row)

Approvals table row shape:

- `redemptionId: string`
- `prizeId: string`
- `prizeName: string`
- `prizeEmoji: string`
- `memberId: string`
- `memberName: string`
- `requestedAt: string`
- `coinCost: number`

Sort columns:

- `requestedAt` (default ascending)
- `memberName`
- `prizeName`
- `coinCost`

Pagination model:

- `page: number`
- `pageSize: number`
- `totalCount: number`

## State Transitions

```text
available --(member uses prize)-> pending --(admin fulfill)-> fulfilled
pending --(admin dismiss)-> deleted
```

Rules:

1. Fulfill requires current state `pending`; result is `fulfilled`.
2. Dismiss requires current state `pending`; result is row deletion.
3. If state is no longer pending at action time, action is treated as concurrency conflict and returns handled "already processed" feedback.

## Validation Rules

1. Admin authorization required (`session.memberRole='admin'`).
2. Family boundary required (`familyId=session.familyId`) in every query/update/delete.
3. Fulfill writes one activity event with `eventType='prize_fulfilled'` and metadata including prize and transition details.
4. Dismiss writes no coin refund side effect.
