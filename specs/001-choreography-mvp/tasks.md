# Tasks: Choreography MVP

**Input**: Design documents from `/specs/001-choreography-mvp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/routes.md, quickstart.md

**Tests**: Tests are included per Constitution Principle IV (Test-First, Correct, Accessible Delivery). Tests MUST be written before implementation for acceptance-critical behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single SvelteKit app**: `src/`, `tests/` at repository root
- Server-only code in `src/lib/server/`
- Routes in `src/routes/`
- Components in `src/lib/components/`
- Drizzle migrations generated into `drizzle/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the SvelteKit project, install dependencies, configure tooling, and create the Docker containerization layer.

- [ ] T001 Initialize SvelteKit project with TypeScript, install core dependencies (svelte, @sveltejs/kit, @sveltejs/adapter-node, drizzle-orm, better-sqlite3, bcrypt, ulid, pino) and dev dependencies (vitest, playwright, @axe-core/playwright, drizzle-kit, @types/better-sqlite3, @types/bcrypt) in package.json
- [ ] T002 [P] Configure TypeScript in tsconfig.json with strict mode and SvelteKit path aliases
- [ ] T003 [P] Configure Vite in vite.config.ts with Vitest integration for unit/integration tests
- [ ] T004 [P] Configure SvelteKit adapter-node in svelte.config.js
- [ ] T005 [P] Configure Drizzle Kit in drizzle.config.ts pointing to src/lib/server/db/schema.ts with SQLite dialect and drizzle/ output directory
- [ ] T006 [P] Create .env.example with DATABASE_URL, SESSION_SECRET, PORT, and LOG_LEVEL variables
- [ ] T007 [P] Create Dockerfile with multi-stage build (node:20-alpine build stage → production stage) per research.md R3
- [ ] T008 [P] Create docker-compose.yml with choreography service, port 3000, volume mount for SQLite data, and environment variables per quickstart.md
- [ ] T009 Create app.html with base HTML template and meta viewport for responsive layout
- [ ] T010 [P] Create Playwright config in playwright.config.ts for E2E tests in tests/e2e/

**Checkpoint**: Project scaffolded. `npm install` succeeds, `npm run dev` starts without errors.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, auth system, logging, global styles, and app shell — all user stories depend on these.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T011 Define Drizzle ORM code-first schema for all entities (Family, Parent, Kid, Chore, ChoreCompletion, Prize, PrizeRedemption, Session) with ULID PKs, foreign keys, check constraints, and indexes in src/lib/server/db/schema.ts per data-model.md
- [ ] T012 Create database connection module using better-sqlite3 driver with Drizzle wrapper, including auto-migration on startup, in src/lib/server/db/index.ts
- [ ] T013 Generate initial Drizzle migration files by running drizzle-kit generate into drizzle/ directory
- [ ] T014 [P] Implement ULID generation helper and date utilities (periodKey computation for daily/weekly) in src/lib/server/db/utils.ts
- [ ] T015 [P] Implement auth helpers: password hashing (bcrypt), PIN hashing, session creation, session validation, session deletion, and cookie management in src/lib/server/auth.ts
- [ ] T016 [P] Implement structured JSON logger using pino in src/lib/server/logger.ts
- [ ] T017 Implement SvelteKit server hooks (hooks.server.ts): session middleware that reads cookie, validates session from DB, and attaches user/family to event.locals; request logging via pino
- [ ] T018 Create global stylesheet in src/app.css with CSS custom properties for the warm beige/cream theme (--color-bg, --color-surface, --color-primary [orange/amber], --color-success [green], --color-text, spacing, border-radius) matching the mockup design language
- [ ] T019 Create app layout shell in src/routes/(app)/+layout.svelte with Header component slot, NavTabs component (Chores / Prize Shop / Leaderboard), and page content area
- [ ] T020 Create app layout server loader in src/routes/(app)/+layout.server.ts that enforces authentication (redirect to /login if no session), loads family data, all active kids with computed coin balances, and resolves activeKidId per contracts/routes.md layout contract
- [ ] T021 [P] Create Header component in src/lib/components/Header.svelte displaying app logo ("Chore·ography"), KidSwitcher, coin balance, and role badge per mockup
- [ ] T022 [P] Create KidSwitcher component in src/lib/components/KidSwitcher.svelte displaying kid avatar tabs with active state highlighting per mockup
- [ ] T023 [P] Create NavTabs component in src/lib/components/NavTabs.svelte with three tabs (Chores, Prize Shop, Leaderboard) and active tab styling per mockup
- [ ] T024 Create signup page with form (email, password, displayName, familyName) and server action to create Family + Parent + session in src/routes/(auth)/signup/+page.svelte and src/routes/(auth)/signup/+page.server.ts per contracts/routes.md signup contract
- [ ] T025 Create login page with dual-mode form (parent email/password or kid familyCode/PIN) and server action to validate credentials and create session in src/routes/(auth)/login/+page.svelte and src/routes/(auth)/login/+page.server.ts per contracts/routes.md login contract
- [ ] T026 [P] Create dev seed script that populates a test family with parent, two kids, sample chores, and sample prizes in src/lib/server/db/seed.ts

**Checkpoint**: Foundation ready — auth works, schema is migrated, app shell renders with header/tabs. User story implementation can begin.

---

## Phase 3: User Story 1 — Family Setup & Core Chore Loop (Priority: P1) 🎯 MVP

**Goal**: Parent creates family/kids/chores; kid views personalized dashboard and completes chores earning coins.

**Independent Test**: Create a family with one parent and one kid, add a chore, log in as the kid, complete the chore — verify coin balance increases and chore card shows green completed state.

### Tests for User Story 1

> **Write these tests FIRST, ensure they FAIL before implementing the corresponding feature code.**

- [X] T027 [P] [US1] Write Vitest integration tests for parent kid CRUD (create, update, deactivate) server actions in tests/integration/admin-kids.test.ts
- [X] T028 [P] [US1] Write Vitest integration tests for parent chore CRUD (create, update, soft-delete) server actions in tests/integration/admin-chores.test.ts
- [X] T029 [P] [US1] Write Vitest integration tests for kid chore completion (success, duplicate prevention, coin award) server actions in tests/integration/chore-completion.test.ts
- [X] T030 [P] [US1] Write Playwright E2E test for full parent signup → add kid → create chore → kid login → complete chore → verify coin balance flow in tests/e2e/chore-loop.test.ts
- [X] T031 [P] [US1] Write Playwright accessibility test using axe-core for kid chore dashboard page in tests/e2e/a11y-chores.test.ts

### Implementation for User Story 1

- [X] T032 [P] [US1] Create parent kid management page with create/update/deactivate forms and kid list display in src/routes/(app)/admin/kids/+page.svelte and src/routes/(app)/admin/kids/+page.server.ts per contracts/routes.md admin/kids contract
- [X] T033 [P] [US1] Create parent chore management page with create/update/delete forms, kid assignment dropdown, and chore list display in src/routes/(app)/admin/chores/+page.svelte and src/routes/(app)/admin/chores/+page.server.ts per contracts/routes.md admin/chores contract
- [X] T034 [US1] Create ChoreCard component in src/lib/components/ChoreCard.svelte displaying emoji icon, title, frequency badge, description, coin value, assignee tag, and checkmark button with pending (orange) and completed (green) states per mockup
- [X] T035 [US1] Create kid chore dashboard page with personalized greeting, remaining chore count, and chore card list in src/routes/(app)/chores/+page.svelte per contracts/routes.md chores load contract
- [X] T036 [US1] Implement chore dashboard server loader in src/routes/(app)/chores/+page.server.ts that loads active chores for the active kid, computes completion status for the current period using periodKey, and returns greeting/remainingCount/chores per contracts/routes.md
- [X] T037 [US1] Implement chore completion server action in src/routes/(app)/chores/+page.server.ts (action: complete) that validates no duplicate in current period, inserts ChoreCompletion record within a transaction, and logs the event via pino per contracts/routes.md and data-model.md
- [X] T038 [US1] Add kid profile switching via URL query param (?kid={kidId}) support in chore dashboard loader and KidSwitcher navigation in src/routes/(app)/chores/+page.server.ts

**Checkpoint**: User Story 1 fully functional — parent can create family/kids/chores, kid can log in and complete chores earning coins. All T027–T031 tests pass.

---

## Phase 4: User Story 2 — Prize Shop (Priority: P2)

**Goal**: Parent creates prizes; kid browses Prize Shop and redeems coins for prizes.

**Independent Test**: Give a kid a coin balance (from completing chores), create a prize, have the kid redeem it — verify balance decreases and redemption is recorded.

### Tests for User Story 2

- [X] T039 [P] [US2] Write Vitest integration tests for parent prize CRUD (create, update, soft-delete) server actions in tests/integration/admin-prizes.test.ts
- [X] T040 [P] [US2] Write Vitest integration tests for kid prize redemption (success, insufficient coins, balance update) server actions in tests/integration/prize-redemption.test.ts; include an assertion verifying that `coinBalance = SUM(coinsAwarded from completions) - SUM(coinCost from redemptions)` holds after a mix of completions and redemptions (SC-006 coin consistency)
- [X] T041 [P] [US2] Write Playwright E2E test for parent creates prize → kid redeems prize → verify balance decrease and redemption log flow in tests/e2e/prize-shop.test.ts
- [X] T042 [P] [US2] Write Playwright accessibility test using axe-core for prize shop page in tests/e2e/a11y-prizes.test.ts

### Implementation for User Story 2

- [X] T043 [P] [US2] Create parent prize management page with create/update/delete forms and prize list display in src/routes/(app)/admin/prizes/+page.svelte and src/routes/(app)/admin/prizes/+page.server.ts per contracts/routes.md admin/prizes contract
- [X] T044 [US2] Create PrizeCard component in src/lib/components/PrizeCard.svelte displaying title, description, coin cost, and redeem button (enabled/disabled based on canAfford) per mockup style
- [X] T045 [US2] Create prize shop page with prize card grid and current coin balance display in src/routes/(app)/prizes/+page.svelte per contracts/routes.md prizes load contract
- [X] T046 [US2] Implement prize shop server loader in src/routes/(app)/prizes/+page.server.ts that loads active prizes and computes `canAfford` (balance >= coinCost) and `shortfall` (coinCost - balance when canAfford is false, else 0) for each prize for the active kid per contracts/routes.md
- [X] T047 [US2] Implement prize redemption server action in src/routes/(app)/prizes/+page.server.ts (action: redeem) that validates sufficient balance within a transaction, inserts PrizeRedemption record, and logs the event via pino per contracts/routes.md and data-model.md
- [X] T064 [P] [US2] Write Vitest integration tests for parent activity log server loader (returns merged, reverse-chronological chore completions and prize redemptions; pagination; parent-only access) in tests/integration/admin-activity.test.ts
- [X] T065 [P] [US2] Write Playwright E2E test for parent views Activity Log after kid completes a chore and redeems a prize — verify both events appear with correct kid name, item title, coins, and timestamp in tests/e2e/activity-log.test.ts
- [X] T066 [P] [US2] Create parent activity log page and server loader in src/routes/(app)/admin/activity/+page.svelte and src/routes/(app)/admin/activity/+page.server.ts: loader merges ChoreCompletion and PrizeRedemption rows for the family, sorted by occurredAt desc with page-based pagination (25/page), per contracts/routes.md admin/activity contract and FR-020

**Checkpoint**: User Story 2 complete — kids can browse and redeem prizes; parent can review activity log. All T039–T042, T064–T065 tests pass. Coin economy loop (earn from chores → spend on prizes) works end-to-end.

---

## Phase 5: User Story 3 — Family Leaderboard (Priority: P3)

**Goal**: Family members view a ranked leaderboard of kids by coins earned in the current weekly period.

**Independent Test**: Have two kids earn different coin amounts from chores and verify the leaderboard ranks them correctly with accurate totals.

### Tests for User Story 3

- [X] T048 [P] [US3] Write Vitest integration tests for leaderboard data loader (ranking calculation, period boundaries, period reset behavior) in tests/integration/leaderboard.test.ts
- [X] T049 [P] [US3] Write Playwright E2E test for two kids completing chores → view leaderboard → verify correct ranking in tests/e2e/leaderboard.test.ts
- [X] T050 [P] [US3] Write Playwright accessibility test using axe-core for leaderboard page in tests/e2e/a11y-leaderboard.test.ts

### Implementation for User Story 3

- [X] T051 [US3] Create LeaderboardRow component in src/lib/components/LeaderboardRow.svelte displaying rank, avatar emoji, kid name, and coins earned with visual ranking indicators
- [X] T052 [US3] Create leaderboard page with period label, ranking list using LeaderboardRow components in src/routes/(app)/leaderboard/+page.svelte per contracts/routes.md leaderboard load contract
- [X] T053 [US3] Implement leaderboard server loader in src/routes/(app)/leaderboard/+page.server.ts that computes weekly period boundaries (using family.leaderboardResetDay), aggregates coins earned per kid from ChoreCompletion records within the period, ranks by total, and returns period/rankings per contracts/routes.md

**Checkpoint**: All three user stories functional. Leaderboard shows correct rankings. All T048–T050 tests pass.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Settings, data export/delete, observability, accessibility hardening, and documentation.

- [X] T054 [P] Create parent settings page with family name edit, leaderboard reset day config, export button, and delete family button (with confirmation) in src/routes/(app)/admin/settings/+page.svelte and src/routes/(app)/admin/settings/+page.server.ts per contracts/routes.md admin/settings contract
- [X] T055 [P] Implement JSON data export endpoint in src/routes/api/export/+server.ts that returns full family dataset as downloadable JSON per contracts/routes.md export contract and FR-017
- [X] T056 [P] Implement delete family server action in src/routes/(app)/admin/settings/+page.server.ts (action: deleteFamily) that deletes all family data, invalidates sessions, and redirects to login per FR-017
- [X] T057 [P] Write Vitest integration tests for data export (valid JSON structure, all entities included) and family deletion (all data removed, sessions invalidated) in tests/integration/settings.test.ts
- [X] T058 [P] Write Playwright E2E test for parent export data → verify JSON download, and parent delete family → verify redirect to login in tests/e2e/settings.test.ts
- [X] T059 Add structured logging for all mutation operations (signup, kid create, chore complete, prize redeem, family delete) in relevant +page.server.ts files using the pino logger from src/lib/server/logger.ts
- [X] T060 Run full Playwright accessibility audit across all pages (chores, prizes, leaderboard, admin pages, auth pages) and fix any WCAG 2.1 Level A violations in tests/e2e/a11y-full.test.ts
- [X] T061 [P] Add responsive CSS breakpoints in src/app.css for mobile layout (chore cards stack vertically, tabs remain accessible) per edge case requirements
- [X] T062 [P] Update quickstart.md in specs/001-choreography-mvp/quickstart.md to reflect final commands, env vars, and any changes from implementation
- [ ] T063 Run quickstart.md validation: follow the quickstart from scratch using Docker Compose and verify the full signup → chore complete → prize redeem → leaderboard → parent views Activity Log flow works

**Checkpoint**: All polish tasks complete. Settings/export/delete functional. Accessibility validated. Documentation up to date.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Stories (Phase 3–5)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3)
  - US2 and US3 can start in parallel after Foundational if needed, but recommended sequential for solo dev
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) — no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) — independent of US1 but benefits from chore completion flows being tested first
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) — depends on ChoreCompletion data existing, so best after US1

### Within Each User Story

- Tests MUST be written and FAIL before implementation (Constitution Principle IV)
- Components before pages that use them
- Server loaders before page UI that depends on them
- Server actions after loaders
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks T002–T008, T010 marked [P] can run in parallel
- Foundational tasks T014–T016, T021–T023, T026 marked [P] can run in parallel after T011–T013
- All tests within a user story marked [P] can run in parallel
- US1 implementation: T032 and T033 can run in parallel (different admin pages)
- US2 tests T039–T042, T064–T065 can all run in parallel
- US3 tests T048–T050 can all run in parallel
- Polish T054–T058, T061–T062 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all US1 tests together:
Task: T027 "Vitest integration tests for admin kid CRUD"
Task: T028 "Vitest integration tests for admin chore CRUD"
Task: T029 "Vitest integration tests for chore completion"
Task: T030 "Playwright E2E test for full chore loop"
Task: T031 "Playwright accessibility test for chore dashboard"

# Launch parallel admin pages:
Task: T032 "Parent kid management page"
Task: T033 "Parent chore management page"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Parent can create family/kids/chores, kid can complete chores and earn coins
5. Deploy/demo if ready — this alone delivers core product value

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Demo (MVP!)
3. Add User Story 2 → Test independently → Demo (coin economy complete)
4. Add User Story 3 → Test independently → Demo (gamification complete)
5. Add Polish → Full validation → Release-ready

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (tests then implementation)
   - Developer B: User Story 2 (tests then implementation)
   - Developer C: User Story 3 (tests then implementation)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Write tests before implementing (Constitution Principle IV)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Coin balance is always derived — never stored separately (research.md R5)
- PeriodKey uniqueness constraint prevents duplicate chore completions (data-model.md)
