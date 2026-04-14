# Research: Skeleton UI Migration

**Phase 0 output for** `002-skeleton-ui-migration`  
**Produced by**: `/speckit.plan`  
**Date**: 2026-04-09  
**Source**: https://www.skeleton.dev/llms-svelte.txt

---

## 1. Installing Skeleton v4 into an Existing SvelteKit Project

> Key constraint: the project is already initialised with SvelteKit 2 + Svelte 5 Runes + Vite 8. We do NOT run `npx sv create`.

### 1.1 Install npm packages

```bash
npm install @skeletonlabs/skeleton @skeletonlabs/skeleton-svelte
npm install -D tailwindcss @tailwindcss/vite @tailwindcss/forms
npm install @lucide/svelte
```

Decision: install all four in one pass. No `tailwind.config.js` is needed with Tailwind v4.

### 1.2 Register the Tailwind Vite plugin

Edit `vite.config.ts`. The Tailwind Vite plugin MUST be listed **before** `sveltekit()`:

```ts
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit() as never],
  test: { ... } // unchanged
});
```

Rationale: Tailwind v4 uses a Vite plugin instead of PostCSS. No `postcss.config.js` is created or needed.

### 1.3 Replace `src/app.css`

The entire file must be replaced. The new content follows this exact order:

```css
/* 1. Tailwind v4 base (replaces @tailwind base/components/utilities) */
@import 'tailwindcss';

/* 2. Tailwind Forms plugin — must follow Tailwind import */
@plugin '@tailwindcss/forms';

/* 3. Skeleton core (design system + theme layer) */
@import '@skeletonlabs/skeleton';

/* 4. Skeleton Svelte component styles */
@import '@skeletonlabs/skeleton-svelte';

/* 5. Skeleton Vintage preset theme */
@import '@skeletonlabs/skeleton/themes/vintage';
```

No legacy CSS custom properties, no `.btn`, `.card`, `.field` utility classes, no reset. All of that is replaced by Tailwind + Skeleton.

### 1.4 Update `src/app.html`

Add `data-theme="vintage"` to the `<html>` element. In Skeleton v4 the attribute moved from `<body>` to `<html>`:

```html
<html lang="en" data-theme="vintage">
```

### 1.5 Verify layout import

`src/routes/+layout.svelte` already imports `../app.css`. No change required there beyond ensuring the import path still resolves.

---

## 2. Skeleton v4 Component API Patterns

### 2.1 General rules (from constitution + Skeleton docs)

- **Composed sub-component pattern** — all Skeleton components use dot-notation children: `<AppBar><AppBar.Toolbar>…</AppBar.Toolbar></AppBar>`
- **State in via props, events out** — do not use `bind:` with Skeleton Zag-backed components unless the component explicitly supports it. Use `onCheckedChange`, `onValueChange`, etc.
- **Class attribute** — all Skeleton components accept a `class` prop for Tailwind utility overrides.
- **No AppShell** — removed in Skeleton v3. Use custom semantic HTML + Tailwind.
- **Portal** — use `<Portal>` from `@skeletonlabs/skeleton-svelte` for dialogs, popovers that must escape the DOM.

### 2.2 AppBar (replaces Header `<header class="app-header">`)

```svelte
<script lang="ts">
  import { AppBar } from '@skeletonlabs/skeleton-svelte';
</script>

<AppBar class="sticky top-0 z-10 bg-surface-50-950 border-b border-surface-200-800">
  <AppBar.Toolbar class="grid-cols-[auto_1fr_auto] max-w-screen-lg mx-auto px-4">
    <AppBar.Lead>
      <!-- brand link -->
    </AppBar.Lead>
    <AppBar.Headline>
      <!-- family name or empty -->
    </AppBar.Headline>
    <AppBar.Trail>
      <!-- KidSwitcher, coin badge, role badge, logout -->
    </AppBar.Trail>
  </AppBar.Toolbar>
</AppBar>
```

### 2.3 Navigation layout="bar" (replaces NavTabs `<nav class="nav-tabs">`)

```svelte
<script lang="ts">
  import { Navigation } from '@skeletonlabs/skeleton-svelte';
</script>

<Navigation layout="bar"
  class="border-b border-surface-200-800 bg-surface-50-950">
  <Navigation.Menu class="grid grid-cols-{N} gap-2 max-w-screen-lg mx-auto px-4 py-1">
    {#each tabs as tab}
      <Navigation.TriggerAnchor href={tab.href}
        aria-current={isActive(tab.href) ? 'page' : undefined}
        class={isActive(tab.href) ? 'preset-filled-primary-500' : 'hover:preset-tonal'}>
        <span aria-hidden="true">{tab.emoji}</span>
        <Navigation.TriggerText>{tab.label}</Navigation.TriggerText>
      </Navigation.TriggerAnchor>
    {/each}
  </Navigation.Menu>
</Navigation>
```

### 2.4 SegmentedControl (replaces KidSwitcher custom nav)

KidSwitcher navigates via `<a href>` (URL-based selection) rather than managing a reactive value. `SegmentedControl` manages its own internal selected state with `onValueChange`. Because selection is expressed as a URL `?kid=` param, the preferred approach is to render a row of anchor buttons styled as a segmented tab group using Tailwind classes — matching the spirit of SegmentedControl without the Zag binding:

```svelte
<nav class="flex gap-1" aria-label="Switch kid">
  {#each kids as kid (kid.id)}
    <a href={kidUrl(kid.id)}
       class="btn btn-sm {kid.id === activeKidId
         ? 'preset-filled-primary-500'
         : 'hover:preset-tonal'}"
       aria-current={kid.id === activeKidId ? 'page' : undefined}>
      <span aria-hidden="true">{kid.avatarEmoji}</span>
      {kid.displayName}
    </a>
  {/each}
</nav>
```

Decision: Use custom `<a>` buttons with `btn` + preset classes rather than `SegmentedControl`. Rationale: KidSwitcher selection is URL-driven (requires `href` navigation), which is incompatible with SegmentedControl's internal Zag state machine.

### 2.5 Cards

```svelte
<div class="card preset-outlined-surface-200-800 p-4 space-y-2">
  <!-- content -->
</div>
```

Or filled:
```svelte
<div class="card preset-filled-surface-100-900 p-4">
```

### 2.6 Buttons

```svelte
<!-- Primary action -->
<button type="submit" class="btn preset-filled">Submit</button>

<!-- Secondary / ghost -->
<button type="button" class="btn hover:preset-tonal">Cancel</button>

<!-- Icon button -->
<button type="button" class="btn-icon hover:preset-tonal"><SomeIcon /></button>

<!-- Disabled during submission -->
<button type="submit" class="btn preset-filled" disabled={submitting}>Sign in</button>
```

### 2.7 Forms (requires @tailwindcss/forms plugin)

```svelte
<label class="label">
  <span class="label-text">Email</span>
  <input type="email" class="input" name="email" required />
</label>
```

Windows browser bugfix (add to app.css):
```css
.select, .input, .textarea, .input-group {
  background-color: var(--color-surface-50-950);
  color: var(--color-surface-950-50);
}
```

### 2.8 Error / Alert messages

Replace `.error-msg` class with:
```svelte
{#if form?.error}
  <p class="text-sm text-error-600-400">{form.error}</p>
{/if}
```

Or a card variant:
```svelte
<div class="card preset-tonal-error p-3 text-sm">{form.error}</div>
```

---

## 3. Custom Layout (no AppShell)

Replace `.app-shell` div with:

```svelte
<div class="min-h-dvh flex flex-col">
  <Header ... />
  <NavTabs ... />
  <main class="flex-1 max-w-screen-lg mx-auto w-full px-4 py-6">
    {@render children()}
  </main>
</div>
```

---

## 4. Tailwind v4 Differences vs v3

| Concern | v3 | v4 |
|---------|----|----|
| Config file | `tailwind.config.js` | None (CSS-first via `@theme`) |
| Entry directive | `@tailwind base/components/utilities` | `@import 'tailwindcss'` |
| Vite integration | PostCSS plugin | `@tailwindcss/vite` Vite plugin |
| Theme customisation | `theme.extend` in JS config | `@theme` block in CSS |
| Dark mode | `darkMode: 'class'` in config | `@variant dark` in CSS |
| `@apply` | Common | Discouraged; use CSS custom properties instead |

---

## 5. Vintage Theme Characteristics

- **Primary colour**: warm amber/orange (compatible with existing brand)
- **Surface colours**: warm cream / light parchment tones
- **Activated via**: `data-theme="vintage"` on `<html>`
- **Import**: `@import '@skeletonlabs/skeleton/themes/vintage'` in `app.css`
- **No overrides needed**: use preset as-is per clarification Q1

Skeleton color palette tokens used in classes:
- `primary-{shade}` → orange/amber
- `surface-{shade}` → cream/light background
- `error-{shade}` → red (for form errors)
- `success-{shade}` → green (for confirmations)

Color pairings (light/dark adaptive): `bg-surface-50-950`, `text-surface-950-50`, etc.

---

## 6. `use:enhance` + Submitting State Pattern

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let submitting = $state(false);
</script>

<form method="POST" use:enhance={() => {
  submitting = true;
  return async ({ update }) => {
    await update();
    submitting = false;
  };
}}>
  <button type="submit" class="btn preset-filled" disabled={submitting}>
    {submitting ? 'Saving…' : 'Save'}
  </button>
</form>
```

---

## 7. Migration File Inventory

| File | Migration Action | Priority |
|------|-----------------|----------|
| `vite.config.ts` | Add `@tailwindcss/vite` plugin before `sveltekit()` | P1 – blocker |
| `src/app.css` | Full replacement with Tailwind + Skeleton imports | P1 – blocker |
| `src/app.html` | Add `data-theme="vintage"` to `<html>` | P1 – blocker |
| `src/routes/+layout.svelte` | No change (already imports app.css) | N/A |
| `src/lib/components/Header.svelte` | Rebuild with AppBar; remove `<style>` | P1 |
| `src/lib/components/NavTabs.svelte` | Rebuild with Navigation layout="bar"; remove `<style>` | P1 |
| `src/lib/components/KidSwitcher.svelte` | Rebuild as `<a>` btn row; remove `<style>` | P1 |
| `src/lib/components/ChoreCard.svelte` | Replace custom classes with Skeleton/Tailwind; add submitting state; remove `<style>` | P1 |
| `src/lib/components/PrizeCard.svelte` | Replace custom classes; remove `<style>` | P1 |
| `src/lib/components/LeaderboardRow.svelte` | Replace custom classes; remove `<style>` | P1 |
| `src/routes/(app)/+layout.svelte` | Replace `.app-shell` with flex column; remove `<style>` | P1 |
| `src/routes/(auth)/login/+page.svelte` | Replace with Skeleton form/card/btn; remove `<style>` | P1 |
| `src/routes/(auth)/signup/+page.svelte` | Replace with Skeleton form/card/btn; remove `<style>` | P1 |
| `src/routes/(app)/chores/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/prizes/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/leaderboard/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/admin/chores/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/admin/kids/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/admin/prizes/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/admin/settings/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |
| `src/routes/(app)/admin/activity/+page.svelte` | Remove `<style>`; migrate page-level classes | P2 |

---

## 8. Key Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Tailwind integration | `@tailwindcss/vite` plugin | v4 no longer uses PostCSS |
| Theme | Skeleton Vintage preset as-is | Per clarification; no custom overrides |
| `data-theme` location | `<html>` element | Required by Skeleton v4 (moved from `<body>`) |
| KidSwitcher implementation | Custom `<a>` btn row | URL-driven selection incompatible with SegmentedControl's Zag state |
| NavTabs position | Top, below sticky header | Per clarification |
| Style blocks | All removed project-wide | Per clarification |
| Button loading | `disabled={submitting}` from `use:enhance` callback | Per clarification |
| AppShell | Not used | Removed in Skeleton v3+; custom layout required |
| Icon library | `@lucide/svelte` | Mandated by constitution |
