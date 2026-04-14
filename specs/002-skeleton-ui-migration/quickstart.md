# Quickstart: Skeleton UI Migration

**Feature**: `002-skeleton-ui-migration`  
**Branch**: `002-skeleton-ui-migration`

This guide helps contributors get the migration branch running locally and understand the development conventions for the feature.

---

## Prerequisites

- Node.js 20 LTS (check with `node -v`)
- npm 10+ (check with `npm -v`)
- Git

---

## 1. Clone and Switch to the Feature Branch

```bash
git clone <repo-url>  # or: git fetch && git checkout 002-skeleton-ui-migration
cd choreography
git checkout 002-skeleton-ui-migration
```

---

## 2. Install Dependencies

Run from the repository root. This installs all existing deps plus the new Skeleton/Tailwind packages once they are added by the implementation:

```bash
npm install
```

New packages being added by this feature:

| Package | Purpose |
|---------|---------|
| `@skeletonlabs/skeleton` | Skeleton v4 design system core (CSS) |
| `@skeletonlabs/skeleton-svelte` | Skeleton v4 Svelte component library |
| `tailwindcss` | Tailwind CSS v4 |
| `@tailwindcss/vite` | Tailwind Vite plugin (replaces PostCSS approach) |
| `@tailwindcss/forms` | Form element normalisation plugin |
| `@lucide/svelte` | Lucide icon library |

---

## 3. Environment Setup

Copy the example environment file and configure the required variables:

```bash
cp .env.example .env
```

Minimum required variables:

```env
DATABASE_URL=file:./local.db
ORIGIN=http://localhost:5173
```

---

## 4. Run Database Migrations

```bash
npm run db:migrate:prod
```

This runs `src/migrate.ts` via `tsx`, applying all Drizzle ORM migrations to the local SQLite database.

---

## 5. Start the Dev Server

```bash
npm run dev
```

Open http://localhost:5173 in your browser. You should see the app with the Skeleton Vintage theme applied.

---

## 6. Verify the Theme is Active

In your browser's DevTools:
1. Inspect the `<html>` element — it must have `data-theme="vintage"`
2. Inspect any primary-colour button — it should show amber/orange from the Vintage preset
3. Check the Network → CSS panel — `app.css` should contain `@import '@skeletonlabs/skeleton/themes/vintage'`

---

## 7. Run Tests

All 41 integration tests must continue to pass throughout the migration:

```bash
npm test
```

Run continuously while working:

```bash
npm run test:watch
```

---

## 8. Lint and Type-Check

```bash
npm run lint
npm run check
```

The `lint` script runs `svelte-check` which catches type errors in `.svelte` files.

---

## 9. Key Working Conventions for This Feature

### No `<style>` blocks

Every Svelte file must have its scoped `<style>` block removed. All styling is via Tailwind utility classes and Skeleton presets applied inline on elements.

**Wrong:**
```svelte
<div class="my-card">…</div>
<style>
  .my-card { background: var(--color-surface); padding: 1rem; }
</style>
```

**Right:**
```svelte
<div class="card preset-filled-surface-100-900 p-4">…</div>
```

### Skeleton Component Pattern

Use the composed sub-component pattern. All Skeleton components use dot-notation children:

```svelte
<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar>
  <AppBar.Toolbar>
    <AppBar.Lead>…</AppBar.Lead>
    <AppBar.Headline>…</AppBar.Headline>
    <AppBar.Trail>…</AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
```

### Button Loading State

All form submit buttons must be disabled when a `use:enhance` submission is in-flight:

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let submitting = $state(false);
</script>

<form method="POST" use:enhance={() => {
  submitting = true;
  return async ({ update }) => { await update(); submitting = false; };
}}>
  <button type="submit" class="btn preset-filled" disabled={submitting}>
    Save
  </button>
</form>
```

### Colour Classes

Use Skeleton's semantic colour tokens, not raw Tailwind colours:

| Intent | Class |
|--------|-------|
| Primary action fill | `preset-filled-primary-500` or `preset-filled` |
| Hover ghost | `hover:preset-tonal` |
| Surface background | `bg-surface-50-950` |
| Surface card background | `bg-surface-100-900` |
| Border | `border border-surface-200-800` |
| Error text | `text-error-600-400` |
| Success text | `text-success-600-400` |

---

## 10. Project Structure Reference

```text
src/
├── app.css                             # Global stylesheet — Tailwind + Skeleton imports
├── app.html                            # Root HTML shell — data-theme="vintage" on <html>
├── lib/
│   └── components/
│       ├── Header.svelte               # → AppBar
│       ├── NavTabs.svelte              # → Navigation layout="bar"
│       ├── KidSwitcher.svelte          # → custom <a> btn row
│       ├── ChoreCard.svelte            # → card + Skeleton utilities
│       ├── PrizeCard.svelte            # → card + Skeleton utilities
│       └── LeaderboardRow.svelte       # → Tailwind flex row
└── routes/
    ├── (auth)/
    │   ├── login/+page.svelte          # → Skeleton form/card/btn
    │   └── signup/+page.svelte         # → Skeleton form/card/btn
    └── (app)/
        ├── +layout.svelte              # → custom flex layout (no AppShell)
        ├── chores/+page.svelte
        ├── prizes/+page.svelte
        ├── leaderboard/+page.svelte
        └── admin/
            ├── chores/+page.svelte
            ├── kids/+page.svelte
            ├── prizes/+page.svelte
            ├── settings/+page.svelte
            └── activity/+page.svelte

specs/002-skeleton-ui-migration/
├── plan.md           # This implementation plan
├── research.md       # Phase 0 research output
├── data-model.md     # Token migration map
├── quickstart.md     # This file
└── tasks.md          # Generated by /speckit.tasks (next step)
```
