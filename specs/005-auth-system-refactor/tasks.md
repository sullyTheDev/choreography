# Tasks: Authentication System Refactor (Local + Generic OIDC)

**Input**: Design documents from `specs/005-auth-system-refactor/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/auth-contracts.md`, `quickstart.md`

**Tests**: Included because the spec defines mandatory user-scenario testing and measurable acceptance outcomes per auth mode.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add core dependency and scaffolding for the new auth engine.

- [x] T001 Add `better-auth` runtime dependency in `package.json`
- [x] T002 Create server auth bootstrap module in `src/lib/auth.ts`
- [x] T003 [P] Create client auth helper in `src/lib/auth-client.ts`
- [x] T004 [P] Create Better Auth catch-all API route in `src/routes/api/auth/[...all]/+server.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish database/session/runtime foundations that all stories depend on.

**CRITICAL**: Complete this phase before starting user story phases.

- [x] T005 Add Better Auth tables and constraints (`user`, `session`, `account`, verification support) in `src/lib/server/db/schema.ts`
- [x] T006 Create migration for Better Auth schema alignment in `drizzle/0010_better_auth_refactor.sql`
- [x] T007 Update migration journal entry for new auth migration in `drizzle/meta/_journal.json`
- [x] T008 [P] Add auth environment defaults and required vars documentation (including `OIDC_ZERO_MATCH_POLICY`) in `.env.example`
- [x] T009 [P] Add auth-mode and provider config documentation in `README.md`
- [x] T010 Replace legacy session extraction with Better Auth session resolution in `src/hooks.server.ts`
- [x] T011 [P] Update app locals typing for Better Auth user/session shape in `src/app.d.ts`
- [x] T012 Remove or isolate legacy custom session authority helpers in `src/lib/server/auth.ts`

**Checkpoint**: Auth engine, schema, and request-session plumbing are ready for story implementation.

---

## Phase 3: User Story 1 - Local Sign-In Flow (Priority: P1) 🎯 MVP

**Goal**: Local mode shows only local controls and authenticates via Better Auth.

**Independent Test**: Set `AUTH_MODE=local`, open `/login`, verify local-only UI, successful local login with valid credentials, and clear failure on invalid credentials.

### Tests for User Story 1

- [x] T013 [P] [US1] Add local-mode login render and invalid-credentials integration coverage in `tests/integration/auth-local.test.ts`
- [x] T014 [P] [US1] Add local-mode login UX e2e coverage in `tests/e2e/login-modes.test.ts`
- [x] T042 [P] [US1] Add unsupported `AUTH_MODE` fallback-to-local integration coverage in `tests/integration/auth-local.test.ts`

### Implementation for User Story 1

- [x] T015 [US1] Implement local-mode load contract and local-only UI flags in `src/routes/(auth)/login/+page.server.ts`
- [x] T016 [US1] Implement local-mode form rendering and error message states in `src/routes/(auth)/login/+page.svelte`
- [x] T017 [US1] Wire local credential sign-in action to Better Auth local provider in `src/routes/(auth)/login/+page.server.ts`
- [x] T018 [US1] Refactor logout flow to invalidate Better Auth sessions in `src/routes/logout/+page.server.ts`
- [x] T019 [US1] Validate authenticated-route guard redirects from Better Auth session state in `src/hooks.server.ts`
- [x] T043 [US1] Implement unsupported `AUTH_MODE` fallback to local behavior in `src/routes/(auth)/login/+page.server.ts`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - OIDC Sign-In Flow (Priority: P1)

**Goal**: OIDC mode shows only provider sign-in and handles config/claim failures safely.

**Independent Test**: Set `AUTH_MODE=oidc` with valid provider config, sign in via provider button, and verify success; with invalid config, verify blocked login guidance.

### Tests for User Story 2

- [x] T020 [P] [US2] Add OIDC-mode valid/invalid configuration integration coverage in `tests/integration/auth-oidc.test.ts`
- [x] T021 [P] [US2] Add OIDC-only login UI and provider-label e2e coverage in `tests/e2e/login-modes.test.ts`
- [x] T022 [P] [US2] Add missing-claim deny-login integration coverage in `tests/integration/auth-oidc.test.ts`
- [x] T044 [P] [US2] Add missing-claim user-facing error message assertions in `tests/integration/auth-oidc.test.ts`
- [x] T045 [P] [US2] Add missing-claim error UX assertions in `tests/e2e/login-modes.test.ts`

### Implementation for User Story 2

- [x] T023 [US2] Implement OIDC-mode runtime config validation and page guidance messaging in `src/routes/(auth)/login/+page.server.ts`
- [x] T024 [US2] Implement OIDC-only UI state and provider label rendering in `src/routes/(auth)/login/+page.svelte`
- [x] T025 [US2] Configure generic OIDC provider wiring (`issuer`, client, claim key defaults) in `src/lib/auth.ts`
- [x] T026 [US2] Implement missing-claim hard-fail path (no account create/link side effects) in `src/lib/auth.ts`
- [x] T027 [US2] Emit structured `auth_oidc_config_invalid` and `auth_oidc_claim_missing` logs with required fields in `src/lib/auth.ts`
- [x] T046 [US2] Implement missing-claim user-facing error presentation contract in `src/routes/(auth)/login/+page.server.ts` and `src/routes/(auth)/login/+page.svelte`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Hybrid Sign-In and Account Linking (Priority: P2)

**Goal**: Both mode supports OIDC-first + local fallback and deterministic first-login linking to existing local identities.

**Independent Test**: Set `AUTH_MODE=both`, verify OIDC-first + divider + local form; verify first-time OIDC login links to exactly one matching local account and never creates duplicates.

### Tests for User Story 3

- [x] T028 [P] [US3] Add both-mode UI ordering and fallback integration coverage in `tests/integration/auth-oidc.test.ts`
- [x] T029 [P] [US3] Add deterministic account-linking integration coverage (exactly one match links existing user) in `tests/integration/auth-oidc.test.ts`
- [x] T030 [P] [US3] Add ambiguous-match deny-login integration coverage in `tests/integration/auth-oidc.test.ts`
- [x] T031 [P] [US3] Add both-mode UI ordering/fallback e2e coverage in `tests/e2e/login-modes.test.ts`
- [x] T047 [P] [US3] Add ambiguous-link user-facing error message assertions in `tests/integration/auth-oidc.test.ts`
- [x] T048 [P] [US3] Add ambiguous-link error UX assertions in `tests/e2e/login-modes.test.ts`
- [x] T050 [P] [US3] Add zero-match policy integration coverage (`deny` and `provision`) in `tests/integration/auth-oidc.test.ts`

### Implementation for User Story 3

- [x] T032 [US3] Implement both-mode login load contract with OIDC-first ordering metadata in `src/routes/(auth)/login/+page.server.ts`
- [x] T033 [US3] Implement both-mode UI composition (OIDC button, divider, local form) in `src/routes/(auth)/login/+page.svelte`
- [x] T034 [US3] Implement claim normalization (`trim` + case-fold) and local-match lookup for first OIDC login in `src/lib/auth.ts`
- [x] T035 [US3] Implement ambiguous-match hard-fail behavior with no link/create side effects in `src/lib/auth.ts`
- [x] T036 [US3] Implement first-time OIDC linking to existing local account mapping without duplicate user creation in `src/lib/auth.ts`
- [x] T037 [US3] Emit structured `auth_oidc_link_ambiguous` log event with required fields in `src/lib/auth.ts`
- [x] T038 [US3] Suppress OIDC entry in both-mode when config invalid while preserving local sign-in availability in `src/routes/(auth)/login/+page.server.ts`
- [x] T049 [US3] Implement ambiguous-link admin-action-required error presentation contract in `src/routes/(auth)/login/+page.server.ts` and `src/routes/(auth)/login/+page.svelte`
- [x] T051 [US3] Implement `OIDC_ZERO_MATCH_POLICY` handling (`deny` or `provision`, default `deny`) in `src/lib/auth.ts`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, migration notes, and cross-story hardening.

- [x] T039 [P] Add auth-session guard regression coverage for protected routes in `tests/integration/auth-session-guards.test.ts`
- [x] T040 [P] Add quickstart verification updates for all auth modes and error scenarios in `specs/005-auth-system-refactor/quickstart.md`
- [x] T041 Run full validation commands (`npm test`, `npm run test:e2e`, `npm run lint`) and record results in `specs/005-auth-system-refactor/tasks.md`
- [x] T052 [P] Add login accessibility integration checks (labels, validation semantics) in `tests/integration/auth-local.test.ts` and `tests/integration/auth-oidc.test.ts`
- [x] T053 [P] Add login accessibility e2e checks (keyboard flow, focus order, visible error announcements) in `tests/e2e/login-modes.test.ts`
- [x] T054 [P] Add timed sign-in completion validation workflow for SC-005 in `tests/e2e/login-modes.test.ts`
- [x] T055 [P] Add Skeleton v4 compliance verification note for login UI in `specs/005-auth-system-refactor/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies.
- Foundational (Phase 2) depends on Setup completion and blocks all user stories.
- User Story phases (Phases 3-5) depend on Foundational completion.
- Polish (Phase 6) depends on completion of target user stories.

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational; no dependency on US2/US3.
- **US2 (P1)**: Can start immediately after Foundational; independent of US1 for implementation, but shares login route files.
- **US3 (P2)**: Can start after Foundational and should build on US2 OIDC wiring for linking behavior.

### Within Each User Story

- Tests first, then server/runtime implementation, then UI composition and edge-case handling.
- Auth runtime behavior in `src/lib/auth.ts` should be completed before final login-page UX messaging.
- Story is done only when independent test criteria pass.

## Parallel Opportunities

- Setup parallel tasks: T003, T004.
- Foundational parallel tasks: T008, T009, T011 (after T005/T006 planning is understood).
- US1 parallel tasks: T013, T014, T042.
- US2 parallel tasks: T020, T021, T022, T044, T045.
- US3 parallel tasks: T028, T029, T030, T031, T047, T048, T050.
- Polish parallel tasks: T039, T040, T052, T053, T054, T055.

---

## Parallel Example: User Story 2

```bash
Task: "T020 [US2] Add OIDC-mode valid/invalid configuration integration coverage in tests/integration/auth-oidc.test.ts"
Task: "T021 [US2] Add OIDC-only login UI and provider-label e2e coverage in tests/e2e/login-modes.test.ts"
Task: "T022 [US2] Add missing-claim deny-login integration coverage in tests/integration/auth-oidc.test.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T029 [US3] Add deterministic account-linking integration coverage in tests/integration/auth-oidc.test.ts"
Task: "T031 [US3] Add both-mode UI ordering/fallback e2e coverage in tests/e2e/login-modes.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phases 1-2.
2. Complete Phase 3 (US1).
3. Validate local-mode independent acceptance criteria.
4. Demo/deploy MVP baseline before OIDC rollout.

### Incremental Delivery

1. Deliver US1 (local) to preserve baseline access.
2. Deliver US2 (OIDC-only path + observability).
3. Deliver US3 (hybrid mode + deterministic linking).
4. Complete cross-cutting regression and quickstart updates.

### Parallel Team Strategy

1. Developer A: `src/lib/auth.ts` runtime/provider/linking implementation.
2. Developer B: login route/server + Svelte UI behavior in `src/routes/(auth)/login/`.
3. Developer C: integration/e2e coverage in `tests/integration/` and `tests/e2e/`.
4. Merge on phase checkpoints to keep stories independently testable.

---

## Notes

- `[P]` tasks are parallel-safe only when they do not modify the same file concurrently.
- All user-story tasks include `[US#]` labels for clear traceability.
- Task format validation: all tasks follow `- [ ] T### [P?] [US#?] Description with file path`.
