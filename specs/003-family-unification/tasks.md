# Tasks: Family Unification

**Feature**: `003-family-unification`  
**Input**: `specs/003-family-unification/` — plan.md, spec.md, data-model.md, research.md, contracts/form-actions.md  
**Total tasks**: 36 | **Phases**: 8

> **Phase-to-plan mapping**: Phase ordering here follows user-story priority, not the 6-phase structure in `plan.md`. Key differences: plan Phase 3 (Admin Family) → tasks Phase 4; plan Phase 4 (Layout & Switcher) → tasks Phase 7; plan Phase 6 (Tests) → tasks Phase 8. Authentication (plan Phase 2) is elevated to tasks Phase 3 (Priority P1).

---

## Phase 1: Setup — Schema & Migration

**Purpose**: Update the Drizzle schema and generate + apply the SQL migration before any app code changes.

**⚠️ CRITICAL**: All subsequent phases depend on this migration being applied.

- [X] T001 Update `src/lib/server/db/schema.ts` — remove `parents` and `kids` tables; add `members` table (`id`, `display_name` unique, `avatar_emoji` default `'👤'`, `email` unique nullable, `password_hash` nullable, `pin` nullable, `is_active`, `created_at`) and `familyMembers` join table (`member_id`, `family_id`, `role 'admin'|'member'`, `joined_at`, composite PK); update `sessions` columns (`user_id`→`member_id` FK→members, `user_role 'parent'|'kid'`→`member_role 'admin'|'member'`); update `chores.assignedKidId`→`assignedMemberId` FK→members; update `choreCompletions.kidId`→`memberId` FK→members + rename unique index; update `prizeRedemptions.kidId`→`memberId` FK→members
- [X] T002 Run `npx drizzle-kit generate` from repo root and verify it produces `drizzle/0001_*.sql`
- [X] T003 Hand-edit the generated migration SQL file `drizzle/0001_*.sql` to insert data-migration steps between table creation and table drops: (A) `INSERT INTO members SELECT` from `parents` (avatar_emoji=`'👤'`, pin=NULL); (B) `INSERT INTO family_members SELECT id, family_id, 'admin', created_at FROM parents`; (C) `INSERT INTO members SELECT` from `kids` (email=NULL, password_hash=NULL); (D) `INSERT INTO family_members SELECT id, family_id, 'member', created_at FROM kids`; (E) `DROP TABLE sessions` then `CREATE TABLE sessions` with new columns; (F) `UPDATE chore_completions SET member_id = kid_id` after adding column; (G) `UPDATE prize_redemptions SET member_id = kid_id` after adding column; (H) `DROP TABLE parents; DROP TABLE kids` at end
- [X] T004 Run `npm run db:migrate` and confirm migration applies cleanly; run `npm run dev` briefly to confirm the app boots without crash

**Checkpoint**: Migration applied, app starts.

---

## Phase 2: Foundational — Auth & Session Layer

**Purpose**: Core types and auth helpers that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Update `src/app.d.ts` — change session shape: `userId: string` → `memberId: string`; `userRole: 'parent' | 'kid'` → `memberRole: 'admin' | 'member'`; make `user.avatarEmoji: string` (remove `?`)
- [X] T006 [P] Update `src/lib/server/auth.ts` — change `SessionPayload` interface (`userId`→`memberId`, `userRole`→`memberRole`, enum `'parent'|'kid'`→`'admin'|'member'`); update `createSession` to write new column names; update `validateSession` return to use new shape; remove `getParentById` and `getKidById`; add `getMemberById(id: string)` querying `members` table; add `getMemberByEmail(email: string)` querying `members` by email (for admin login); add `getMemberByDisplayName(displayName: string)` querying `members` by display_name (for member login); add `getMemberFamilyId(memberId: string)` querying `family_members` for the member's `family_id`
- [X] T007 [P] Update `src/hooks.server.ts` — import `getMemberById` only (remove `getParentById`/`getKidById`); resolve user from `session.memberId`; build `event.locals.session` with `memberId`, `memberRole`, and `user.avatarEmoji` as required string; update all `session.userId`→`session.memberId` and `session.userRole`→`session.memberRole` references
- [X] T008 Update `src/routes/(app)/+layout.server.ts` — import `members`, `familyMembers` (not `kids`); query active members via `inner join family_members` on `eq(familyMembers.familyId, fid)` joined with `members`; rename all `kids`/`kidsWithBalances`/`activeKids` variables to `members`/`membersWithBalances`/`activeMembers`; rename output key `kids`→`members`, `activeKidId`→`activeMemberId`; change URL param read from `url.searchParams.get('kid')` to `url.searchParams.get('member')`; change role check from `session.userRole === 'kid'` to `session.memberRole === 'member'`; use `session.memberId` instead of `session.userId`
- [X] T009 Update `src/routes/(app)/+layout.svelte` — rename all `kids`/`activeKidId` props to `members`/`activeMemberId`; pass renamed props to `<Header>`

**Checkpoint**: App boots with new session shape; layout data provides `members`/`activeMemberId`.

---

## Phase 3: User Story 4 — Authentication (Priority: P1)

**Goal**: All family members can authenticate — admin via email+password, member via display name+PIN.

**Independent Test**: Navigate to `/login`; log in as admin with `parent@example.com` / `password123` → lands on `/admin/chores`; log in as member with display name `Emma` + PIN `1234` → lands on `/chores`. Both sessions validate in `locals.session`.

**Write tests first (Constitution Principle IV):**

- [ ] T035 [US4] Write integration tests covering both authentication paths before implementing T010–T013: (A) admin login with valid email+password creates session with `memberRole: 'admin'` and correct `memberId`; (B) member login with valid display name+PIN creates session with `memberRole: 'member'`; (C) incorrect credentials for either path return a clear error and create no session; (D) `getMemberFamilyId` resolves the correct `familyId` for a given `memberId`; seed helpers must insert into `members` + `family_members` tables (not `parents`/`kids`)

- [X] T010 [US4] Update `src/routes/(auth)/login/+page.server.ts` — change admin path: query `members` table by `email` (not `parents`), verify `password_hash`, create session with `memberId`/`memberRole:'admin'`; resolve `familyId` by calling `getMemberFamilyId`; change member path: query `members` by `displayName` (not `kids` by family code + PIN check), verify `pin`, resolve `familyId` via `getMemberFamilyId`; update `load` redirect check to `session.memberRole === 'admin'`; remove `families` table scan for family code lookup
- [X] T011 [US4] Update `src/routes/(auth)/login/+page.svelte` — change role toggle labels from `👑 Parent` / `🧒 Kid` to `👑 Admin` / `👤 Member`; replace `role === 'kid'` checks with `role === 'member'`; in the member branch replace the `familyCode` input field with a `displayName` text input (label: "Your name", required, `autocomplete="name"`); remove the "Found in parent Settings page" hint; keep the PIN input unchanged; update hidden `<input name="role">` default from `'parent'` to `'admin'`
- [X] T012 [P] [US4] Update `src/routes/(auth)/signup/+page.server.ts` — after creating `families` row, insert into `members` (not `parents`) with `email`, `passwordHash`, `displayName`, `avatarEmoji` (read from `avatarEmoji` form field, defaulting to `'👤'` if blank), `isActive: true`; then insert into `family_members` (`memberId`, `familyId`, `role: 'admin'`, `joinedAt`); create session using `memberId` / `memberRole: 'admin'`; update redirect to use `memberRole`
- [X] T013 [P] [US4] Update `src/routes/(auth)/signup/+page.svelte` — add an avatar emoji text input field (label: "Your emoji avatar", `name="avatarEmoji"`, placeholder `'👤'`) to the signup form so the first admin can set their own emoji; confirm no `parent`/`kid` hardcoded role text is visible to users; "Create a family account" wording is otherwise fine

---

## Phase 4: User Story 1 — Admin Family Management (Priority: P1)

**Goal**: Admin visits `/admin/family` and can view, add, edit, and deactivate all family members (any role).

**Independent Test**: Log in as admin → navigate to `/admin/family` → see all members listed with name, emoji, role badge, active status → add a new member-role user → edit their display name → deactivate them. Navigate to `/admin/kids` and confirm redirect to `/admin/family`.

**Write tests first (Constitution Principle IV):**

- [X] T028 Rename `tests/integration/admin-kids.test.ts` → `tests/integration/admin-family.test.ts`; update all imports (`../../src/routes/(app)/admin/kids/+page.server.js` → `admin/family`); replace `seedFamily()` to insert into `members` + `family_members` instead of `parents` + `kids`; update `parentSession()` helper to use `memberRole: 'admin'` and `memberId`; update all action/load test cases for new route and new field names (`displayName`, `avatarEmoji`, `role`, `pin`/`email`)

- [X] T014 [US1] Create `src/routes/(app)/admin/family/+page.server.ts` — `load`: query all members in the family via `inner join family_members` where `familyId = session.familyId`; include coin balance (sum completions − sum redemptions per member); return `members` array with `{id, displayName, avatarEmoji, role, isActive, coinBalance}`; guard: `session.memberRole !== 'admin'` → `error(403)`; `create` action: validate `displayName` (required, globally unique in `members`), `avatarEmoji`, `role`; if `role='admin'` validate email + password (min 8 chars); if `role='member'` validate PIN (4–6 digits, unique within family); insert `members` then `family_members`; `update` action: validate same fields; enforce last-admin lockout — if demoting to `member` and this is the only active `admin` in `family_members` for this family → `fail(400, { error: 'Cannot demote the last admin.' })`; update `members` and `family_members.role`; `deactivate` action: check last-admin lockout same way; set `members.is_active = false`
- [X] T015 [US1] Create `src/routes/(app)/admin/family/+page.svelte` — list all members (both active and inactive) with name, avatar emoji, role badge (`Admin` or `Member` in Skeleton `badge preset-filled-*` style), active/inactive status chip; "Add member" section with form fields: display name, emoji, role toggle (`Admin`/`Member`), conditional email + password fields (role=admin) or PIN field (role=member); inline edit form per row for name, emoji, role, credentials; deactivate button per row (disabled if last admin); use Skeleton `card`, `input`, `btn`, `badge` components; form actions use `use:enhance`
- [X] T016 [P] [US1] Replace `src/routes/(app)/admin/kids/+page.server.ts` with redirect shim: `import { redirect } from '@sveltejs/kit'; export const load = () => redirect(301, '/admin/family');` — remove the old load and actions entirely; also remove or empty `src/routes/(app)/admin/kids/+page.svelte` so SvelteKit uses only the load redirect
- [X] T017 [P] [US1] Update all internal navigation references from `/admin/kids` to `/admin/family` in: `src/lib/components/NavTabs.svelte` (if nav link exists), `src/routes/(app)/+layout.svelte` (any hardcoded links), and any other `.svelte` files found by searching for `/admin/kids`; also audit and update `src/routes/(app)/admin/settings/+page.server.ts` and `src/routes/+page.server.ts` — replace `session.userRole`→`session.memberRole` and `session.userId`→`session.memberId` in both files

---

## Phase 5: User Story 2 — Chore Assignment (Priority: P1)

**Goal**: Admin can assign a chore to any active member (any role); chores appear on the assigned member's chore page.

**Independent Test**: Create a chore assigned to an admin-role member → log in as that member → navigate to `/chores` → confirm the chore appears.

**Write tests first (Constitution Principle IV):**

- [X] T029 [P] Update `tests/integration/chore-completion.test.ts` — update `seedFamily()` helper to insert `members` + `family_members`; replace `kids.insert` with `members.insert`; rename `kidId` variables to `memberId`; update chore completion inserts to use `memberId` column

- [X] T018 [US2] Update `src/routes/(app)/admin/chores/+page.server.ts` — replace `kids` import and queries with `members`+`familyMembers`; load `activeMembers` via join `eq(familyMembers.familyId, session.familyId)` + `eq(members.isActive, true)`; rename `kidMap`→`memberMap`, `activeKids`→`activeMembers`, `assignedKid`→`assignedMember`; rename form field from `assignedKidId` to `assignedMemberId`; update all `session.userRole !== 'parent'` checks to `session.memberRole !== 'admin'`; return `{ chores: choresWithMember, members: activeMembers }`
- [X] T019 [P] [US2] Update `src/routes/(app)/admin/chores/+page.svelte` — rename `kids` prop to `members`; rename `assignedKid` to `assignedMember`; update `<select name="assignedKidId">` to `<select name="assignedMemberId">`; update option labels (was "Unassigned / all kids" → "Unassigned – applies to all")
- [X] T020 [P] [US2] Update `src/routes/(app)/chores/+page.server.ts` — change URL param from `url.searchParams.get('kid')` to `url.searchParams.get('member')`; rename variable `activeKidId`→`activeMemberId`; update query to use `chores.assignedMemberId`; update role check `session.userRole === 'kid'` → `session.memberRole === 'member'`; use `session.memberId`

---

## Phase 6: User Story 3 — Coins & Prizes for All Members (Priority: P2)

**Goal**: All active family members appear on the leaderboard, can earn coins, and can redeem prizes.

**Independent Test**: Log in as admin-role member → complete a chore → verify coin balance increases → redeem a prize → verify balance decreases → open leaderboard → confirm admin-role member appears ranked.

**Write tests first (Constitution Principle IV):**

- [X] T030 [P] Update `tests/integration/leaderboard.test.ts` — update seed helpers to use `members`/`family_members`; rename `kidId`→`memberId` in all queries and assertions
- [X] T031 [P] Update `tests/integration/prize-redemption.test.ts` — update seed helper; rename `kidId`→`memberId` in `prizeRedemptions` insert and assertions

- [X] T021 [P] [US3] Update `src/routes/(app)/leaderboard/+page.server.ts` — load all active members of the family via `inner join family_members`; compute coin balances from `choreCompletions` and `prizeRedemptions` using `memberId`; return members ranked by coins earned in current period; update any `kid`/`kidId` variable names to `member`/`memberId`
- [X] T022 [P] [US3] Update `src/routes/(app)/prizes/+page.server.ts` — query `prizeRedemptions` by `memberId` (not `kidId`); use `session.memberId` for all queries; update role check `session.userRole` → `session.memberRole`
- [X] T023 [P] [US3] Update `src/routes/(app)/admin/activity/+page.server.ts` — join `choreCompletions` and `prizeRedemptions` with `members` table (not `kids`); rename `kid_id` column references and JS variables to `member_id`/`memberId`; update role guard `session.userRole !== 'parent'` → `session.memberRole !== 'admin'`

---

## Phase 7: User Story 5 — Header Member Switcher (Priority: P2)

**Goal**: The app header shows all active members; ≤5 = pill buttons, ≥6 = dropdown, ≤1 = hidden.

**Independent Test**: Seed 3 members → verify header shows pill buttons with active member filled; seed 6 members → verify dropdown appears with active member selected; seed 1 member → verify no switcher rendered.

**Write tests first (Constitution Principle IV):**

- [ ] T036 [US5] Write integration or e2e tests for `MemberSwitcher` before implementing T024–T026: (A) family with ≤5 active members → header renders pill `<a>` buttons, active member carries the filled/active class, no `<select>` present; (B) family with ≥6 active members → header renders `<select>` dropdown with active member pre-selected as the default option; (C) family with exactly 1 active member → no switcher element is rendered; seed test data via `members` + `family_members` helpers

- [X] T024 [US5] Create `src/lib/components/MemberSwitcher.svelte` — props: `members: Array<{id: string; displayName: string; avatarEmoji: string; coinBalance: number}>`, `activeMemberId: string | null`; if `members.length <= 1` render nothing; helper `memberUrl(memberId)` builds URL with `?member=<id>` param (copy pattern from old KidSwitcher but rename param); if `members.length <= 5` render `<nav>` with pill `<a>` buttons using Skeleton `btn btn-lg rounded-full` + `preset-filled-primary-500` for active / `preset-outlined-primary-500` for inactive, each showing emoji + displayName + `aria-current`; if `members.length >= 6` render a `<select>` with `<option>` per member (value = full URL with `?member=<id>`), pre-selected to active member's URL, on `change` use `goto(event.currentTarget.value)` from `$app/navigation`; wrap in `<nav aria-label="Switch member">`
- [X] T025 [US5] Update `src/lib/components/Header.svelte` — replace `import KidSwitcher` with `import MemberSwitcher from './MemberSwitcher.svelte'`; rename prop `kids` → `members`, `activeKidId` → `activeMemberId`; replace `<KidSwitcher {kids} {activeKidId} />` with `<MemberSwitcher {members} {activeMemberId} />`; update `interface Props` accordingly; change role check `user.role === 'parent'` → `user.role === 'admin'` in the manage link conditional
- [X] T026 [P] [US5] Delete `src/lib/components/KidSwitcher.svelte` (file is fully replaced by MemberSwitcher)

---

## Phase 8: Polish & Quality Gate

**Purpose**: Updated seed data, export endpoint, e2e test review, and final quality run. Integration and e2e test tasks (T028–T031, T035–T036) have been moved before their respective implementation phases per Constitution Principle IV.

- [X] T027 Update `src/lib/server/db/seed.ts` — delete from `family_members`, `members` (in dependency order) before `families`; insert one admin member (`Parent`, email: `parent@example.com`, password: `password123`, avatarEmoji: `'👤'`) + one `family_members` row (`role: 'admin'`); insert two member-role members (`Emma` PIN `1234`, `Jake` PIN `5678`) + their `family_members` rows (`role: 'member'`); update chore `assignedMemberId` references to use Emma/Jake member IDs; update seed completion log to print display names and PINs (remove family code print)
- [ ] T032 [P] Review all `tests/e2e/*.test.ts` files for hardcoded `/admin/kids` URLs → replace with `/admin/family`; search for `'parent'|'kid'` role string literals → update to `'admin'|'member'`; search for `?kid=` URL param → update to `?member=`; update any test login helpers that use family code → use display name instead; add a full chore-earn-redeem cycle e2e test (SC-6): log in as an admin-role member → complete a chore → verify coin balance increases → redeem a prize → verify balance decreases → confirm the member appears on the leaderboard
- [X] T033 [P] Update `src/routes/api/export/+server.ts` — replace any queries against `parents` or `kids` tables with equivalent queries against `members` joined with `family_members`; rename `kid_id`→`member_id` column references; update role checks from `session.userRole`/`session.userId` to `session.memberRole`/`session.memberId`; confirm exported data shape covers all active member types
- [X] T034 Run `npm test` and confirm zero failures; run `npm run lint` and fix any TypeScript errors arising from the migration (stale `parents`/`kids` references in any missed files)

---

## Dependencies (User Story Completion Order)

```
Phase 1 (Schema + Migration)
    └─► Phase 2 (Foundational: auth.ts, hooks, layout)
            ├─► Phase 3 (US4 — Auth) ── can be done alongside US1
            ├─► Phase 4 (US1 — Admin Family Page)
            ├─► Phase 5 (US2 — Chore Assignment) ── requires T018 before T019/T020
            ├─► Phase 6 (US3 — Coins & Prizes) ── T021/T022/T023 are fully parallel
            └─► Phase 7 (US5 — Member Switcher) ── T024 before T025; T026 parallel with T025
Phase 8 (Polish) ── runs after all user story phases complete
```

## Parallel Execution Examples

### Within Phase 3 (US4)
T010 and T012 can be done simultaneously (different files).  
T011 and T013 can be done simultaneously after their server counterparts.

### Within Phase 4 (US1)
T028 (write tests first) can be done in parallel with T016/T017 (independent files). T014 and T015 implementation follows after T028 is complete.

### Within Phase 6 (US3)
T021, T022, T023 are fully independent — all three in parallel.

### Within Phase 8 (Polish)
T032 and T033 can be done in parallel (independent files).

---

## Implementation Strategy

**MVP (minimum shippable increment)**: Complete Phases 1–3 (US4) to unlock login for all members. Then Phase 4 (US1) for admin control. US2, US3, US5 add participation and UX polish.

**Suggested delivery order**:
1. Phases 1–2 (foundation) → app runs with new schema
2. Phase 3 (US4) → all users can authenticate
3. Phase 4 (US1) → admin can manage members
4. Phase 5 (US2) → chores work for all members
5. Phases 6–7 (US3, US5) → full participation + header switcher
6. Phase 8 → tests green, ship

**Format validation**: All 36 tasks use `- [ ] T### [P?] [US#?] description with file path` format. ✅
