# Quickstart: Decoupled Signup + Onboarding Family Creation

## Goal

Validate end-to-end behavior where account signup is independent from family creation, and new users are routed into onboarding before entering family-scoped app routes.

## 1. Install and prepare

```bash
npm install
cp .env.example .env
```

Set at minimum:
- `BETTER_AUTH_SECRET`
- `DATABASE_URL`
- `ORIGIN`

## 2. Apply migrations and run app

```bash
npm run db:migrate
npm run dev
```

## 3. Validate decoupled signup flow

1. Visit `/signup`.
2. Create a new account using email/password (+ display name).
3. Confirm signup success redirects to `/onboarding`.
4. Confirm no family-scoped page is rendered before onboarding is completed.

## 4. Validate independent family creation

1. From `/onboarding`, submit family creation form.
2. Confirm family is created and user is inserted into `family_members` with `admin` role.
3. Confirm redirect to primary admin experience (for example `/admin/family?new=1`).

## 5. Validate routing guards

- Authenticated user with no family:
  - Accessing `/admin/*` or `/member/*` redirects to `/onboarding`.
- Authenticated user with family:
  - Accessing `/onboarding` redirects to normal app destination.
- Unauthenticated user:
  - Accessing onboarding or app routes redirects to `/login`.

## 6. Validate observability

Ensure structured logs emit:
- `onboarding_required`
- `family_created_from_onboarding`
- `family_create_failed` (by forcing an invalid family creation request)

## 7. Run verification suites

```bash
npm test
npm run test:e2e
npm run lint
```

## 8. UI compliance check

Signup and onboarding UI must use Skeleton v4 components/styles with Tailwind utilities only.
