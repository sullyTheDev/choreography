
<!--
Sync Impact Report
<<<<<<< HEAD
Version change: 1.0.0 → 1.1.0
Modified principles: Added UI Framework section (Skeleton v4 + Tailwind CSS v4)
Added sections: "UI Framework: Skeleton + Tailwind CSS"
Removed sections: None
Templates requiring updates: ✅ plan-template.md, ✅ spec-template.md, ✅ tasks-template.md
Follow-up TODOs: Existing UI should be migrated to Skeleton components progressively as features evolve.
=======
Version change: 1.1.0 → 1.2.0
Modified principles: "UI Framework: Skeleton + Tailwind CSS" (standalone section) → "VI. Skeleton UI System First" (numbered principle)
Added sections: Principle VI (promoted + new "Skeleton First" mandatory rule)
Removed sections: Standalone "UI Framework" section (merged into Principle VI)
Templates requiring updates:
  ✅ plan-template.md — Constitution Check gates already generic; no specific update required
  ✅ spec-template.md — No UI-specific gates referenced; no update required
  ✅ tasks-template.md — No UI-specific task types referenced; no update required
Follow-up TODOs: None. All existing UI already migrated to Skeleton v4 as of 2026-04-09.
>>>>>>> 02a1f75a38ed4ce7af6e811f88469eb69fc19c6a
-->

# Choreography Constitution

Choreography is an open-source web application for families to manage chores, rewards, coins, and leaderboards in a fun, family-centered way. The project is self-hostable by design, with SvelteKit as the primary implementation framework.

## Core Principles

### I. Family-Centered Product Slices
Every feature MUST map to a real family workflow for parents, kids, or both. Every specification MUST define independently testable user stories that can be delivered incrementally. Avoid shipping technical infrastructure without a clearly linked user outcome. Rationale: This ensures all work delivers value to real users and supports incremental, testable progress.

### II. Self-Hostable and Open by Default
Core product functionality MUST work in a self-hosted deployment. Hosted-only features MAY exist only if they are optional and do not block self-hosted users from the main product value. Prefer architectures, dependencies, and operational choices that are realistic for open-source contributors and self-hosters. Rationale: This maximizes accessibility and sustainability for all users.

### III. Privacy and Parent Control First
Data collection MUST be minimal and purpose-driven. The system MUST NOT send personal family data to third-party analytics platforms by default. Parent-controlled permissions and visibility boundaries MUST be explicit in product behavior. Families MUST be able to export and delete their data. Avoid collecting precise location or unnecessary profile data. Rationale: Protects family privacy and empowers parents.

### IV. Test-First, Correct, Accessible Delivery
Work MUST start with specification before implementation. Tests MUST be written before feature code for acceptance-critical behavior. Acceptance criteria MUST be covered by automated tests before a feature is considered done. Basic accessibility validation is required for shipped user-facing flows. Reliability and correctness matter more than shipping broad but weakly validated behavior. Rationale: Ensures quality, safety, and inclusivity.

### V. Observable Simplicity
Prefer the simplest SvelteKit architecture that satisfies the current need. Avoid unnecessary services, abstractions, or infrastructure until justified by real product pressure. Features with operational risk or user-impacting workflows MUST include structured logging and/or monitoring hooks as appropriate. Documentation and quickstart guidance MUST be updated when behavior changes. Rationale: Keeps the project maintainable and debuggable for all contributors.

<<<<<<< HEAD
## UI Framework: Skeleton + Tailwind CSS

All user-facing UI MUST be built with **Skeleton v4** (`@skeletonlabs/skeleton` + `@skeletonlabs/skeleton-svelte`) on top of **Tailwind CSS v4**. This is a permanent, project-wide constraint.

### Mandatory Rules
=======
### VI. Skeleton UI System First
All user-facing UI MUST be built with **Skeleton v4** (`@skeletonlabs/skeleton` + `@skeletonlabs/skeleton-svelte`) on top of **Tailwind CSS v4**. When implementing any new component, interactive element, or UX pattern, contributors MUST start from Skeleton's component library and utility classes. Custom HTML + CSS-only solutions are only acceptable when Skeleton provides no equivalent. This is a permanent, project-wide constraint that applies to all future features.

#### Mandatory Rules
>>>>>>> 02a1f75a38ed4ce7af6e811f88469eb69fc19c6a

- Import Skeleton Svelte components from `@skeletonlabs/skeleton-svelte`.
- Use the **composed sub-component pattern** for all Skeleton components (e.g., `<Avatar><Avatar.Image /><Avatar.Fallback /></Avatar>`).
- State flows **in via props**, changes flow **out via event handlers** — do not use two-way `bind:` with Skeleton components unless the component explicitly supports it.
- Apply all styling via Tailwind utility classes and Skeleton preset/utility classes passed through the `class` attribute.
- Themes MUST be defined using the Skeleton theme system (CSS custom properties, `data-theme` on `<html>`, imported in `app.css`).
- Page layouts MUST use custom semantic HTML + Tailwind — do not use any AppShell wrapper.
- Use `<Portal>` from `@skeletonlabs/skeleton-svelte` for overlays, popovers, and dialogs that must escape the DOM hierarchy.
- Use **Lucide** (`@lucide/svelte`) as the icon library.
- Form elements that use Skeleton's form utility classes MUST include the `@tailwindcss/forms` plugin (`@plugin '@tailwindcss/forms'` in `app.css`).

<<<<<<< HEAD
### Incompatible Libraries
=======
#### Incompatible Libraries
>>>>>>> 02a1f75a38ed4ce7af6e811f88469eb69fc19c6a

Do NOT use Flowbite, Flowbite-Svelte, or DaisyUI alongside Skeleton. These libraries make overlapping changes to Tailwind that conflict with Skeleton's color system and class names.

## Additional Technical and Product Constraints

- Default architecture is a single SvelteKit application unless a more complex topology is justified.
- The project is open source and must remain friendly to contributors.
- Self-hosting is a first-class concern for all core features.
- Optional hosted-only enhancements are allowed, but must remain clearly optional and not degrade the self-hosted experience.
- Do not add unnecessary personal-data collection at any layer.

## Development Workflow and Quality Gates

- All work MUST begin with a written specification before implementation.
- Features MUST be delivered as independent user-story slices.
- Tests for acceptance criteria MUST be written before implementation.
- A feature is not done until:
	- Automated acceptance coverage exists
	- Accessibility is checked at a basic level
	- Relevant observability (logging/monitoring) is added
	- Documentation and quickstart are updated when behavior changes

## Governance

This is the initial constitution for the Choreography project. Amendments are approved by the project maintainer and MUST include a written rationale. Constitution changes use semantic versioning:
- MAJOR: Principle removals or breaking governance changes
- MINOR: New principles or materially expanded requirements
- PATCH: Clarifications and wording-only refinements

This constitution supersedes all other practices. All PRs and reviews must verify compliance with these principles and gates.

<<<<<<< HEAD
**Version**: 1.1.0 | **Ratified**: 2026-04-08 | **Last Amended**: 2026-04-09
=======
**Version**: 1.2.0 | **Ratified**: 2026-04-08 | **Last Amended**: 2026-04-13
>>>>>>> 02a1f75a38ed4ce7af6e811f88469eb69fc19c6a
