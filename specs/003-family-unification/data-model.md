# Data Model: Family Unification

**Feature**: `003-family-unification`  
**Phase**: 1 — Design  
**Date**: 2026-04-13

---

## New Drizzle Schema (`src/lib/server/db/schema.ts`)

### Tables added

```ts
// ── members — replaces `parents` + `kids` ─────────────────────────────────
export const members = sqliteTable(
  'members',
  {
    id:           text('id').primaryKey(),                    // ULID
    displayName:  text('display_name').notNull().unique(),    // globally unique
    avatarEmoji:  text('avatar_emoji').notNull().default('👤'),
    email:        text('email').unique(),                     // nullable; admin role only
    passwordHash: text('password_hash'),                      // nullable; admin role only
    pin:          text('pin'),                                // nullable; member role only; bcrypt-hashed
    isActive:     integer('is_active', { mode: 'boolean' }).notNull().default(true),
    createdAt:    text('created_at').notNull()
  },
  (table) => [
    index('idx_member_display_name').on(table.displayName),
    index('idx_member_email').on(table.email)
  ]
);

// ── family_members — many-to-many join table ───────────────────────────────
export const familyMembers = sqliteTable(
  'family_members',
  {
    memberId: text('member_id').notNull().references(() => members.id),
    familyId: text('family_id').notNull().references(() => families.id),
    role:     text('role', { enum: ['admin', 'member'] }).notNull(),
    joinedAt: text('joined_at').notNull()
  },
  (table) => [
    primaryKey({ columns: [table.memberId, table.familyId] }),
    index('idx_fm_family_role').on(table.familyId, table.role)
  ]
);
```

### Tables removed

- `parents` — fully migrated into `members` (role = `'admin'`)  
- `kids` — fully migrated into `members` (role = `'member'`)

### Tables changed

```ts
// ── sessions — user_id/user_role replaced with member_id/member_role ──────
export const sessions = sqliteTable(
  'sessions',
  {
    id:         text('id').primaryKey(),                                     // crypto.randomUUID()
    familyId:   text('family_id').notNull().references(() => families.id),
    memberId:   text('member_id').notNull().references(() => members.id),   // was: user_id (no FK)
    memberRole: text('member_role', { enum: ['admin', 'member'] }).notNull(), // was: user_role 'parent'|'kid'
    expiresAt:  text('expires_at').notNull(),
    createdAt:  text('created_at').notNull()
  },
  (table) => [index('idx_session_expires').on(table.expiresAt)]
);

// ── chores — assigned_kid_id → assigned_member_id ───────────────────────
//  assignedMemberId: text('assigned_member_id').references(() => members.id)
//  (was: assignedKidId referencing kids.id)

// ── chore_completions — kid_id → member_id ────────────────────────────────
//  memberId: text('member_id').notNull().references(() => members.id)
//  (was: kidId referencing kids.id)
//  Unique index: (chore_id, member_id, period_key)  ← renamed from (chore_id, kid_id, period_key)

// ── prize_redemptions — kid_id → member_id ────────────────────────────────
//  memberId: text('member_id').notNull().references(() => members.id)
//  (was: kidId referencing kids.id)
```

---

## Entity Relationship Diagram

```
families ──< family_members >── members
                  │                │
                  │ (role:admin     │
                  │  or member)     │
                  │                ├── chore_completions
                  │                ├── prize_redemptions
                  │                ├── sessions
                  │                └── chores (assignedMemberId, optional)
                  │
                  └── chores (familyId)
                  └── chore_completions (familyId)
                  └── prizes / prize_redemptions (familyId)
```

---

## Validation Rules

| Rule | Constraint |
|------|-----------|
| `members.display_name` is globally unique | `UNIQUE` index on column |
| `members.email` is globally unique (when set) | `UNIQUE` index on column |
| A `members` row with `email IS NOT NULL` can have `pin IS NULL` | Application-level |
| A `members` row with `pin IS NOT NULL` can have `email IS NULL` | Application-level |
| A family MUST have at least one `family_members` row with `role = 'admin'` | Application-level guard before deactivate / remove |
| `chore_completions` is unique per `(chore_id, member_id, period_key)` | `UNIQUE` index |
| PIN must be 4–6 digits before hashing | Application-level in create/update actions |

---

## State Transitions

### Member `is_active`

```
created (is_active=true)
      │
      ▼ admin deactivates
deactivated (is_active=false)  ──► blocks login / hides from all active-member views
      │
      ▼ admin re-activates
active (is_active=true)
```

Last-admin lockout: if `is_active` would become `false` and the member is the last `admin`-role entry in `family_members` for that family, the action is rejected with HTTP 400.

### `family_members.role`

```
admin  ──► member   (role demotion — blocked if last admin in family)
member ──► admin    (role promotion — always allowed)
```

---

## Migration Plan (`drizzle/0001_family_unification.sql`)

### Phase A — Create new tables

```sql
-- 1. members
CREATE TABLE `members` (
  `id` text PRIMARY KEY NOT NULL,
  `display_name` text NOT NULL,
  `avatar_emoji` text DEFAULT '👤' NOT NULL,
  `email` text,
  `password_hash` text,
  `pin` text,
  `is_active` integer DEFAULT true NOT NULL,
  `created_at` text NOT NULL
);
CREATE UNIQUE INDEX `members_display_name_unique` ON `members` (`display_name`);
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`) WHERE `email` IS NOT NULL;
CREATE INDEX `idx_member_display_name` ON `members` (`display_name`);
CREATE INDEX `idx_member_email` ON `members` (`email`);

-- 2. family_members
CREATE TABLE `family_members` (
  `member_id` text NOT NULL,
  `family_id` text NOT NULL,
  `role` text NOT NULL,
  `joined_at` text NOT NULL,
  PRIMARY KEY (`member_id`, `family_id`),
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`),
  FOREIGN KEY (`family_id`) REFERENCES `families`(`id`)
);
CREATE INDEX `idx_fm_family_role` ON `family_members` (`family_id`, `role`);
```

### Phase B — Migrate data from old tables

```sql
-- Migrate parents → members (avatar_emoji defaults to '👤', pin = NULL)
INSERT INTO `members` (`id`, `display_name`, `avatar_emoji`, `email`, `password_hash`, `pin`, `is_active`, `created_at`)
SELECT `id`, `display_name`, '👤', `email`, `password_hash`, NULL, 1, `created_at`
FROM `parents`;

-- Migrate parents → family_members (role = 'admin')
INSERT INTO `family_members` (`member_id`, `family_id`, `role`, `joined_at`)
SELECT `id`, `family_id`, 'admin', `created_at`
FROM `parents`;

-- Migrate kids → members (email = NULL, password_hash = NULL)
INSERT INTO `members` (`id`, `display_name`, `avatar_emoji`, `email`, `password_hash`, `pin`, `is_active`, `created_at`)
SELECT `id`, `display_name`, `avatar_emoji`, NULL, NULL, `pin`, `is_active`, `created_at`
FROM `kids`;

-- Migrate kids → family_members (role = 'member')
INSERT INTO `family_members` (`member_id`, `family_id`, `role`, `joined_at`)
SELECT `id`, `family_id`, 'member', `created_at`
FROM `kids`;
```

### Phase C — Update `sessions` table

```sql
-- Drop old sessions (forced re-login; stale user_id values not migrated)
DROP TABLE `sessions`;

-- Recreate sessions with new schema
CREATE TABLE `sessions` (
  `id` text PRIMARY KEY NOT NULL,
  `family_id` text NOT NULL,
  `member_id` text NOT NULL,
  `member_role` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`family_id`) REFERENCES `families`(`id`),
  FOREIGN KEY (`member_id`) REFERENCES `members`(`id`)
);
CREATE INDEX `idx_session_expires` ON `sessions` (`expires_at`);
```

### Phase D — Update `chores` table

```sql
-- Add new column
ALTER TABLE `chores` ADD COLUMN `assigned_member_id` text REFERENCES `members`(`id`);

-- Copy data from old column
UPDATE `chores` SET `assigned_member_id` = `assigned_kid_id`;

-- SQLite: cannot drop columns directly in older versions; recreate table
-- (Drizzle kit handles this via table rebuild in generated SQL)
-- For the migration file, use CREATE TABLE ... AS SELECT pattern or Drizzle-generated DDL
```

> **Note**: SQLite's `ALTER TABLE DROP COLUMN` is available in SQLite 3.35+ (libsql supports it). The `assigned_kid_id` column references the `kids` table which will be dropped, so we must first nullify the FK reference. Drizzle kit `generate` will produce correct DDL; do not hand-write the drop-column step — let `drizzle-kit generate` emit it.

### Phase E — Update `chore_completions` table

```sql
-- Add new member_id column
ALTER TABLE `chore_completions` ADD COLUMN `member_id` text REFERENCES `members`(`id`);

-- Copy existing kid_id values
UPDATE `chore_completions` SET `member_id` = `kid_id`;

-- Recreate unique index with new column name (handled by Drizzle-generated migration)
```

### Phase F — Update `prize_redemptions` table

```sql
-- Add new member_id column
ALTER TABLE `prize_redemptions` ADD COLUMN `member_id` text REFERENCES `members`(`id`);

-- Copy existing kid_id values
UPDATE `prize_redemptions` SET `member_id` = `kid_id`;
```

### Phase G — Drop old tables

```sql
DROP TABLE `parents`;
DROP TABLE `kids`;
```

> **Implementation note**: The actual migration SQL file will be generated by running `drizzle-kit generate` after updating `schema.ts`. The steps above document the intent; the actual file in `drizzle/` is the authoritative source.

---

## TypeScript Type Changes

### `src/app.d.ts`

```ts
interface Locals {
  session: {
    id: string;
    familyId: string;
    memberId: string;        // was: userId
    memberRole: 'admin' | 'member';  // was: userRole: 'parent' | 'kid'
    expiresAt: string;
    createdAt: string;
    user: {
      id: string;
      displayName: string;
      avatarEmoji: string;   // no longer optional — all members have emoji
      familyId: string;
    };
  } | null;
}
```

### `src/lib/server/auth.ts` — `SessionPayload`

```ts
export interface SessionPayload {
  familyId: string;
  memberId: string;          // was: userId
  memberRole: 'admin' | 'member';  // was: userRole: 'parent' | 'kid'
}
```

---

## Seed Data (`src/lib/server/db/seed.ts`)

Updated seed structure:

```
Family: "The Smiths" (familyId)
  ├── member: "Parent" — role admin, email: parent@example.com, password: password123
  ├── member: "Emma"   — role member, pin: 1234 (avatarEmoji: 👧)
  └── member: "Jake"   — role member, pin: 5678 (avatarEmoji: 👦)
```

Tables populated in order: `families` → `members` (×3) → `family_members` (×3) → `chores` → `prizes`.
