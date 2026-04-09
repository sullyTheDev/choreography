# Feature Specification: Skeleton UI Framework Migration

**Feature Branch**: `002-skeleton-ui-migration`  
**Created**: 2026-04-09  
**Status**: Draft  
**Input**: User description: "Standardize all existing pages and UI to use the new Skeleton UX framework as required by the constitution file."

## Clarifications

### Session 2026-04-09

- Q: Should the app use a Skeleton preset theme or a custom theme file to match the orange brand palette? → A: Use the Skeleton **Vintage** preset theme as-is.
- Q: Should NavTabs stay at the top (below the header) or move to the bottom of the viewport? → A: Keep it at the top, directly below the sticky header.
- Q: How should the KidSwitcher be implemented with Skeleton? → A: Tabbed layout (row of kid buttons); use Skeleton `SegmentedControl` or custom tab buttons if needed.
- Q: Should form submit buttons show a disabled/loading state during `use:enhance` submission? → A: Yes — disable submit buttons while submission is in flight.
- Q: Must ALL `<style>` blocks be removed project-wide, or only in shared components? → A: All `<style>` blocks project-wide must be removed; all styling via Tailwind utility classes only.

## User Scenarios & Testing *(mandatory)*

### User Story 1 – All App Pages Render Correctly with Skeleton Styling (Priority: P1)

As a parent or kid using the app, all pages I visit look polished, consistent, and on-brand after the migration. I should not notice any regression in usability or visual quality compared to before the migration.

**Why this priority**: This is the core deliverable of the migration. Every user-facing surface must function correctly and look coherent with the new design system before any other user story matters.

**Independent Test**: Visit each app route (`/login`, `/signup`, `/chores`, `/prizes`, `/leaderboard`, `/admin/chores`, `/admin/kids`, `/admin/prizes`, `/admin/settings`, `/admin/activity`) and confirm all content renders, interactive elements work, and no raw unstyled HTML is visible.

**Acceptance Scenarios**:

1. **Given** a fresh visit to `/login`, **When** the page loads, **Then** the login card renders with Skeleton-styled inputs, buttons, and role-switcher without raw unstyled elements.
2. **Given** a parent is logged in and visits `/admin/kids`, **When** the page loads, **Then** the manage-kids table and forms render using Skeleton card, button, and input utility classes.
3. **Given** a kid is logged in and visits `/chores`, **When** the page loads, **Then** all chore cards display using Skeleton card and badge utility classes, and the "mark complete" button uses Skeleton button presets.
4. **Given** any page is visited, **When** the layout renders, **Then** the header (AppBar) and navigation bar (positioned at the top, below the header) use Skeleton component classes and are visually consistent across all routes.
5. **Given** form submission returns an error (e.g., wrong PIN), **When** the error message renders, **Then** it displays using Skeleton's alert or error preset styling.

---

### User Story 2 – Consistent Theme Applied Across All Surfaces (Priority: P2)

As any user, I see a consistent visual theme (colours, typography, spacing) applied uniformly across every page – matching the app's existing orange-and-warm-surface brand palette.

**Why this priority**: Without a unified theme, the migration may produce an inconsistent experience even if individual components function correctly. Theme correctness is essential for visual cohesion.

**Independent Test**: Load the app in a browser and cycle through all pages. Confirm the primary colour (orange), surface colour (warm white), and typography scale are visually consistent and controlled by the Skeleton theme system rather than ad-hoc CSS custom properties.

**Acceptance Scenarios**:

1. **Given** the Skeleton theme is configured in `app.css`, **When** any page loads, **Then** the `data-theme` attribute is set on the `<html>` element and the Skeleton colour tokens drive all primary, surface, and text colours.
2. **Given** the app uses a Skeleton preset theme (or a custom theme) matching the current orange primary, **When** a button with `preset-filled` is rendered, **Then** it appears in the configured primary colour.
3. **Given** the global stylesheet (`app.css`) is updated, **When** Tailwind v4 and Skeleton are loaded, **Then** no orphaned CSS custom property tokens from the old design system (e.g., `--color-primary`, `--color-surface`) remain controlling the visual output.

---

### User Story 3 – Auth Pages Use Skeleton Form and Card Conventions (Priority: P3)

As a new user on the signup page or a returning user on the login page, I interact with standard Skeleton-styled form inputs, labels, and submit buttons that feel familiar and accessible.

**Why this priority**: Auth pages are the entry point for all users. Skeleton form conventions improve accessibility (via `@tailwindcss/forms` normalisation) and visual consistency, but they handle less state complexity than in-app pages.

**Independent Test**: Visit `/login` and `/signup` on a clean session. Tab through all form fields and submit buttons. Confirm inputs visually match Skeleton's `input` utility class styling and buttons match `btn preset-filled`.

**Acceptance Scenarios**:

1. **Given** `@tailwindcss/forms` is installed and configured as a Tailwind plugin, **When** the login and signup form inputs render, **Then** they display with normalised consistent styling across browsers.
2. **Given** a user submits the signup form with invalid data, **When** the error message appears, **Then** it uses Skeleton's alert or error preset (not an ad-hoc red CSS class).
3. **Given** a user clicks "Sign in" or "Create account →", **When** the button renders, **Then** it uses `btn preset-filled` (or equivalent Skeleton primary action preset).

---

### Edge Cases

- What happens when a Skeleton component is not available for a specific UI need (e.g., a highly custom emoji avatar picker)? → Keep custom markup but style using Tailwind utility classes consistent with the Skeleton design system.
- How does the system handle dark mode? → Default to Tailwind's `class` or `selector` dark mode strategy as configured by Skeleton. Light-mode-first; dark mode is not a hard requirement for this migration.
- What if an existing integration test touches DOM structure that changes after migration? → Tests that assert server-side logic (actions, data loading) are unaffected. Tests that assert rendered HTML structure may require minimal updates to selectors.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tailwind CSS v4 MUST be installed and configured as the primary CSS utility layer.
- **FR-002**: Skeleton v4 packages (`@skeletonlabs/skeleton` and `@skeletonlabs/skeleton-svelte`) MUST be installed.
- **FR-003**: The `@tailwindcss/forms` plugin MUST be installed and registered in `app.css` to normalise form element styling.
- **FR-004**: The global stylesheet (`src/app.css`) MUST be updated to import Tailwind, Skeleton core, and a Skeleton preset theme. The legacy CSS custom property design token system MUST be replaced.
- **FR-005**: The Skeleton **Vintage** preset theme MUST be applied via `data-theme="vintage"` on the root `<html>` element in `src/app.html`, and imported in `app.css` via `@import '@skeletonlabs/skeleton/themes/vintage'`.
- **FR-006**: The `Header` component MUST be rebuilt using the Skeleton `AppBar` component (`AppBar`, `AppBar.Toolbar`, `AppBar.Lead`, `AppBar.Headline`, `AppBar.Trail`).
- **FR-007**: The `NavTabs` component MUST be rebuilt using the Skeleton `Navigation` component in `layout="bar"` mode, positioned at the top of the page directly below the sticky header (not fixed to the bottom of the viewport).
- **FR-008**: All button elements across every page and component MUST use Skeleton button utility classes (`btn`, `btn-icon`) with appropriate presets (`preset-filled`, `preset-tonal`, `preset-outlined`, `hover:preset-tonal`).
- **FR-009**: All card containers across every page and component MUST use the Skeleton `card` utility class (and optionally a `preset-*` for fill/outline/tonal styling).
- **FR-010**: All form inputs, labels, and field groups across every page MUST use Skeleton's form utility classes (`input`, `label`, `select`, `textarea`).
- **FR-011**: Error and success alert messages MUST use Skeleton alert styling or a `preset-outlined-error` / `preset-tonal-error` card instead of the legacy `.error-msg` class.
- **FR-012**: Every Svelte file in the project MUST have its scoped `<style>` block removed. All styling MUST be expressed exclusively via Tailwind utility classes and Skeleton preset/utility classes applied directly on elements. This applies to all shared components (`Header`, `NavTabs`, `KidSwitcher`, `ChoreCard`, `PrizeCard`, `LeaderboardRow`) and all route-level page files. The `KidSwitcher` component MUST be rebuilt as a horizontal row of per-kid `<a>` elements styled with Skeleton button presets (`btn btn-sm` with `preset-filled-primary-500` for the active kid and `hover:preset-tonal` for inactive). The Skeleton `SegmentedControl` component MUST NOT be used — it relies on an internal Zag state machine that is incompatible with URL-driven kid selection.
- **FR-013**: The app layout shell (currently `.app-shell`) MUST be rebuilt as a custom layout using semantic HTML and Tailwind as described in the Skeleton layouts guide (no AppShell component — it was removed in Skeleton v3+).
- **FR-014**: All 41 existing integration tests MUST continue to pass without modification to server-side logic, actions, or data shapes.
- **FR-015**: All existing SvelteKit routes, form actions, and data loading logic MUST remain functionally unchanged. Only the presentation layer is in scope.
- **FR-016**: The `Lucide` icon package (`@lucide/svelte`) MUST be installed as the project's standard icon library for future use. This migration does NOT require any new Lucide icons to be added; existing emoji-based icons MUST remain as-is for the duration of this migration. The package is installed now so future features can use it without a separate setup step.
- **FR-017**: All form submit buttons MUST be disabled while a `use:enhance` form submission is in-flight. The `enhance` callback's `submitting` state MUST be used to set `disabled={submitting}` on the submit button, preventing double-submissions.

### Key Entities

- **Design Token System**: The current system is a set of CSS custom properties in `app.css` (e.g., `--color-primary`, `--color-surface`). After migration this is replaced by the Skeleton theme system (CSS custom properties managed by Skeleton's `@theme` layer, activated by `data-theme`).
- **Global Stylesheet (`app.css`)**: The single entry point for all global styles. After migration it imports Tailwind, Skeleton core, the chosen preset theme, and the `@tailwindcss/forms` plugin. The legacy reset and utility classes are removed.
- **Component Inventory**: 6 shared components (`Header`, `NavTabs`, `KidSwitcher`, `ChoreCard`, `PrizeCard`, `LeaderboardRow`) and 8 route-level page files under `(app)` and `(auth)` — all must be migrated.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 41 existing integration tests pass after migration with no server-side logic changes.
- **SC-002**: Every page (`/login`, `/signup`, `/chores`, `/prizes`, `/leaderboard`, `/admin/chores`, `/admin/kids`, `/admin/prizes`, `/admin/settings`, `/admin/activity`) loads without JavaScript console errors or unhandled exceptions.
- **SC-003**: Zero legacy CSS custom property tokens (e.g., `var(--color-primary)`, `var(--space-4)`) remain anywhere in the codebase — no `<style>` blocks, no `app.css` remnants — after migration.
- **SC-004**: Zero scoped `<style>` blocks exist anywhere in the project after migration (components, layouts, and page files). Every visual style is expressed via Tailwind utility classes or Skeleton presets applied directly on HTML elements.
- **SC-005**: The Skeleton Vintage theme's primary colour is applied consistently on all interactive elements (buttons, active nav items, focus rings); the visual palette is the Vintage preset's own colour scheme.
- **SC-006**: All form inputs across the app pass basic cross-browser visual normalisation (provided by `@tailwindcss/forms`) — no browser-default discrepancies in padding, border, or background.
- **SC-007**: Basic accessibility: all interactive elements remain keyboard-focusable with a visible focus indicator, and all form inputs retain their associated `<label>` elements.

## Assumptions

- The **Skeleton Vintage preset theme** is used as-is; its visual colour palette is accepted without any primary-colour overrides or custom theme files.
- The migration is purely presentational — no user-visible features are added, removed, or altered in behaviour.
- The `@lucide/svelte` package will be installed as the icon library; existing emoji icons in components may be retained where they serve as decorative content rather than iconography.
- Dark mode is out of scope for this migration; the app defaults to light mode.
- Skeleton `Navigation layout="bar"` is used for the top-positioned tab nav (directly below the sticky header) on both the kid-facing layout and the admin management area.
- The `KidSwitcher` component is rebuilt as a custom horizontal row of per-kid `<a>` buttons. The Skeleton `SegmentedControl` component is explicitly ruled out because its internal Zag state machine conflicts with URL-driven kid selection. Each kid maps to an `<a>` element with `btn btn-sm` styling; the active kid is determined by comparing `href` to the current URL pathname.
- No new routes or user-facing features are introduced as part of this migration.
