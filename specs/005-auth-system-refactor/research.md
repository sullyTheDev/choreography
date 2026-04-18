# Research: Authentication System Refactor (Local + Generic OIDC)

## Decision 1: Use better-auth as the single auth/session engine

- Decision: Replace custom auth/session logic with `better-auth` as the only authentication authority for sign-in, callback handling, and session lifecycle.
- Rationale: The current stack spreads auth concerns across custom hashing/session helpers, route actions, cookie handling, and hook-based validation. Consolidating into one engine reduces drift, improves maintainability, and aligns with the feature requirement to fully remove legacy session middleware.
- Alternatives considered:
  - Keep legacy session management and add OIDC beside it. Rejected because it creates dual session truth and violates FR-014.
  - Build a new in-house auth manager around current code. Rejected because it repeats solved auth-engine concerns and increases long-term risk.

## Decision 2: Reuse existing Drizzle/libsql database connection

- Decision: Configure `better-auth` against the existing Drizzle/libsql database (`DATABASE_URL`) and existing migration workflow.
- Rationale: This preserves current deployment assumptions, keeps self-hosting simple, avoids split persistence, and satisfies the explicit requirement not to stand up a new database.
- Alternatives considered:
  - Separate auth database. Rejected because it adds operational burden and synchronization complexity.
  - In-memory auth/session state. Rejected because persistent sessions and multi-process deployment require durable storage.

## Decision 3: Add better-auth tables via Drizzle migration and keep domain tables

- Decision: Introduce/align `users`, `sessions`, and `accounts` auth tables (plus any required supporting auth tables), while retaining current family/chore/prize domain tables.
- Rationale: `better-auth` needs canonical auth tables, but family workflow data should remain stable. A migration/backfill path can preserve existing user continuity and avoid duplicate records.
- Alternatives considered:
  - Replace existing domain `members` table with auth-native shape immediately. Rejected for this feature because it broadens risk and touches unrelated domain logic.
  - Keep existing `sessions` table unchanged and map it directly. Rejected due to mismatch with better-auth lifecycle expectations.

## Decision 4: Mode-driven login behavior from environment configuration

- Decision: Implement runtime UI/flow behavior controlled by `AUTH_MODE` with defaults and supporting OIDC env vars (`OIDC_ISSUER`, `OIDC_ACCOUNT_CLAIM`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_ISSUER_LABEL`).
- Rationale: This enables self-hosters to choose local-only, OIDC-only, or mixed operation without code edits and directly satisfies FR-001 through FR-008.
- Alternatives considered:
  - Build-time mode toggles. Rejected because self-hosted operators need runtime configurability.
  - Hardcode provider naming and claim. Rejected because the feature requires generic/white-label OIDC support.

## Decision 5: Deterministic account linking and failure policy

- Decision: For first-time OIDC sign-in, normalize configured claim values by trim + case-folding before matching local user identifiers. Link only when there is exactly one match. Deny login when claim is missing or ambiguous.
- Rationale: This directly applies approved clarifications and prevents accidental account takeover or duplicate user creation.
- Alternatives considered:
  - Fuzzy matching or alias expansion. Rejected because behavior becomes non-deterministic and increases collision risk.
  - Auto-link to oldest match in ambiguous cases. Rejected because it is unsafe and non-transparent.

## Decision 6: Misconfiguration handling differs by auth mode

- Decision: In `AUTH_MODE=oidc`, block sign-in with guidance when required OIDC settings are missing. In `AUTH_MODE=both`, suppress OIDC entry and keep local sign-in available.
- Rationale: This follows clarified requirements and prevents lockouts in mixed-mode deployments while preserving secure fail-closed behavior for OIDC-only deployments.
- Alternatives considered:
  - Disable all login in both mode if OIDC is broken. Rejected because it unnecessarily blocks local access.
  - Silently fallback to local without logs. Rejected because operators lose visibility into broken OIDC setup.

## Decision 7: Structured observability for auth configuration and linking failures

- Decision: Emit structured logs for OIDC misconfiguration, missing claim, and ambiguous claim matches with operator-useful context (mode, issuer, claim key, failure type, request correlation fields) while avoiding secrets.
- Rationale: Constitution Principle V requires observability for risky flows; auth misconfiguration has high operational impact.
- Alternatives considered:
  - User-only error messaging without logs. Rejected because DevOps cannot diagnose deployment issues quickly.
  - Verbose logs including credentials/tokens. Rejected for security reasons.

## Decision 8: Keep generic OIDC only

- Decision: Use only the generic OIDC capability of `better-auth`; do not add Google/GitHub/Auth0-specific SDKs.
- Rationale: Required by feature scope and keeps dependency surface minimal for self-hosters.
- Alternatives considered:
  - Provider-specific SDK packages. Rejected as out of scope.
