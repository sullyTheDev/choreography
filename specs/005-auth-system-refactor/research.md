# Research: Signup/Family Decoupling and Onboarding Routing

## Decision 1: Make signup account-only (no implicit family creation)

- Decision: Convert signup into pure user-account creation and authentication bootstrap, removing direct family row creation from the signup transaction.
- Rationale: This cleanly separates identity creation from household setup, enabling independent signup and future join/create flows.
- Alternatives considered:
  - Keep signup coupled to family creation with optional skip. Rejected because it preserves mixed responsibilities and increases edge-case branching.
  - Add a second signup endpoint while retaining legacy path. Rejected due to duplicate UX and maintenance overhead.

## Decision 2: Route authenticated users without family membership to onboarding

- Decision: Add a guard path that redirects newly authenticated users with no `family_members` row to `/onboarding` until they create or join a family.
- Rationale: Centralized onboarding routing prevents broken assumptions in app layouts that currently expect `session.familyId` to exist.
- Alternatives considered:
  - Scatter null-family checks across all app pages. Rejected because it is brittle and error-prone.
  - Redirect to `/admin/family` directly. Rejected because that route currently assumes existing family context and is not an onboarding shell.

## Decision 3: Introduce explicit onboarding state derived from membership

- Decision: Model onboarding completion as a derived state: `hasFamilyMembership` = true when user has at least one family membership.
- Rationale: Avoids new persistence unless needed; membership is the source of truth and keeps schema changes minimal.
- Alternatives considered:
  - Persist separate onboarding status table. Rejected for added complexity and risk of state drift.
  - Infer completion from first admin action. Rejected because family setup should be the explicit completion boundary.

## Decision 4: Keep family creation as authenticated onboarding action

- Decision: Move family creation responsibility to onboarding action/API reachable only by authenticated users, then attach creator as admin in `family_members`.
- Rationale: Maintains existing security and ownership semantics while supporting independent family creation timing.
- Alternatives considered:
  - Allow anonymous family creation before auth. Rejected due to abuse risk and orphaned data potential.
  - Background auto-create default family post-signup. Rejected because it violates independent creation goal.

## Decision 5: Preserve better-auth as canonical identity/session engine

- Decision: Continue using `better-auth` for signup/login/session and only adjust domain-layer linkage behavior.
- Rationale: Aligns with constitutional auth constraint and avoids reworking stable auth internals.
- Alternatives considered:
  - Custom temporary pre-family session system. Rejected because it duplicates existing auth/session capabilities.

## Decision 6: Add observability around onboarding and family provisioning

- Decision: Emit structured events for onboarding redirect decisions and family-creation outcomes (`onboarding_required`, `family_created_from_onboarding`, `family_create_failed`).
- Rationale: Family creation is a high-impact flow and requires operator visibility per Constitution Principle V.
- Alternatives considered:
  - No dedicated logs. Rejected due to weak diagnosis for failed first-run experiences.
