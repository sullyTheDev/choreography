# choreography Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-17

## UI System (Constitution Principle VI — enforced)
All new components, interactive elements, and UX patterns MUST use **Skeleton v4** (`@skeletonlabs/skeleton-svelte`) + **Tailwind CSS v4** first. Custom HTML/CSS is only acceptable when Skeleton provides no equivalent. Do NOT use Flowbite, DaisyUI, or similar alongside Skeleton.

## Active Technologies
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (002-skeleton-ui-migration)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (002-skeleton-ui-migration)
- TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Tailwind CSS v4, @skeletonlabs/skeleton v4, @skeletonlabs/skeleton-svelte v4, @tailwindcss/forms, @lucide/svelte (002-skeleton-ui-migration)
- SQLite via Drizzle ORM + libsql (unchanged) (002-skeleton-ui-migration)
- TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Drizzle ORM, @skeletonlabs/skeleton-svelte v4, Tailwind CSS v4 (003-family-unification)
- SQLite via Drizzle ORM + libsql (`drizzle-orm/libsql`) (003-family-unification)
- TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Drizzle ORM, `@skeletonlabs/skeleton-svelte` v4, Tailwind CSS v4, `@lucide/svelte` (004-add-redemption-dashboard)
- TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Drizzle ORM, `@skeletonlabs/skeleton-svelte` v4, Tailwind CSS v4, `@lucide/svelte`, `better-auth` (004-add-redemption-dashboard)
- SQLite via Drizzle ORM + libsql (`drizzle-orm/libsql`) using existing `DATABASE_URL` (004-add-redemption-dashboard)

- TypeScript 5.x / Node.js 20 LTS (001-choreography-mvp)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

npm test; npm run lint

## Code Style

TypeScript 5.x / Node.js 20 LTS: Follow standard conventions

## Recent Changes
- 004-add-redemption-dashboard: Added TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Drizzle ORM, `@skeletonlabs/skeleton-svelte` v4, Tailwind CSS v4, `@lucide/svelte`, `better-auth`
- 004-add-redemption-dashboard: Added TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Drizzle ORM, `@skeletonlabs/skeleton-svelte` v4, Tailwind CSS v4, `@lucide/svelte`
- 003-family-unification: Added TypeScript 5.x / Node.js 20 LTS + SvelteKit 2, Svelte 5 Runes, Drizzle ORM, @skeletonlabs/skeleton-svelte v4, Tailwind CSS v4


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
