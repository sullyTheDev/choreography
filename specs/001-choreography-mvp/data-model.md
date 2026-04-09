# Data Model: Choreography MVP

**Feature**: Choreography MVP
**Date**: 2026-04-08
**Phase**: 1 — Design & Contracts
**ORM**: Drizzle ORM (code-first, `sqliteTable` builder)

## Entity Relationship Overview

```text
Family 1──* Parent
Family 1──* Kid
Family 1──* Chore
Family 1──* Prize
Kid    1──* ChoreCompletion
Chore  1──* ChoreCompletion
Kid    1──* PrizeRedemption
Prize  1──* PrizeRedemption
Family 1──1 LeaderboardConfig
Family 1──* Session
```

## Entities

### Family

The top-level grouping. All data is scoped to a family.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| name | text | NOT NULL | e.g., "The Smiths" |
| leaderboardResetDay | integer | NOT NULL, default 1 (Monday) | Day of week (1=Mon–7=Sun) for weekly reset |
| createdAt | text (ISO 8601) | NOT NULL | |

### Parent

An adult user who manages the family.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| familyId | text | FK → Family.id, NOT NULL | |
| email | text | UNIQUE, NOT NULL | Login identifier |
| passwordHash | text | NOT NULL | bcrypt hash |
| displayName | text | NOT NULL | |
| createdAt | text (ISO 8601) | NOT NULL | |

**Validation rules**:
- Email must be a valid email format and unique across all parents.
- Password must be ≥ 8 characters before hashing.

### Kid

A child profile within a family.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| familyId | text | FK → Family.id, NOT NULL | |
| displayName | text | NOT NULL | e.g., "Emma" |
| avatarEmoji | text | NOT NULL | e.g., "👧" |
| pin | text | NOT NULL | bcrypt-hashed 4–6 digit PIN |
| isActive | integer (boolean) | NOT NULL, default 1 | Soft-delete flag |
| createdAt | text (ISO 8601) | NOT NULL | |

**Validation rules**:
- PIN must be 4–6 numeric digits.
- `displayName` must be unique within the family.
- When `isActive = 0`, kid cannot log in and is hidden from leaderboard.

**Derived fields** (not stored):
- `coinBalance`: `SUM(chore_completions.coinsAwarded) - SUM(prize_redemptions.coinCost)` for this kid.

### Chore

A task created by a parent.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| familyId | text | FK → Family.id, NOT NULL | |
| title | text | NOT NULL | e.g., "Make your bed" |
| description | text | NOT NULL, default '' | e.g., "Neatly make your bed every morning" |
| emoji | text | NOT NULL | e.g., "🛏️" |
| frequency | text | NOT NULL, CHECK IN ('daily','weekly') | |
| coinValue | integer | NOT NULL, CHECK > 0 | Coins awarded on completion |
| assignedKidId | text | FK → Kid.id, nullable | NULL = available to all kids |
| isActive | integer (boolean) | NOT NULL, default 1 | Soft-delete flag |
| createdAt | text (ISO 8601) | NOT NULL | |

**Validation rules**:
- `coinValue` must be a positive integer.
- `frequency` must be exactly `'daily'` or `'weekly'`.
- If `assignedKidId` is set, it must reference an active kid in the same family.

### ChoreCompletion

Records a kid completing a chore.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| choreId | text | FK → Chore.id, NOT NULL | |
| kidId | text | FK → Kid.id, NOT NULL | |
| familyId | text | FK → Family.id, NOT NULL | Denormalized for query performance |
| coinsAwarded | integer | NOT NULL | Snapshot of chore coinValue at completion time |
| completedAt | text (ISO 8601) | NOT NULL | |

**Validation rules**:
- A unique constraint on `(choreId, kidId, periodKey)` prevents duplicate completions within the same frequency window. `periodKey` is a derived value:
  - Daily: `YYYY-MM-DD`
  - Weekly: `YYYY-Www` (ISO week)
- Note: `periodKey` is computed at insert time and stored as a column for indexing.

**Additional column for uniqueness**:

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| periodKey | text | NOT NULL | `'2026-04-08'` (daily) or `'2026-W15'` (weekly) |

**Unique index**: `(choreId, kidId, periodKey)`

### Prize

A reward created by a parent.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| familyId | text | FK → Family.id, NOT NULL | |
| title | text | NOT NULL | e.g., "Extra screen time" |
| description | text | NOT NULL, default '' | |
| coinCost | integer | NOT NULL, CHECK > 0 | |
| isActive | integer (boolean) | NOT NULL, default 1 | Soft-delete flag |
| createdAt | text (ISO 8601) | NOT NULL | |

**Validation rules**:
- `coinCost` must be a positive integer.

### PrizeRedemption

Records a kid redeeming a prize.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text (ULID) | PK | |
| prizeId | text | FK → Prize.id, NOT NULL | |
| kidId | text | FK → Kid.id, NOT NULL | |
| familyId | text | FK → Family.id, NOT NULL | Denormalized for query performance |
| coinCost | integer | NOT NULL | Snapshot of prize coinCost at redemption time |
| redeemedAt | text (ISO 8601) | NOT NULL | |

**Validation rules**:
- Kid must have sufficient coin balance at redemption time (checked within a transaction).

### Session

Server-side session store for cookie-based auth.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | text | PK | Secure random token |
| familyId | text | FK → Family.id, NOT NULL | |
| userId | text | NOT NULL | Parent.id or Kid.id |
| userRole | text | NOT NULL, CHECK IN ('parent','kid') | |
| expiresAt | text (ISO 8601) | NOT NULL | |
| createdAt | text (ISO 8601) | NOT NULL | |

## State Transitions

### Chore Completion Flow

```text
[Chore Pending] ──(kid taps checkmark)──► [Validate: not already completed this period]
                                            │
                                     ┌──────┴──────┐
                                     │  Within TX  │
                                     │  1. Insert  │
                                     │  completion │
                                     │  record     │
                                     └─────────────┘
                                            │
                                            ▼
                                     [Chore Completed]
                                     (card turns green,
                                      balance updated)
```

### Prize Redemption Flow

```text
[Prize Available] ──(kid taps redeem)──► [Validate: balance ≥ coinCost]
                                            │
                                     ┌──────┴──────┐
                                     │  Within TX  │
                                     │  1. Insert  │
                                     │  redemption │
                                     │  record     │
                                     └─────────────┘
                                            │
                                            ▼
                                     [Prize Redeemed]
                                     (balance decreased,
                                      logged for parent)
```

## Indexes

| Table | Index | Columns | Purpose |
|-------|-------|---------|---------|
| ChoreCompletion | uq_completion_period | (choreId, kidId, periodKey) | Prevent duplicate completions |
| ChoreCompletion | idx_completion_kid | (kidId, completedAt) | Kid dashboard queries |
| ChoreCompletion | idx_completion_family | (familyId, completedAt) | Leaderboard queries |
| PrizeRedemption | idx_redemption_kid | (kidId, redeemedAt) | Balance calculation |
| PrizeRedemption | idx_redemption_family | (familyId, redeemedAt) | Parent activity log |
| Chore | idx_chore_family | (familyId, isActive) | Chore list queries |
| Prize | idx_prize_family | (familyId, isActive) | Prize shop queries |
| Kid | idx_kid_family | (familyId, isActive) | Family member lists |
| Parent | idx_parent_email | (email) | Login lookup (covered by UNIQUE) |
| Session | idx_session_expires | (expiresAt) | Session cleanup |
