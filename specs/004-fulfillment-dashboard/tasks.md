# Tasks: Fulfillment Dashboard

**Input**: Design documents from `specs/004-fulfillment-dashboard/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/form-actions.md`, `quickstart.md`

**Tests**: Included because this feature has acceptance-critical behavior and explicit success criteria.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create the route/test scaffolding required for approvals work.

- [X] T001 Create approvals route files `src/routes/(app)/admin/approvals/+page.server.ts` and `src/routes/(app)/admin/approvals/+page.svelte`
- [X] T002 Create approvals integration test file scaffold in `tests/integration/admin-approvals.test.ts`
- [X] T003 Create approvals e2e test file scaffold in `tests/e2e/approvals-dashboard.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish shared admin entry-point and base approvals contract before story-specific work.

**CRITICAL**: Complete this phase before starting user story phases.

- [X] T004 Add admin pending-count load contract in `src/routes/(app)/admin/+page.server.ts`
- [X] T005 Update admin Manage grid with Approvals card + badge placeholder in `src/routes/(app)/admin/+page.svelte`
- [X] T006 Implement approvals load parameter parsing (`page`, `sort`, `dir`) in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T007 Implement shared approvals table shell with sort/pagination state wiring in `src/routes/(app)/admin/approvals/+page.svelte`

**Checkpoint**: Admin entry point and approvals base route are in place.

---

## Phase 3: User Story 1 - Review Pending Requests (Priority: P1) 🎯 MVP

**Goal**: Parent/admin can review only pending prize requests with full row context and table controls.

**Independent Test**: Seed mixed statuses and confirm `/admin/approvals` shows only pending rows for current family with expected row anatomy, sorting, pagination, and empty state.

### Tests for User Story 1

- [X] T008 [P] [US1] Add pending-only load and family-scope integration tests in `tests/integration/admin-approvals.test.ts`
- [X] T009 [P] [US1] Add approvals list rendering, sorting, pagination, and empty-state e2e tests in `tests/e2e/approvals-dashboard.test.ts`
- [X] T028 [US1] Add non-admin authorization tests for approvals load/actions (expect 403 for member role on `/admin/approvals`, `fulfill`, and `dismiss`) in `tests/integration/admin-approvals.test.ts`
- [X] T029 [US1] Add badge-accuracy verification tests ensuring `/admin` Approvals badge equals DB pending count across mixed-status fixtures in `tests/integration/admin-approvals.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Implement pending-only approvals query (family-scoped join to members/prizes) in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T011 [US1] Implement default oldest-first ordering and allowed sort columns in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T012 [US1] Render full-width approvals table row anatomy (emoji, context text, relative time, coin badge) in `src/routes/(app)/admin/approvals/+page.svelte`
- [X] T013 [US1] Render friendly empty state when pending list is empty in `src/routes/(app)/admin/approvals/+page.svelte`
- [X] T014 [US1] Wire live pending-count badge data to Approvals card in `src/routes/(app)/admin/+page.svelte`

**Checkpoint**: User Story 1 is independently functional and testable.

---

## Phase 4: User Story 2 - Fulfill a Request Fast (Priority: P1)

**Goal**: Parent/admin can fulfill a pending request in a single click, with activity logging and conflict-safe behavior.

**Independent Test**: From `/admin/approvals`, click Fulfill and verify status changes to `fulfilled`, row leaves pending list, activity log entry exists, and stale-row conflict returns handled notice + refresh.

### Tests for User Story 2

- [X] T015 [P] [US2] Add fulfill-action integration tests (status update, event insert, conflict handling) in `tests/integration/admin-approvals.test.ts`
- [X] T016 [P] [US2] Add fulfill-flow e2e coverage (single-click fulfill and row removal) in `tests/e2e/approvals-dashboard.test.ts`

### Implementation for User Story 2

- [X] T017 [P] [US2] Implement `fulfill` form action transaction (`pending` -> `fulfilled`) in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T018 [US2] Insert `prize_fulfilled` activity event metadata in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T019 [US2] Implement already-processed conflict response contract for fulfill in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T020 [P] [US2] Add single-tap Fulfill button form and handled notice refresh UX in `src/routes/(app)/admin/approvals/+page.svelte`

**Checkpoint**: User Story 2 is independently functional and testable.

---

## Phase 5: User Story 3 - Dismiss Mistaken Requests (Priority: P2)

**Goal**: Parent/admin can dismiss a mistaken pending request via confirmed destructive action with no refund side effects.

**Independent Test**: Click Dismiss, confirm action, verify row deletion and removal from pending list, no coin refund behavior, and conflict-safe already-processed notice when stale.

### Tests for User Story 3

- [X] T021 [P] [US3] Add dismiss-action integration tests (delete, no refund side effect, conflict handling) in `tests/integration/admin-approvals.test.ts`
- [X] T022 [P] [US3] Add dismiss confirmation and deletion e2e coverage in `tests/e2e/approvals-dashboard.test.ts`

### Implementation for User Story 3

- [X] T023 [US3] Implement `dismiss` form action as pending-row delete in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T024 [US3] Implement already-processed conflict response contract for dismiss in `src/routes/(app)/admin/approvals/+page.server.ts`
- [X] T025 [US3] Add confirmed ghost-style Dismiss control with explicit already-processed notice + automatic refresh handling, plus no-refund UX messaging in `src/routes/(app)/admin/approvals/+page.svelte`

**Checkpoint**: User Story 3 is independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete feature and align supporting docs.

- [X] T026 [P] Update feature verification notes for approvals workflow in `specs/004-fulfillment-dashboard/quickstart.md`
- [X] T027 [P] Run full validation commands and capture results context in `specs/004-fulfillment-dashboard/tasks.md`
- [X] T030 Add explicit accessibility validation for approvals flow (keyboard navigation, focus order, and basic semantics) in `tests/e2e/approvals-dashboard.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) has no dependencies.
- Foundational (Phase 2) depends on Phase 1 and blocks all user stories.
- User Story phases (Phases 3-5) depend on Foundational completion.
- Polish (Phase 6) depends on completion of target user stories.

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; no dependency on US2 or US3.
- **US2 (P1)**: Starts after Phase 2 and benefits from US1 table UI, but server action can be implemented independently.
- **US3 (P2)**: Starts after Phase 2 and reuses approvals route structure from US1.

### Within Each User Story

- Tests first, then server action/load implementation, then UI wiring.
- Server-side behavior should be complete before final UI notice/interaction polish.
- Authorization and badge-accuracy assertions for US1 (T028, T029) are mandatory before US1 sign-off.

## Parallel Opportunities

- T008 can run in parallel with T009.
- T028 and T029 can run after T008 because they share the same integration test file.
- T010 and T011 can run in parallel after T006.
- T015 and T016 can run in parallel.
- T017 and T020 can run in parallel once action contract is stabilized.
- T021 and T022 can run in parallel.
- T026 and T027 can run in parallel.
- T030 should run after US1-US3 UI behaviors are complete.

---

## Parallel Example: User Story 1

```bash
# Run in parallel after foundational phase:
Task: "T008 [US1] Add pending-only load and family-scope integration tests in tests/integration/admin-approvals.test.ts"
Task: "T009 [US1] Add approvals list rendering, sorting, pagination, and empty-state e2e tests in tests/e2e/approvals-dashboard.test.ts"
```

## Parallel Example: User Story 2

```bash
# Run in parallel after US2 test design is settled:
Task: "T017 [US2] Implement fulfill form action transaction in src/routes/(app)/admin/approvals/+page.server.ts"
Task: "T020 [US2] Add single-tap Fulfill button form and notice UX in src/routes/(app)/admin/approvals/+page.svelte"
```

## Parallel Example: User Story 3

```bash
# Run in parallel after US3 test design is settled:
Task: "T021 [US3] Add dismiss-action integration tests in tests/integration/admin-approvals.test.ts"
Task: "T022 [US3] Add dismiss confirmation and deletion e2e coverage in tests/e2e/approvals-dashboard.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Phases 1-2.
2. Complete Phase 3 (US1).
3. Validate pending-only list + badge + empty state.
4. Demo/deploy MVP slice.

### Incremental Delivery

1. Add US2 fulfill action and validate activity logging.
2. Add US3 dismiss action and validate no-refund behavior.
3. Complete polish and full test/lint validation.

### Team Parallel Strategy

1. One developer handles server contracts in `src/routes/(app)/admin/approvals/+page.server.ts`.
2. One developer handles UI in `src/routes/(app)/admin/approvals/+page.svelte`.
3. One developer handles tests in `tests/integration/admin-approvals.test.ts` and `tests/e2e/approvals-dashboard.test.ts`.
4. Accessibility validation (T030) is owned by the UI/test track before final sign-off.

---

## Notes

- `[P]` tasks are safe to parallelize only when they do not target the same file.
- All user-story tasks include `[US#]` labels for traceability.
- Dismiss is explicitly delete-only with no refund mechanism.
- Fulfill remains single-tap; Dismiss requires confirmation.
- Default sort is oldest-first (`requestedAt asc`).
- Format validation: all tasks follow `- [ ] T### [P?] [US#?] Description with file path`.
