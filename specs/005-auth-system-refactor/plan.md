# Implementation Plan: Signup/Family Decoupling + Onboarding Routing

**Branch**: `copilot/break-out-user-signup-family-creation` | **Date**: 2026-04-25 | **Spec**: `specs/005-auth-system-refactor/spec.md`  
**Input**: Existing feature context for splitting user signup from family creation and routing newly created users into onboarding.

## Summary

Decouple account signup from family creation so users can register independently, create or join a family later, and be routed into onboarding immediately after first account creation/sign-in when no family membership exists. The implementation reuses the current SvelteKit + better-auth + Drizzle stack, introduces onboarding-aware session/route behavior, and preserves existing family workflows after membership is established.

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js 20+ with SvelteKit 2 / Svelte 5  
**Primary Dependencies**: `@sveltejs/kit`, `better-auth`, `drizzle-orm`, `@libsql/client`, `@skeletonlabs/skeleton(-svelte)`, `pino`  
**Storage**: SQLite/libsql via Drizzle schema (`user`, `families`, `family_members`, related domain tables)  
**Testing**: Vitest integration tests + Playwright e2e tests + `svelte-check`  
**Target Platform**: Self-hosted Linux/containerized Node runtime  
**Project Type**: Single SvelteKit web application  
**Performance Goals**: Maintain current interactive UX expectations (auth/onboarding route loads in normal local-dev timings; no added blocking network round-trips beyond existing server actions)  
**Constraints**: Preserve better-auth as canonical auth engine; preserve self-hostability; keep Skeleton v4 UI compliance; maintain backward compatibility for existing family-backed sessions  
**Scale/Scope**: Single feature slice across auth/onboarding routes, DB associations, and tests for first-run onboarding + independent family creation flows

## Constitution Check (Pre-Design Gate)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Family-Centered Product Slices**: PASS — user outcome is clearer account creation and smoother family setup flow.
- **II. Self-Hostable and Open by Default**: PASS — no hosted dependency added; current runtime/env model remains.
- **III. Privacy and Parent Control First**: PASS — no new personal-data collection; only existing signup/profile fields.
- **IV. Test-First, Correct, Accessible Delivery**: PASS (planning) — plan includes integration/e2e updates for decoupled signup/onboarding behavior.
- **V. Observable Simplicity**: PASS — changes stay in existing app boundaries; structured logging will cover onboarding/family creation failures.
- **VI. Skeleton UI System First**: PASS — onboarding/signup UI updates remain within Skeleton + Tailwind conventions.

No constitutional violations identified; complexity tracking not required.

## Phase 0: Research Output Summary

Research completed in `research.md` and resolves all planning unknowns:
- Session semantics when user has no family membership
- Decoupled signup write-path and transaction boundaries
- Onboarding routing contract for new users
- Family creation API/action ownership and idempotency expectations
- Test strategy for split-signup and post-signup onboarding paths

## Phase 1: Design & Contracts Output Summary

- Data model defined in `data-model.md` for account-first onboarding and family membership lifecycle.
- Interface contracts defined in `contracts/auth-contracts.md` for signup, onboarding routing, and independent family creation.
- Operator/developer execution path documented in `quickstart.md`.
- Agent context refresh executed via `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`.

## Constitution Check (Post-Design Re-Check)

- **I. Family-Centered Product Slices**: PASS — design keeps onboarding and family setup directly tied to family admin workflow.
- **II. Self-Hostable and Open by Default**: PASS — no external managed service introduced.
- **III. Privacy and Parent Control First**: PASS — no expansion of data capture or third-party transmission.
- **IV. Test-First, Correct, Accessible Delivery**: PASS — contracts and quickstart explicitly require integration/e2e and accessibility checks for onboarding paths.
- **V. Observable Simplicity**: PASS — minimal schema/routing evolution with explicit logging points.
- **VI. Skeleton UI System First**: PASS — UI contract remains Skeleton-first.

Post-design gates remain clear with no unresolved constitutional risks.

## Project Structure

### Documentation (this feature)

```text
specs/005-auth-system-refactor/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-contracts.md
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── auth.ts
│   └── server/db/schema.ts
├── routes/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (app)/
│   │   ├── +layout.server.ts
│   │   └── admin/family/
│   └── onboarding/            # planned onboarding route entry for no-family users
└── hooks.server.ts

tests/
├── integration/
└── e2e/
```

**Structure Decision**: Keep the existing single-project SvelteKit structure and add onboarding flow behavior in current auth/app route groups, avoiding new services or packages.
