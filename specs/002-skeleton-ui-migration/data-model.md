# Data Model: Skeleton UI Migration

**Phase 1 output for** `002-skeleton-ui-migration`  
**Produced by**: `/speckit.plan`  
**Date**: 2026-04-09

---

## Overview

This is a **presentational-only migration**. No changes are made to the database schema, ORM models, SvelteKit actions, or data loading functions. The "data model" for this feature is the design token mapping from the legacy CSS custom property system to the Skeleton v4 / Tailwind v4 theme system.

---

## 1. Design Token Migration Map

### 1.1 Colour Tokens

| Legacy CSS Property | Old Value (approx.) | Skeleton / Tailwind Equivalent |
|---------------------|---------------------|-------------------------------|
| `--color-primary` | `#f97316` (orange-500) | `bg-primary-500` / `text-primary-500` |
| `--color-surface` | `#fffbf5` (warm white) | `bg-surface-50-950` (color pairing) |
| `--color-surface-2` | `#f5ede2` | `bg-surface-100-900` |
| `--color-text` | `#1a1a1a` | `text-surface-950-50` |
| `--color-text-secondary` | `#6b6b6b` | `text-surface-500` or `opacity-60` |
| `--color-border` | `#e8ddd0` | `border-surface-200-800` |
| `--color-error` | `#dc2626` | `text-error-600-400` / `preset-tonal-error` |
| `--color-success` | `#16a34a` | `text-success-600-400` / `preset-tonal-success` |

### 1.2 Spacing Tokens

| Legacy CSS Property | Value | Tailwind Equivalent |
|---------------------|-------|---------------------|
| `--space-1` | `0.25rem` | `gap-1`, `p-1`, `m-1` |
| `--space-2` | `0.5rem` | `gap-2`, `p-2`, `m-2` |
| `--space-3` | `0.75rem` | `gap-3`, `p-3` |
| `--space-4` | `1rem` | `gap-4`, `p-4` |
| `--space-6` | `1.5rem` | `gap-6`, `p-6` |
| `--space-8` | `2rem` | `gap-8`, `p-8` |

### 1.3 Typography Tokens

| Legacy CSS Property | Value | Tailwind Equivalent |
|---------------------|-------|---------------------|
| `--font-size-xs` | `0.75rem` | `text-xs` |
| `--font-size-sm` | `0.875rem` | `text-sm` |
| `--font-size-base` | `1rem` | `text-base` |
| `--font-size-lg` | `1.125rem` | `text-lg` |
| `--font-size-xl` | `1.25rem` | `text-xl` |
| `--font-weight-bold` | `700` | `font-bold` |
| `--font-weight-semibold` | `600` | `font-semibold` |

### 1.4 Border Radius Tokens

| Legacy CSS Property | Value | Tailwind / Skeleton Equivalent |
|---------------------|-------|-------------------------------|
| `--radius` | `0.5rem` | `rounded-base` (Skeleton) or `rounded-lg` |
| `--radius-sm` | `0.25rem` | `rounded` |
| `--radius-lg` | `1rem` | `rounded-container` (Skeleton) |

### 1.5 Shadow Tokens

| Legacy | Skeleton / Tailwind |
|--------|---------------------|
| `--shadow-sm` | `shadow-sm` |
| `--shadow-md` | `shadow-md` |

---

## 2. Component CSS Class Migration Map

### 2.1 Buttons

| Legacy Class | Skeleton / Tailwind Replacement |
|--|--|
| `.btn` | `btn preset-filled` |
| `.btn-ghost` | `btn hover:preset-tonal` |
| `.btn-sm` | `btn btn-sm` (or `text-sm py-1 px-3`) |
| `.btn-primary` | `btn preset-filled-primary-500` |
| `.role-btn.active` + `.role-btn` | `btn preset-filled` / `btn hover:preset-tonal` (toggle pattern) |

### 2.2 Cards

| Legacy Class | Skeleton / Tailwind Replacement |
|--|--|
| `.card` | `card preset-outlined-surface-200-800` |
| `.card.elevated` | `card preset-filled-surface-100-900 shadow-md` |
| `.chore-card` | `card preset-outlined-surface-200-800 p-4 space-y-2` |
| `.prize-card` | `card preset-filled-surface-100-900 p-4 space-y-2` |

### 2.3 Form Elements

| Legacy Class | Skeleton / Tailwind Replacement |
|--|--|
| `.field` | `label` (wrapper) + `input` (Skeleton form utility) |
| `.field label` | `label-text` |
| `.field input` | `input` |
| `.field select` | `select` |
| `.error-msg` | `text-sm text-error-600-400` or `card preset-tonal-error p-3 text-sm` |

### 2.4 Layout Classes

| Legacy Class | Tailwind Replacement |
|--|--|
| `.app-shell` | `min-h-dvh flex flex-col` |
| `.page-content` | `flex-1 max-w-screen-lg mx-auto w-full px-4 py-6` |
| `.auth-page` | `min-h-dvh flex items-center justify-center p-4 bg-surface-50-950` |
| `.auth-card` | `card preset-filled-surface-100-900 w-full max-w-sm p-6 space-y-4 shadow-xl` |

### 2.5 Navigation

| Legacy Class | Skeleton / Tailwind Replacement |
|--|--|
| `.nav-tabs` / `.tabs-inner` | `Navigation layout="bar"` component + inner `Navigation.Menu` |
| `.tab` | `Navigation.TriggerAnchor` with `hover:preset-tonal` |
| `.tab.active` | `Navigation.TriggerAnchor` with `preset-filled-primary-500` |
| `.kid-switcher` | `flex gap-1` nav wrapper |
| `.kid-tab` | `btn btn-sm hover:preset-tonal` |
| `.kid-tab.active` | `btn btn-sm preset-filled-primary-500` |

### 2.6 Header

| Legacy Class | Skeleton / Tailwind Replacement |
|--|--|
| `.app-header` | `AppBar` with `sticky top-0 z-10 bg-surface-50-950 border-b border-surface-200-800` |
| `.header-inner` | `AppBar.Toolbar` with `grid-cols-[auto_1fr_auto] max-w-screen-lg mx-auto px-4` |
| `.header-brand` | `AppBar.Lead` with `flex flex-col` children |
| `.brand-link` | `<a>` with `text-lg font-extrabold text-primary-500 no-underline` |
| `.family-name` | `<span>` with `text-xs text-surface-500` |
| `.header-right` | `AppBar.Trail` with default flex items |
| `.coin-badge` | `<span>` with `flex items-center gap-1 font-bold` |
| `.role-badge` | `<span>` with `badge preset-tonal-surface text-xs` |

---

## 3. Skeleton Component–to–Feature Mapping

| Feature / UI Element | Skeleton Component or Tailwind Pattern |
|---------------------|---------------------------------------|
| Sticky app header | `AppBar` + `AppBar.Toolbar` + `AppBar.Lead` + `AppBar.Headline` + `AppBar.Trail` |
| Top navigation tabs | `Navigation layout="bar"` + `Navigation.Menu` + `Navigation.TriggerAnchor` |
| Kid switcher (URL-driven) | Custom `<a>` elements with `btn` + preset classes (URL navigation pattern) |
| Chore card | `card` + `preset-outlined-surface-200-800` + Tailwind spacing |
| Prize card | `card` + `preset-filled-surface-100-900` + Tailwind spacing |
| Leaderboard row | Tailwind flex row or table row with Skeleton utilities |
| Login / signup form | `label` + `input` + `btn preset-filled` + `card` wrapper |
| Error messages | `text-error-600-400` or `card preset-tonal-error` |
| Submit buttons (in-flight) | `btn preset-filled disabled={submitting}` |
| App shell layout | Semantic `<div class="min-h-dvh flex flex-col">` (no AppShell component) |

---

## 4. Theme System Entity

### Skeleton Theme: Vintage

The active theme is stored as a `data-theme` attribute on the `<html>` element and is loaded via a CSS `@import`. It sets CSS custom properties that Skeleton's `@theme` layer exposes as Tailwind utility classes.

```
Entity: ActiveTheme
  id: "vintage"  
  source: "@skeletonlabs/skeleton/themes/vintage"  
  activation: data-theme="vintage" on <html>  
  primary-hue: amber/orange  
  surface-hue: warm cream  
  customizations: none (as-is preset)
```

No CSS file needs to be created for the theme — it is imported directly from the npm package.

---

## 5. State Transitions for Submit Buttons

```
State Machine: FormSubmission
  IDLE  →(user clicks submit)→  SUBMITTING
  SUBMITTING  →(action returns)→  IDLE

  IDLE:
    button.disabled = false
    button.text = label (e.g., "Sign in")

  SUBMITTING:
    button.disabled = true
    button.text = loading label (e.g., "Signing in…") [optional]
```

Svelte implementation:
```svelte
let submitting = $state(false);
use:enhance={() => {
  submitting = true;
  return async ({ update }) => { await update(); submitting = false; };
}}
```

---

## 6. No Backend Data Model Changes

The following are explicitly **outside scope** and unchanged:

- Drizzle ORM schema (`src/lib/server/db/schema.ts`)
- SvelteKit `load` functions (`+page.server.ts`, `+layout.server.ts`)
- SvelteKit form actions (`+page.server.ts`)
- Session / authentication logic
- Database migrations (`src/migrate.ts`)
- All 41 integration tests (must pass without modification)
