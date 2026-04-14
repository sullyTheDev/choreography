# Research: Family Unification

**Feature**: `003-family-unification`  
**Phase**: 0 — Codebase Analysis & Decision Capture  
**Date**: 2026-04-13

No external unknowns. All technologies are established and already in use. This document captures decisions made from codebase archaeology.

---

## 1. Current Schema Summary

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `families` | A household unit | `id`, `name`, `leaderboard_reset_day` |
| `parents` | Admin-role users | `id`, `family_id` (FK), `email` (unique), `password_hash`, `display_name` |
| `kids` | Member-role users | `id`, `family_id` (FK), `display_name`, `avatar_emoji`, `pin`, `is_active` |
| `sessions` | Auth sessions | `id`, `family_id`, `user_id` (→ parent or kid), `user_role ('parent'\|'kid')` |
| `chores` | Chore definitions | `assigned_kid_id` (nullable FK → kids) |
| `chore_completions` | Completion log | `kid_id` (FK → kids) |
| `prize_redemptions` | Redemptions | `kid_id` (FK → kids) |
| `prizes` | Prize definitions | family-scoped only |

**Notable**: `kids` has `avatar_emoji` but `parents` does **not**. After unification all members have `avatar_emoji` (spec requirement). Currently `parents` also lacks `is_active`.

---

## 2. Decisions

### D-01: Unified `members` table replaces `parents` + `kids`

- **Decision**: Single `members` table with `email`, `password_hash`, `pin`, `avatar_emoji`, and `is_active` columns (all nullable where role doesn't require them).
- **Rationale**: Spec requirement; eliminates the need to query two tables for a person.
- **Alternatives considered**: Keeping both tables with a polymorphic FK — rejected because it complicates every query and the spec explicitly mandates unification.
- **Key constraint**: `display_name` globally unique across all members (simpler PIN-based login, no family picker step needed in this feature).
- **Key constraint**: `email` globally unique across all members.

### D-02: `family_members` join table carries per-family role

- **Decision**: `family_members(member_id, family_id, role, joined_at)` with composite primary key `(member_id, family_id)`.
- **Rationale**: Spec requires many-to-many schema now; multi-family UX deferred. Role is per-family since a person could theoretically be an admin in one family and a member in another.
- **Alternatives considered**: Role column directly on `members` — rejected because it can't support per-family role differences.

### D-03: Sessions table migrated — `user_id`/`user_role` → `member_id`/`member_role`

- **Decision**: Rename `user_id` to `member_id` (with new FK constraint to `members`), rename `user_role` column and change enum from `'parent'|'kid'` to `'admin'|'member'`.
- **Rationale**: Align naming with new `members` table; keep the `sessions` table FK-safe.
- **Migration approach**: Drop all existing sessions so no live sessions reference stale `user_id` values. (This is a dev/family tool — forced re-login on migration is acceptable.)

### D-04: Member login flow changes to `display_name + PIN` (no family code)

- **Decision**: Member-role login uses `display_name` (globally unique) + PIN directly against `members` table. The family code step is eliminated.
- **Rationale**: `display_name` is globally unique (D-01), so no family disambiguation needed. Simpler UX.
- **Alternatives considered**: Keep family code + PIN — rejected since the family code was only needed when names weren't globally scoped.
- **Admin login**: Unchanged — `email + password`.

### D-05: `KidSwitcher` renamed and redesigned → `MemberSwitcher`

- **Decision**: New component `MemberSwitcher.svelte` replaces `KidSwitcher.svelte`.
  - `≤5` active members → row of pill buttons (same pattern as current, using `preset-filled-primary-500` for active)
  - `≥6` active members → `<select>` dropdown; on `change` the selection navigates to `?member=<id>` URL param
  - `≤1` active member → nothing rendered
- **Rationale**: Spec requirements 21–26; pill pattern already proven in existing `KidSwitcher.svelte`; native `<select>` is simplest Skeleton-compatible dropdown for ≥6 case.
- **Alternatives considered**: Skeleton `<Select>` component or a custom popover — rejected because native `<select>` requires zero extra JS, is accessible, and works with form navigation.

### D-06: URL param rename `?kid=` → `?member=`

- **Decision**: Layout server and all link generation switches from `?kid=<id>` to `?member=<id>`.
- **Rationale**: Consistency with new entity names; no backwards compat needed (param is ephemeral).

### D-07: `avatarEmoji` becomes non-optional on all members

- **Decision**: All `members` rows require `avatar_emoji` (not null, defaults to `'👤'` for admin-role members migrated from `parents` who had no emoji).
- **Rationale**: `parents` table had no `avatar_emoji`; unification requires a sensible default for all members.

### D-08: Drizzle migration strategy — additive SQL migration

- **Decision**: New Drizzle SQL migration file (`0001_family_unification.sql`) that:
  1. Creates `members` and `family_members` tables
  2. Copies parent rows → members (email + password_hash, pin = NULL, avatar_emoji = '👤')
  3. Copies kid rows → members (pin set, email = NULL, password_hash = NULL)
  4. Populates `family_members` from old parents (role = 'admin') and kids (role = 'member')
  5. Drops and recreates `sessions` with new columns (`member_id`, `member_role`)
  6. Adds `assigned_member_id` column to `chores`, copies from `assigned_kid_id`, drops old column
  7. Adds `member_id` column to `chore_completions`, copies from `kid_id`, drops old column
  8. Adds `member_id` column to `prize_redemptions`, copies from `kid_id`, drops old column
  9. Drops old `parents` and `kids` tables
- **Rationale**: SQLite does not support `ALTER TABLE ... RENAME COLUMN` in older libsql versions; copying data and dropping columns is the safe fallback. The migration runs automatically via `migrate.ts` on startup.
- **Idempotency**: Drizzle's migrator tracks applied migrations in `__drizzle_migrations`; running twice is safe.

### D-09: `app.d.ts` session type updated

- **Decision**: `userRole: 'parent' | 'kid'` → `memberRole: 'admin' | 'member'`, `userId` → `memberId`. `user.avatarEmoji` becomes required (non-optional).
- **Impact**: Every file that reads `session.userRole` or `session.userId` needs updating.

### D-10: Chore completion uniqueness index

- **Decision**: The unique index `uq_completion_period(chore_id, kid_id, period_key)` is renamed to `uq_completion_period(chore_id, member_id, period_key)` in the new schema. The SQL migration recreates this index.
- **Rationale**: The constraint's logic is identical; only the FK column name changes.

---

## 3. Unchanged Architecture

- **Drizzle ORM + libsql**: No new ORM or driver.
- **Bcrypt hashing**: `bcrypt` for both password and PIN — unchanged. Salt rounds unchanged (12 for password, 10 for PIN).
- **ULID IDs**: All new `members` and `family_members` rows get ULID primary keys.
- **No new npm packages required**: All required utilities already installed.
- **Test framework**: Vitest, in-memory SQLite `testDb` via `tests/integration/setup.ts`.

---

## 4. Files Requiring Changes

### New files
| Path | Purpose |
|------|---------|
| `drizzle/0001_family_unification.sql` | Drizzle migration |
| `src/routes/(app)/admin/family/+page.server.ts` | Renamed admin route (new location) |
| `src/routes/(app)/admin/family/+page.svelte` | Renamed admin route (new location) |
| `src/routes/(app)/admin/kids/+page.server.ts` | Redirect shim → `/admin/family` |
| `src/lib/components/MemberSwitcher.svelte` | Replaces KidSwitcher |
| `specs/003-family-unification/data-model.md` | This plan phase output |

### Modified files
| Path | What changes |
|------|-------------|
| `src/lib/server/db/schema.ts` | Remove parents/kids; add members/family_members; update FKs |
| `src/lib/server/auth.ts` | SessionPayload type, getMemberById, remove getParentById/getKidById |
| `src/hooks.server.ts` | Use getMemberById, update session shape |
| `src/app.d.ts` | Session type: userId→memberId, userRole→memberRole, avatarEmoji non-optional |
| `src/routes/(auth)/login/+page.server.ts` | Member login: display_name+PIN instead of familyCode+PIN |
| `src/routes/(auth)/signup/+page.server.ts` | Parent signup → inserts into members + family_members |
| `src/routes/(app)/+layout.server.ts` | kids→members, activeKidId→activeMemberId, URL param |
| `src/routes/(app)/+layout.svelte` | Props: kids→members, activeKidId→activeMemberId |
| `src/routes/(app)/admin/chores/+page.server.ts` | Chore assignee picker: load members not kids |
| `src/routes/(app)/admin/activity/+page.server.ts` | kidId→memberId in queries |
| `src/routes/(app)/admin/chores/+page.svelte` | Assignee dropdown labels |
| `src/routes/(app)/chores/+page.server.ts` | activeKidId→activeMemberId |
| `src/routes/(app)/leaderboard/+page.server.ts` | kids→members queries |
| `src/routes/(app)/prizes/+page.server.ts` | kidId→memberId |
| `src/lib/components/Header.svelte` | KidSwitcher→MemberSwitcher, kids→members props |
| `src/lib/components/KidSwitcher.svelte` | Deleted (replaced by MemberSwitcher) |
| `src/lib/server/db/seed.ts` | Use new members/family_members schema |
| `src/lib/server/db/utils.ts` | Likely no change needed |
| `src/lib/server/db/index.ts` | No change needed |
| `tests/integration/admin-kids.test.ts` | Updated for new schema / route |
| `tests/integration/chore-completion.test.ts` | kidId→memberId |
| `tests/integration/leaderboard.test.ts` | kids→members |
| `tests/integration/prize-redemption.test.ts` | kidId→memberId |
| All other integration/e2e tests | Review for any parent/kid references |
