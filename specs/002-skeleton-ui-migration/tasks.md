# Tasks: Skeleton UI Migration

**Input**: Design documents from `specs/002-skeleton-ui-migration/`
**Branch**: `002-skeleton-ui-migration`
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Research**: [research.md](research.md) | **Data Model**: [data-model.md](data-model.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.
**Tests**: No new test tasks — migration is purely presentational; all 41 existing integration tests must continue to pass unchanged (FR-014).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unresolved dependencies on other tasks in this phase)
- **[US1]**: User Story 1 — All App Pages Render Correctly with Skeleton Styling (P1 — MVP)
- **[US2]**: User Story 2 — Consistent Theme Applied Across All Surfaces (P2)
- **[US3]**: User Story 3 — Auth Pages Use Skeleton Form and Card Conventions (P3)

### Plan Phase Reference

| tasks.md Phase | plan.md Phase | Description |
|----------------|---------------|-------------|
| Phase 1 | Phase 1 | Infrastructure — install + configure |
| Phase 2 | Phase 3 (part) | App Shell Layout |
| Phase 3 | Phase 2 + Phase 4 | Shared Components + App Route Pages |
| Phase 4 | Phase 4 (part) | Theme Consistency and Error Styling |
| Phase 5 | Phase 3 (part) | Auth Pages |
| Phase 6 | Phase 5 | Final Validation (includes T021/T022 audits, moved here from Phase 4) |

---

## Phase 1: Setup — Install & Configure (Blocking Prerequisites)

**Purpose**: Install all new packages, configure Tailwind v4 + Skeleton v4, and update the global CSS and HTML entry points. **Nothing in any later phase will render correctly until this phase is complete.**

**⚠️ CRITICAL**: No user story work can begin until Phase 1 is complete and `npm test` passes.

- [X] T001 Install Skeleton v4 and Tailwind v4 packages: run `npm install @skeletonlabs/skeleton @skeletonlabs/skeleton-svelte tailwindcss @tailwindcss/vite @tailwindcss/forms @lucide/svelte` and verify `package.json` is updated
- [X] T002 Register `@tailwindcss/vite` plugin in `vite.config.ts` — add `import tailwindcss from '@tailwindcss/vite'` and place `tailwindcss()` **before** `sveltekit()` in the `plugins` array
- [X] T003 Replace `src/app.css` completely with the Skeleton v4 canonical import order: `@import 'tailwindcss'`, `@plugin '@tailwindcss/forms'`, `@import '@skeletonlabs/skeleton'`, `@import '@skeletonlabs/skeleton-svelte'`, `@import '@skeletonlabs/skeleton/themes/vintage'`, plus the Windows browser bugfix block for `.select, .input, .textarea, .input-group`
- [X] T004 Add `data-theme="vintage"` to the `<html>` element in `src/app.html` (Skeleton v4 requires this on `<html>`, not `<body>`)
- [X] T005 Run `npm test` and confirm all 41 integration tests pass; fix any import-level TypeScript errors introduced by new packages before proceeding

**Checkpoint**: Dev server (`npm run dev`) starts without errors. Browser DevTools confirms `<html data-theme="vintage">`. Skeleton colour tokens are active (amber/orange primary, warm-cream surface).

---

## Phase 2: Foundational — App Shell Layout

**Purpose**: Migrate the app layout shell that wraps every authenticated route. This must be done before any app route page can be considered correctly migrated.

**⚠️ CRITICAL**: All US1 route page tasks (T013–T020) depend on this phase being complete.

- [X] T006 Migrate `src/routes/(app)/+layout.svelte`: replace `<div class="app-shell">` with `<div class="min-h-dvh flex flex-col">`, replace `<main class="page-content">` with `<main class="flex-1 max-w-screen-lg mx-auto w-full px-4 py-6">`, and remove the `<style>` block entirely

**Checkpoint**: Visiting any authenticated route shows a full-height flex layout wrapping Header + NavTabs + page content. No scoped styles on the layout.

---

## Phase 3: User Story 1 — All App Pages Render Correctly (Priority: P1) 🎯 MVP

**Goal**: Every shared component and every app route page renders using Skeleton v4 utility classes and Tailwind. Zero scoped `<style>` blocks. All interactive elements (buttons, links, forms) use Skeleton presets.

**Independent Test**: Visit `/chores`, `/prizes`, `/leaderboard`, `/admin/chores`, `/admin/kids`, `/admin/prizes`, `/admin/settings`, `/admin/activity`. All content renders, no raw unstyled HTML, header and nav bar are visually consistent across all routes.

### Shared Components (all T007–T012 are mutually independent — run in parallel)

- [X] T007 [P] [US1] Rebuild `src/lib/components/Header.svelte` using `AppBar`, `AppBar.Toolbar`, `AppBar.Lead`, `AppBar.Headline`, `AppBar.Trail` from `@skeletonlabs/skeleton-svelte`; apply `sticky top-0 z-10 bg-surface-50-950 border-b border-surface-200-800` on `AppBar`; toolbar uses `grid-cols-[auto_1fr_auto] max-w-screen-lg mx-auto px-4`; keep brand link, family name, coin badge, role badge, and logout form with `use:enhance`; remove `<style>` block
- [X] T008 [P] [US1] Rebuild `src/lib/components/NavTabs.svelte` using `Navigation layout="bar"` + `Navigation.Menu` + `Navigation.TriggerAnchor` from `@skeletonlabs/skeleton-svelte`; active tab gets `preset-filled-primary-500`, inactive gets `hover:preset-tonal`; keep `isActive()` logic for determining active state; keep emoji icons inline; remove `<style>` block
- [X] T009 [P] [US1] Rebuild `src/lib/components/KidSwitcher.svelte` as a `<nav class="flex gap-1">` containing one `<a>` per kid with classes `btn btn-sm` plus `preset-filled-primary-500` when active or `hover:preset-tonal` when inactive; keep `kidUrl()` URL construction logic; keep `aria-current` attribute; only render when `kids.length > 1`; remove `<style>` block
- [X] T010 [P] [US1] Rebuild `src/lib/components/ChoreCard.svelte` with outer `<div class="card preset-outlined-surface-200-800 p-4 space-y-2">`; replace all legacy class references with Tailwind + Skeleton utilities; add `let submitting = $state(false)` and wire `use:enhance` callback to set/unset `submitting`; add `disabled={submitting}` to the mark-complete submit button; remove `<style>` block
- [X] T011 [P] [US1] Rebuild `src/lib/components/PrizeCard.svelte` with outer `<div class="card preset-filled-surface-100-900 p-4 space-y-2">`; replace all legacy class references with Tailwind + Skeleton utilities; add `submitting` state pattern to any redeem/purchase form button; remove `<style>` block
- [X] T012 [P] [US1] Rebuild `src/lib/components/LeaderboardRow.svelte` using Tailwind flex or table-row layout (`flex items-center justify-between gap-4 py-2 border-b border-surface-200-800`); replace all legacy class references; remove `<style>` block

### App Route Pages (T013–T020 are mutually independent — run in parallel after T007–T012)

- [X] T013 [P] [US1] Migrate `src/routes/(app)/chores/+page.svelte`: remove `<style>` block; replace every legacy CSS class with Tailwind + Skeleton utility classes using the mapping in `data-model.md §2`; ensure any inline form buttons use `btn preset-filled` and the `submitting` pattern
- [X] T014 [P] [US1] Migrate `src/routes/(app)/prizes/+page.svelte`: remove `<style>` block; replace legacy classes with Tailwind + Skeleton utilities; verify `PrizeCard` usage is clean (no inline overrides that reference old tokens)
- [X] T015 [P] [US1] Migrate `src/routes/(app)/leaderboard/+page.svelte`: remove `<style>` block; replace legacy classes with Tailwind utilities; wrap leaderboard list with appropriate Skeleton `card` or `table` classes
- [X] T016 [P] [US1] Migrate `src/routes/(app)/admin/chores/+page.svelte`: remove `<style>` block; replace all legacy classes; apply `paging-group`, `btn`, `input`, `label`, `card` Skeleton utilities to the admin chore management interface; add `submitting` state to any inline form buttons
- [X] T017 [P] [US1] Migrate `src/routes/(app)/admin/kids/+page.svelte`: remove `<style>` block; replace all legacy classes; apply Skeleton form and card utilities to the kid management forms; add `submitting` state to create/edit form buttons
- [X] T018 [P] [US1] Migrate `src/routes/(app)/admin/prizes/+page.svelte`: remove `<style>` block; replace all legacy classes; apply Skeleton card/form/button utilities to prize admin interface; add `submitting` state to form buttons
- [X] T019 [P] [US1] Migrate `src/routes/(app)/admin/settings/+page.svelte`: remove `<style>` block; replace all legacy classes; apply Skeleton form utilities (`label`, `input`, `select`, `btn preset-filled`) to settings forms; add `submitting` state to save button
- [X] T020 [P] [US1] Migrate `src/routes/(app)/admin/activity/+page.svelte`: remove `<style>` block; replace all legacy classes with Tailwind utilities; wrap activity log entries using Skeleton table or card layout classes

**Checkpoint**: All 8 authenticated app routes render correctly with Skeleton Vintage theme. Header shows AppBar with sticky positioning. NavTabs shows `Navigation layout="bar"` below header. No `var(--color-*)` or `var(--space-*)` references visible in any component markup. All submit buttons in app pages have `disabled={submitting}`.

---

## Phase 4: User Story 2 — Consistent Theme Across All Surfaces (Priority: P2)

**Goal**: Ensure all error and alert messaging across app route pages uses Skeleton error/success styling. Full token and style-block audits (T021, T022) are deferred to Phase 6 so they cover the complete codebase — including auth pages migrated in Phase 5.

**Independent Test**: Load all authenticated pages and confirm error messages use Skeleton error preset styles rather than ad-hoc red/green CSS classes.

- [X] T023 [P] [US2] Ensure all error and success alert messages across app route pages use Skeleton error/success styling: replace any `.error-msg`, `.success-msg`, or ad-hoc red/green classes with `text-error-600-400` / `card preset-tonal-error p-3 text-sm` or equivalent Skeleton utilities (see `research.md §2.8`)

**Checkpoint**: All app route error/success messages use Skeleton error/success presets. Token and style-block audits (SC-003, SC-004) run in Phase 6 after auth pages are complete.

---

## Phase 5: User Story 3 — Auth Pages Use Skeleton Form Conventions (Priority: P3)

**Goal**: Login and signup pages use Skeleton form utility classes (`input`, `label`), Skeleton card as the auth container, and `btn preset-filled` for submit buttons. Form submission buttons are disabled while in-flight. `@tailwindcss/forms` normalisation is active.

**Independent Test**: Visit `/login` and `/signup` in a fresh session. Tab through all form fields — confirm consistent cross-browser styling from `@tailwindcss/forms`. Submit buttons use `btn preset-filled`. Submit with invalid data and confirm error message uses Skeleton error preset.

- [X] T024 [P] [US3] Migrate `src/routes/(auth)/login/+page.svelte`: wrap page in `<div class="min-h-dvh flex items-center justify-center p-4 bg-surface-50-950">`; use `<div class="card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-4 shadow-xl">` as the form card; role-switcher buttons use `btn` + `preset-filled-primary-500` (active) / `hover:preset-tonal` (inactive); all inputs use `input` class with `label` + `label-text` wrappers; submit button uses `btn preset-filled w-full` with `disabled={submitting}`; add `submitting` state to `use:enhance` callback; error messages use `text-sm text-error-600-400`; remove `<style>` block
- [X] T025 [P] [US3] Migrate `src/routes/(auth)/signup/+page.svelte`: apply the same auth-page pattern as T024 — card wrapper, `input` + `label` utilities, `btn preset-filled w-full` submit with `disabled={submitting}`, `submitting` state wired to `use:enhance`, error messages with `text-sm text-error-600-400`; remove `<style>` block

**Checkpoint**: `/login` and `/signup` render with Vintage theme card styling. Tabbing through form fields shows consistent `@tailwindcss/forms` normalised inputs. Submit buttons are disabled when a submission is in flight. SC-006 and SC-007 satisfied.

---

## Phase 6: Polish & Cross-Cutting Validation

**Purpose**: Final remediation and end-to-end validation. T021 and T022 (token and style-block audits) run here — after all files including auth pages (Phase 5) are migrated — to catch any remaining legacy tokens or style blocks before the grep verification pass.

- [X] T021 [US2] Audit all migrated Svelte files in `src/` for any remaining `var(--color-*)`, `var(--space-*)`, `var(--radius-*)`, `var(--font-*)`, or `var(--shadow-*)` references (including inside `style=""` attributes); fix each occurrence by substituting the Tailwind equivalent from `data-model.md §1` — runs here after auth pages (Phase 5) are complete to cover the full codebase
- [X] T022 [P] [US2] Audit all migrated Svelte files in `src/` for any remaining scoped `<style>` blocks (including empty ones); remove every `<style>` block found — runs here after auth pages (Phase 5) are complete to cover the full codebase
- [X] T026 Run `npm test` and verify all 41 integration tests pass with exit code 0 (SC-001)
- [X] T027 Run `npm run lint` (`svelte-check`) and `npm run check` — resolve any type errors introduced during migration
- [X] T028 Run `grep -rn "var(--" src/` — confirm zero results; if any remain, trace to source file and fix (SC-003)
- [X] T029 Run `grep -rn "<style>" src/` — confirm zero results; if any remain, remove the block (SC-004)
- [ ] T030 Manual browser smoke test: open each of the 10 routes (`/login`, `/signup`, `/chores`, `/prizes`, `/leaderboard`, `/admin/chores`, `/admin/kids`, `/admin/prizes`, `/admin/settings`, `/admin/activity`) and confirm: (1) no JavaScript console errors and no raw unstyled HTML (SC-002); (2) Vintage orange/amber primary colour appears on active nav items and primary buttons across all routes (SC-005); (3) keyboard tab through all 10 routes confirms visible focus indicators on all interactive elements (SC-007)

**Checkpoint**: All SC-001 through SC-007 criteria satisfied. Feature is complete and ready for PR.

---

## Dependency Graph (User Story Completion Order)

```
Phase 1 (T001–T005)
    └── Phase 2 (T006)
            ├── Phase 3 US1 (T007–T012) [parallel]
            │       └── Phase 3 US1 Pages (T013–T020) [parallel]
            │               └── Phase 4 US2 (T023 only)
            │                       └── Phase 6 (T021, T022, T026–T030)
            │
            └── Phase 5 US3 (T024–T025) [parallel, starts after T006 — independent of Phases 3–4]
                    └── Phase 6 (T021, T022, T026–T030)
```

**MVP Scope**: Complete Phase 1 + Phase 2 + Phase 3 (T001–T020). This delivers User Story 1 (P1) which is the core migration deliverable.

---

## Parallel Execution Guide

### Phase 3: Maximum Parallelism (US1 — 14 tasks)

All 6 component tasks (T007–T012) can run in parallel with each other.
All 8 route page tasks (T013–T020) can run in parallel with each other.
Component tasks (T007–T012) should be completed before starting route page tasks (T013–T020) for correct visual results, though the file edits are non-conflicting.

### Phase 4 + Phase 5: Cross-Phase Parallelism

- T023 (error styling, Phase 4) can run in parallel with Phase 3 route page tasks (T013–T020) since these are independent class changes to different files.
- T024 (login) and T025 (signup) — Phase 5 — can begin immediately after T006 (layout); they are independent of all app route pages. Phase 5 can be batched with Phase 3 and Phase 4 in a single implementation session.
- T021 and T022 (moved to Phase 6) run only after ALL phases (1–5) are fully complete, to audit the entire codebase including auth pages.

### Suggested Implementation Order for a Single LLM Session

```
T001 → T002 → T003 → T004 → T005 → T006
→ T007, T008, T009, T010, T011, T012, T024, T025 (parallel batch — auth pages start here)
→ T013, T014, T015, T016, T017, T018, T019, T020, T023 (parallel batch)
→ T021, T022 → T026 → T027 → T028 → T029 → T030
```
