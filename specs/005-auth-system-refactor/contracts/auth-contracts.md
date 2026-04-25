# Contracts: Signup / Onboarding / Family-Creation Interfaces

## Scope

Defines contract behavior for decoupled account signup, onboarding routing, and independent family creation after signup.

## 1. Signup Contract (`/signup`)

### Request (form POST)

- Required inputs:
  - `email`
  - `password`
  - `displayName`
- Optional inputs:
  - `avatarEmoji`
  - `pin` (if current kiosk/member flow still uses it for admin profile)
- Not accepted in decoupled path:
  - `familyName` as required field during account creation

### Success behavior

- Creates auth user + credential account.
- Creates authenticated session.
- Does **not** create `families` or `family_members` records.
- Redirects to `/onboarding` for first-run family setup.

### Error behavior

- Duplicate email -> `409` with user-facing duplicate-account message.
- Validation failures -> `400` with field-level/summary guidance.

## 2. Onboarding Routing Contract

### Guard rules

- If unauthenticated user accesses onboarding-required pages -> redirect to `/login`.
- If authenticated user has zero memberships -> redirect to `/onboarding` when attempting app routes requiring family context.
- If authenticated user has at least one membership and visits `/onboarding` root -> redirect to default app destination.

## 3. Family Creation Contract (Onboarding Action/API)

### Request

- Authenticated user submits:
  - `familyName` (required)
  - optional family setup metadata if later needed

### Transactional behavior

- Create `families` row.
- Create `family_members` row linking current user as `admin`.
- Commit atomically (no partial family without membership).

### Response

- Success -> redirect to `/admin/family?new=1` (or equivalent first-admin landing page).
- Failure -> remain on onboarding with actionable error.

## 4. Session Shape and Compatibility Contract

- Session identity remains sourced from `better-auth`.
- Family context fields must be treated as nullable/derivable until membership exists.
- Any route requiring `familyId` must resolve membership first and redirect if absent.

## 5. UI Contract

- `/signup` presents account-creation-only copy and controls.
- `/onboarding` presents explicit next step to create/join family.
- All components remain Skeleton v4 + Tailwind based.

## 6. Observability Contract

### Required structured events

- `onboarding_required`
- `family_created_from_onboarding`
- `family_create_failed`

### Required metadata

- `userId`
- `path`
- `requestId` (or equivalent)
- `reason` (for failures)

### Security rules

- Never log passwords, secrets, or token material.
