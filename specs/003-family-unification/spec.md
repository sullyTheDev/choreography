# Feature Specification: Family Unification

**Feature Branch**: `003-family-unification`
**Created**: 2026-04-13
**Status**: Draft

## Overview

Move away from separate “parent” and “kid” concepts into a single unified **member** model. Every person — regardless of age or role — is a first-class user who can be assigned chores, earn coins, and redeem prizes. Administrative capability is governed by a **role** (`admin` vs `member`), not by which table a person lives in.

The schema introduces a **many-to-many** relationship between members and families (via a `family_members` join table), allowing a member to belong to multiple families in future. For this feature, the application UX continues to operate within a single active family context; multi-family switching is deferred.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Admin manages all family members in one place (Priority: P1)

An admin user visits `/admin/family` and sees every person in the household — both admin-level and member-level accounts — in a single list. They can add new members, edit existing ones, deactivate accounts, and promote or demote roles, all without navigating between two separate screens.

**Why this priority**: This delivers the structural change that unlocks everything else. Without a unified member list the admin workflow is split and confusing.

**Independent Test**: Can be fully tested by logging in as an admin, navigating to `/admin/family`, verifying that all previously-separate parent and kid accounts appear in one list, and confirming that CRUD operations (add / edit / deactivate) work for both roles.

**Acceptance Scenarios**:

1. **Given** an admin is on `/admin/family`, **When** the page loads, **Then** all family members (both admin and member roles) are displayed in a single list with their name, avatar emoji, role badge, and active status.
2. **Given** an admin clicks "Add member", **When** they fill in name, emoji, role, and auth details, **Then** the new member appears in the list and can log in immediately.
3. **Given** an admin edits a member's role from `member` to `admin`, **When** they save, **Then** that user gains admin capabilities on their next page load.
4. **Given** an admin deactivates a member, **When** they save, **Then** the member cannot log in and is hidden from active-user views.
5. **Given** a request to the old URL `/admin/kids`, **When** the page is loaded, **Then** the user is redirected to `/admin/family`.

---

### User Story 2 — Any family member can be assigned a chore (Priority: P1)

When creating or editing a chore, an admin can assign it to any active family member regardless of their role. Admin-role members appear alongside member-role members in the assignee dropdown.

**Why this priority**: Core to the "whole family" vision — admin users should be able to participate in chores too.

**Independent Test**: Can be fully tested by creating a chore assigned to an admin-role user and confirming it appears on their chores page.

**Acceptance Scenarios**:

1. **Given** an admin is creating or editing a chore, **When** they open the assignee picker, **Then** all active family members (both roles) are listed.
2. **Given** a chore is assigned to an admin user, **When** that user views their chores page, **Then** the chore appears and can be marked complete.
3. **Given** a chore is unassigned (applies to all), **When** any logged-in family member views the chores page, **Then** the chore appears for them.

---

### User Story 3 — Any family member earns coins and can redeem prizes (Priority: P2)

Coin balances, leaderboard rankings, and prize redemption are available to every family member. Admin users see their own balance and can redeem prizes just like member users.

**Why this priority**: Completes the participation model — without this, admin users are second-class participants.

**Independent Test**: Can be fully tested by completing a chore as an admin user, verifying a coin balance increase, and successfully redeeming a prize.

**Acceptance Scenarios**:

1. **Given** an admin user completes a chore, **When** the completion is recorded, **Then** coins are added to their balance.
2. **Given** an admin user has sufficient coins, **When** they redeem a prize, **Then** the redemption is recorded and their balance decreases.
3. **Given** the leaderboard page is viewed, **When** it loads, **Then** all family members (both roles) appear ranked by coins earned in the current period.

---

### User Story 4 — Authentication works consistently for all member types (Priority: P1)

All family members authenticate through a single login flow. Admin-role users log in with **email + password**. Member-role users log in with their **display name + PIN** (existing kid auth model). Both end up with a valid session and see the appropriate UI.

**Why this priority**: Blocks everything — users cannot participate if they cannot log in.

**Independent Test**: Can be fully tested independently by verifying both login paths reach the chores page with correct session data.

**Acceptance Scenarios**:

1. **Given** a member with role `admin` and a registered email, **When** they submit email + password on the login page, **Then** they receive a session and land on the chores page with admin nav visible.
2. **Given** a member with role `member` and a PIN, **When** they enter their display name and submit their PIN on the login page, **Then** they receive a session and land on the chores page.
3. **Given** incorrect credentials for either login path, **When** submitted, **Then** a clear error is shown and no session is created.

---

### User Story 5 — Header member switcher shows all family members (Priority: P2)

The member switcher in the app header lists every active family member — regardless of role — so any logged-in user can switch the active view context. The currently selected member is visually highlighted. When the family has 5 or fewer members the switcher renders as a row of pill buttons; when there are 6 or more it collapses into a dropdown to avoid crowding the header.

**Why this priority**: Unlocks the unified participation model in the UI — without this, admin-role members cannot be selected as the active context for viewing chores/prizes/leaderboard.

**Independent Test**: Can be fully tested by seeding a family with 3 members (pill mode) and 6 members (dropdown mode) and verifying switcher renders correctly in both cases, with the active member highlighted.

**Acceptance Scenarios**:

1. **Given** a family has ≤5 active members, **When** the header loads, **Then** all members are shown as individual pill buttons with the currently active member visually highlighted.
2. **Given** a family has ≥6 active members, **When** the header loads, **Then** a dropdown selector is shown with the currently active member as the selected value.
3. **Given** any member pill or dropdown option is selected, **When** the user clicks/selects it, **Then** the active member context switches and the page reflects that member's data.
4. **Given** the logged-in user's own entry appears in the switcher, **When** the page loads, **Then** their entry is shown in the highlighted/active state if they are the current active context.
5. **Given** a family has exactly 1 active member, **When** the header loads, **Then** no switcher is rendered (single-member families need no switching UI).

---

## Functional Requirements

### Data Model

1. The `parents` and `kids` tables MUST be consolidated into a single `members` table.
2. The `members` table MUST include:
   - `id`, `display_name`, `avatar_emoji`, `is_active`, `created_at`
   - `email` and `password_hash` — nullable, populated for `admin` role users; `email` MUST be globally unique across all `members`
   - `pin` — nullable, populated for `member` role users; `display_name` MUST be globally unique across all `members`
   - Note: `family_id` is **not** a direct column; family association is via the join table.
3. A `family_members` join table MUST be introduced to model the many-to-many relationship between `members` and `families`. It MUST include: `member_id`, `family_id`, `role` (`admin` | `member` scoped per family), and `joined_at`.
4. All foreign keys that currently reference `kids.id` (chores, completions) and `parents.id` (sessions) MUST be updated to reference `members.id`.
5. Chore and completion rows remain scoped to a `family_id` directly; the active family context for a session is resolved via the `family_members` join table.
6. Existing data MUST be migrated via a **Drizzle migration script**: all rows in `parents` become `members` entries plus a `family_members` join row with `role = 'admin'`; all rows in `kids` become `members` entries plus a `family_members` join row with `role = 'member'`. The migration MUST be idempotent and run automatically on startup alongside all other Drizzle schema migrations.

### Routing

7. The admin page `/admin/kids` MUST be renamed to `/admin/family`.
8. A redirect MUST be in place from `/admin/kids` to `/admin/family` to preserve bookmarks.
9. All internal links that reference `/admin/kids` MUST be updated to `/admin/family`.

### Admin Family Management UI

10. The `/admin/family` page MUST display all family members (both roles) in a single list.
11. Each member row MUST show: display name, avatar emoji, role badge, active status, and current coin balance.
12. Admins MUST be able to add new members of either role, specifying the member's display name, avatar emoji, role, and role-appropriate credentials (email + password for `admin`-role; PIN for `member`-role).
13. Admins MUST be able to edit any member's display name, emoji, role, and auth credentials.
14. Admins MUST be able to deactivate (soft-delete) any member, unless doing so would leave a family with zero active admins.
15. The system MUST prevent removing or deactivating the last active admin **within a given family** to avoid lockout (enforcement is per-family, not global).
- **PIN uniqueness (per-family)**: Within a given family, each `member`-role user's PIN MUST be unique; the system MUST reject a new or updated PIN that is already in use by another active member of the same family.

### Chore Assignment

16. The chore assignee picker MUST list all active `family_members` regardless of role.
17. Chore completion MUST be recordable by any `family_member`.

### Coins & Prizes

18. Coin balance tracking MUST apply to all `family_members`.
19. Prize redemption MUST be available to all `family_members`.
20. The leaderboard MUST aggregate and display all `family_members`.

### Session & Auth

21. Sessions MUST store `member_id` (replacing the separate `parent_id` / `kid_id` session fields).
22. The login page MUST support both auth flows (email+password for admins, name+PIN for members) within a single UX.

### Header Member Switcher

23. The header MUST display a member switcher showing **all active members** of the current family, including the logged-in user.
24. When the family has **5 or fewer** active members, the switcher MUST render as a row of pill buttons.
25. When the family has **6 or more** active members, the switcher MUST render as a dropdown (select/combobox).
26. The **currently active member** MUST be visually highlighted (filled/active state) in both pill and dropdown modes.
27. Selecting a different member in the switcher MUST update the active member context for the current session (chores, prizes, leaderboard reflect the selected member).
28. If the family has exactly **1** active member, the switcher MUST NOT be rendered.

---

## Clarifications

### Session 2026-04-13

- Q: Should many-to-many member↔family be fully implemented now or schema-only with UX deferred? → A: Schema supports many-to-many (join table) now; multi-family UX (switching, scoped views) is deferred to a later feature.
- Q: If a person joins a second family, same account or new account? → A: One account per person globally; joining a second family adds a row to the `family_members` join table (email and display name are unique on `members`).
- Q: Display name globally unique or per-family for member-role login? → A: Globally unique for now — simpler login flow, no family picker step needed; revisit when multi-family UX is built.
- Q: Last-admin lockout scope — per family or global? → A: Per family — cannot remove the last admin-role entry in `family_members` for a given family.
- Q: How should the data migration from parents/kids to members run? → A: Always via Drizzle migration scripts — automatic, ships with the schema change, no manual steps required.
- Q: Should the header member switcher show the logged-in user's own entry? → A: Yes — all active members shown including self; the active context entry is highlighted.

---

## Assumptions

- **Global member identity**: `email` (for admin-role) and `display_name` (for member-role) are unique across the entire `members` table, not scoped per family. A person has one account; family membership is tracked via `family_members` join rows.
- **PIN-only members**: Member-role users do not need an email address. Email remains optional and used only for password recovery in a future feature.
- **No email for members**: Member-role users will not gain email/password login in this feature — that is deferred.
- **Coin balance storage**: Currently coins are derived from completions aggregates; no separate balance table exists. This feature does not change that calculation approach.
- **No profile photos**: Avatar is emoji only, consistent with the existing model.
- **Sessions table**: The existing `sessions` table links to `parent_id`; this will be migrated to `member_id` as part of this feature.
- **Migration approach**: All schema and data changes MUST use Drizzle migration scripts. No manual upgrade steps or external scripts are acceptable for this feature.
- **Single active family context**: Even though the schema supports many-to-many, sessions in this feature are scoped to one family. The active family is resolved from the `family_members` join table (a member’s first/only family for existing migrated data).
- **Table naming**: The unified people table is named `members`. The join table bridging people to families is named `family_members`.
- **Admin emoji at signup**: The signup form MUST include an optional emoji field for the first admin member of a new family. If left blank, the system defaults to `'👤'`.
- **API export compatibility**: The `/api/export` endpoint must be updated to reflect the `members`/`family_members` schema. No new export format is introduced; the exported data shape is preserved for all active member types.

---

## Success Criteria

1. An admin user can perform all CRUD operations on family members from `/admin/family` without visiting any other page.
2. Every active family member (any role) appears in the chore assignee picker, leaderboard, and prize shop without exception.
3. Both authentication paths (email+password and name+PIN) succeed and produce valid sessions in under 3 seconds.
4. The old `/admin/kids` URL automatically redirects to `/admin/family` — no broken links.
5. All existing automated tests continue to pass after the migration, demonstrating no regression in core workflows.
6. A family with mixed admin and member accounts can complete a full chore-earn-redeem cycle with no role-based blockers.
7. The header member switcher renders as pills for ≤5 members and as a dropdown for ≥6 members, with the active member always highlighted.

---

## Key Entities

| Entity | Notes |
|--------|-------|
| `members` | Unified table replacing `parents` + `kids`; no direct `family_id` column |
| `family_members` | New join table; many-to-many between `members` and `families`; carries per-family `role` |
| `families` | Unchanged |
| `chores` | `assigned_kid_id` FK renamed to `assigned_member_id`, references `members` |
| `chore_completions` | `kid_id` FK renamed to `member_id`, references `members` |
| `sessions` | `user_id` FK renamed to `member_id`, references `members` |

---

## Out of Scope

- Email/password login for member-role users (deferred)
- Password reset / "forgot password" flow (deferred)
- Granular permission levels beyond `admin` / `member` (deferred)
- Public registration — member creation remains admin-only
- Multi-family UX: family switcher, per-family context selection, cross-family leaderboards (deferred — schema supports it, UX is a separate feature)
