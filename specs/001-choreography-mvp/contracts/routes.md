# Route Contracts: Choreography MVP

**Feature**: Choreography MVP
**Date**: 2026-04-08
**Phase**: 1 — Design & Contracts
**Framework**: SvelteKit 2.x

This document defines the SvelteKit route contracts — the server-side `load` functions and form `actions` that each route exposes. These are the public interfaces of the application.

---

## Authentication Routes — `(auth)` group

### `POST /login`

**Action: default**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes (parent) | Parent login |
| pin | string | Yes (kid) | Kid login — also requires `familyCode` |
| familyCode | string | Conditional | Required for kid login; derived from family ID |
| role | string | Yes | `'parent'` or `'kid'` |

**Success**: Set session cookie, redirect to `/chores` (kid) or `/admin/chores` (parent).
**Failure**: Return `{ error: string }` with 401 status.

### `POST /signup`

**Action: default**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| email | string | Yes | Parent email |
| password | string | Yes | ≥ 8 characters |
| displayName | string | Yes | Parent display name |
| familyName | string | Yes | e.g., "The Smiths" |

**Success**: Create family + parent, set session cookie, redirect to `/admin/kids`.
**Failure**: Return `{ error: string }` (e.g., duplicate email).

---

## App Routes — `(app)` group

All routes in this group require an authenticated session (enforced in `+layout.server.ts`).

### `(app)/+layout.server.ts` — load

Runs on every `(app)` page. Returns shared layout data.

**Output**:

```typescript
{
  user: { id: string; displayName: string; role: 'parent' | 'kid'; avatarEmoji?: string };
  family: { id: string; name: string; familyCode: string };
  kids: Array<{ id: string; displayName: string; avatarEmoji: string; coinBalance: number }>;
  activeKidId: string | null;  // From URL param or session default
}
```

---

### `GET /chores` — load

Kid chore dashboard (also accessible to parents for viewing).

**Query params**: `?kid={kidId}` (optional, for parent view or kid switching)

**Output**:

```typescript
{
  greeting: string;           // "Hey 👧 Emma!"
  remainingCount: number;     // Chores not yet completed today
  chores: Array<{
    id: string;
    emoji: string;
    title: string;
    description: string;
    frequency: 'daily' | 'weekly';
    coinValue: number;
    assignedKidName: string | null;
    isCompleted: boolean;       // For the active kid in current period
  }>;
}
```

### `POST /chores` — action: complete

**Form data**:

| Field | Type | Required |
|-------|------|----------|
| choreId | string | Yes |

**Validation**: Kid must be authenticated; chore must not be already completed this period; chore must be assigned to this kid or unassigned.
**Success**: Insert ChoreCompletion record, return updated chore list.
**Failure**: Return `{ error: string }` (e.g., "Already completed today").

---

### `GET /prizes` — load

Prize shop for kids.

**Output**:

```typescript
{
  prizes: Array<{
    id: string;
    title: string;
    description: string;
    coinCost: number;
    canAfford: boolean;       // kid.coinBalance >= coinCost
  }>;
  coinBalance: number;
}
```

### `POST /prizes` — action: redeem

**Form data**:

| Field | Type | Required |
|-------|------|----------|
| prizeId | string | Yes |

**Validation**: Kid must have sufficient coins.
**Success**: Insert PrizeRedemption record, return updated prize list + balance.
**Failure**: Return `{ error: string }` (e.g., "Not enough coins").

---

### `GET /leaderboard` — load

**Output**:

```typescript
{
  period: { start: string; end: string; label: string };  // e.g., "Apr 7 – Apr 13"
  rankings: Array<{
    rank: number;
    kidId: string;
    displayName: string;
    avatarEmoji: string;
    coinsEarned: number;      // In current period
  }>;
}
```

---

## Admin Routes — `(app)/admin` group

All admin routes require `role === 'parent'`.

### `GET /admin/chores` — load

**Output**:

```typescript
{
  chores: Array<{
    id: string;
    emoji: string;
    title: string;
    description: string;
    frequency: 'daily' | 'weekly';
    coinValue: number;
    assignedKid: { id: string; displayName: string } | null;
  }>;
  kids: Array<{ id: string; displayName: string }>;  // For assignment dropdown
}
```

### `POST /admin/chores` — actions

**Action: create**

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | No (default '') |
| emoji | string | Yes |
| frequency | 'daily' \| 'weekly' | Yes |
| coinValue | number | Yes (> 0) |
| assignedKidId | string | No |

**Action: update**

Same fields as create, plus `choreId: string`.

**Action: delete**

| Field | Type | Required |
|-------|------|----------|
| choreId | string | Yes |

Soft-deletes the chore (`isActive = 0`).

---

### `GET /admin/prizes` — load

**Output**:

```typescript
{
  prizes: Array<{
    id: string;
    title: string;
    description: string;
    coinCost: number;
  }>;
}
```

### `POST /admin/prizes` — actions

**Action: create**

| Field | Type | Required |
|-------|------|----------|
| title | string | Yes |
| description | string | No (default '') |
| coinCost | number | Yes (> 0) |

**Action: update**

Same fields plus `prizeId: string`.

**Action: delete**

| Field | Type | Required |
|-------|------|----------|
| prizeId | string | Yes |

---

### `GET /admin/kids` — load

**Output**:

```typescript
{
  kids: Array<{
    id: string;
    displayName: string;
    avatarEmoji: string;
    coinBalance: number;
    isActive: boolean;
  }>;
}
```

### `POST /admin/kids` — actions

**Action: create**

| Field | Type | Required |
|-------|------|----------|
| displayName | string | Yes |
| avatarEmoji | string | Yes |
| pin | string | Yes (4–6 digits) |

**Action: update**

Same fields plus `kidId: string`. PIN is optional on update.

**Action: deactivate**

| Field | Type | Required |
|-------|------|----------|
| kidId | string | Yes |

Sets `isActive = 0`.

---

### `GET /admin/settings` — load

**Output**:

```typescript
{
  family: { id: string; name: string; familyCode: string; leaderboardResetDay: number };
}
```

### `POST /admin/settings` — actions

**Action: updateFamily**

| Field | Type | Required |
|-------|------|----------|
| familyName | string | No |
| leaderboardResetDay | number | No (1–7) |

**Action: exportData**

Triggers a JSON export of the full family dataset (redirects to `/api/export`).

**Action: deleteFamily**

Deletes all family data and invalidates sessions. Requires confirmation field.

---

### `GET /api/export`

Returns a JSON file download containing all family data.

**Response**: `Content-Type: application/json`, `Content-Disposition: attachment; filename="choreography-export-{familyId}.json"`

```typescript
{
  family: { /* ... */ };
  parents: [ /* ... */ ];
  kids: [ /* ... */ ];
  chores: [ /* ... */ ];
  choreCompletions: [ /* ... */ ];
  prizes: [ /* ... */ ];
  prizeRedemptions: [ /* ... */ ];
  exportedAt: string;  // ISO 8601
}
```
