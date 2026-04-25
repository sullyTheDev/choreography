# Data Model: Decoupled Signup, Onboarding, and Family Creation

## Overview

This model keeps identity/auth entities in `better-auth` and shifts family creation to an explicit onboarding step. A user can exist in the system without a family membership immediately after signup.

## Entities

### 1. Auth User (`user`)

- Purpose: Canonical signed-in identity.
- Key fields:
  - `id` (PK)
  - `email` (normalized, unique within credential provider behavior)
  - `name`
  - `avatarEmoji` (existing schema field for emoji/avatar representation)
  - `isActive`
  - `createdAt`, `updatedAt`
- Validation rules:
  - Email must be trimmed + lowercase before persistence checks.
  - `name` required for local signup flow.
- Relationships:
  - 1:N Auth Account
  - 1:N Auth Session
  - 0:N Family Membership

### 2. Family (`families`)

- Purpose: Household container for shared chores/prizes/settings.
- Key fields:
  - `id` (ULID)
  - `name`
  - `leaderboardResetDay`
  - `createdAt`
- Validation rules:
  - Name required and non-empty.
- Relationships:
  - 1:N Family Membership
  - 1:N Chores/Prizes/Activity domain data

### 3. Family Membership (`family_members`)

- Purpose: Join table linking users to families with role.
- Key fields:
  - `memberId` -> `user.id`
  - `familyId` -> `families.id`
  - `role` (`admin` | `member`)
  - `joinedAt`
- Validation rules:
  - Unique pair (`memberId`, `familyId`).
  - First family creator from onboarding is assigned `admin`.
- Relationships:
  - N:1 Auth User
  - N:1 Family

### 4. Onboarding Status (Derived)

- Purpose: Runtime state used for routing.
- Derived fields:
  - `hasFamilyMembership` (boolean)
  - `onboardingRequired` = authenticated AND `hasFamilyMembership=false`
- Validation rules:
  - Determined from `family_members` existence; no separate persistence required.

## Relationship Summary

- Auth User 1 -> N Auth Account
- Auth User 1 -> N Auth Session
- Auth User 1 -> 0..N Family Membership
- Family 1 -> N Family Membership

## State Transitions

### Account and Onboarding Lifecycle

1. Anonymous user submits signup form.
2. Auth User (+ auth account/session) is created.
3. Membership check:
   - No family membership -> redirect to onboarding.
   - Has family membership -> proceed to app routes.
4. Onboarding family creation:
   - Create family row.
   - Create family_members row with role `admin`.
   - Mark onboarding complete via derived membership state.
5. User lands on normal app home/admin destination.

### Existing User Sign-In

1. User signs in.
2. Membership check runs during route/session guard.
3. If membership missing, redirect to onboarding; otherwise continue normally.

## Data Integrity Rules

- No family should exist without at least one admin membership after successful onboarding completion transaction.
- No duplicate membership pairs (`memberId`, `familyId`).
- Signup must not create `families` rows directly.
- App routes that require `familyId` must gate or redirect before dereferencing family-dependent data.
