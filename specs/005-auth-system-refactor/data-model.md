# Data Model: Authentication System Refactor

## Overview

This feature introduces a dedicated authentication layer using `better-auth` while preserving existing family-domain entities. The model adds canonical auth entities and defines how they relate to existing household members.

## Entities

### 1. Auth User

- Purpose: Canonical identity record managed by `better-auth` for an application user.
- Key fields:
  - `id` (string, primary key)
  - `email` (string, nullable for non-email identities depending on provider)
  - `emailVerified` (boolean)
  - `name` (string, optional display label)
  - `image` (string, optional)
  - `createdAt`, `updatedAt` (timestamps)
- Validation rules:
  - Email, when present, should be normalized to lowercase and trimmed.
  - IDs are immutable.
- Relationships:
  - One-to-many with Auth Account
  - One-to-many with Auth Session
  - One-to-one/optional mapping to existing Member for continuity in current app domain.

### 2. Auth Session

- Purpose: Persistent authenticated session managed by `better-auth`.
- Key fields:
  - `id` (string, primary key)
  - `userId` (foreign key -> Auth User)
  - `expiresAt` (timestamp)
  - `ipAddress`, `userAgent` (optional metadata)
  - `createdAt`, `updatedAt` (timestamps)
- Validation rules:
  - Session must reference an existing Auth User.
  - Expired sessions are not accepted for authorization.
- Relationships:
  - Many-to-one with Auth User.

### 3. Auth Account

- Purpose: External or credential-based login identity linked to an Auth User.
- Key fields:
  - `id` (string, primary key)
  - `userId` (foreign key -> Auth User)
  - `providerId` (string; e.g., `oidc` or local-credential provider id)
  - `accountId` (string; provider subject/claim identity)
  - `accessToken`, `refreshToken`, `idToken` (optional, if stored by provider flow)
  - `createdAt`, `updatedAt` (timestamps)
- Validation rules:
  - (`providerId`, `accountId`) must be unique.
  - Account must reference an existing Auth User.
- Relationships:
  - Many-to-one with Auth User.

### 4. Verification/Credential Support Entities (if required by better-auth)

- Purpose: Support password/email verification and recovery semantics depending on enabled plugins.
- Expected fields: token/value + expiry + identifier references.
- Validation rules:
  - Tokens must expire and be single-use where applicable.
- Relationships:
  - Reference Auth User or identifier fields based on plugin requirements.

### 5. Member (Existing Domain Entity)

- Purpose: Existing family-domain user profile used by chores, prizes, assignments, and role logic.
- Key fields currently include:
  - `id`, `displayName`, `email`, `passwordHash`, `pin`, `isActive`, `createdAt`
- Feature-specific role in migration:
  - Remains source of family membership and app-domain behavior.
  - Local email identities are matched for first-time OIDC account linking by normalized claim value.
- Relationship updates:
  - Add deterministic mapping approach between Auth User and Member (direct FK or stable lookup mapping) during implementation design.

## Relationship Summary

- Auth User 1 -> N Auth Session
- Auth User 1 -> N Auth Account
- Auth User 1 -> 0..1 Member mapping (implementation detail chosen in code/migration)
- Member N -> N Families (existing `family_members` join remains unchanged)

## State Transitions

### Sign-In State

1. Unauthenticated
2. Authenticated session created (local or OIDC)
3. Session refreshed/continued until expiry
4. Signed out or expired -> returns to unauthenticated

### OIDC First-Login Linking State

1. OIDC callback received with configured claim
2. Claim normalized (trim + case-fold)
3. Match local identifier:
   - Exactly one match -> create/link Auth Account to existing user mapping
   - Zero matches -> create new auth user per policy (if allowed by implementation scope)
   - Multiple matches -> deny login and emit admin-action-required error
4. Session creation only after successful link decision

## Data Integrity Rules

- No duplicate (`providerId`, `accountId`) auth accounts.
- No auth session without a valid auth user.
- Missing configured OIDC claim always hard-fails sign-in (no partial account creation).
- Ambiguous local matches always hard-fail sign-in (no auto-linking).
