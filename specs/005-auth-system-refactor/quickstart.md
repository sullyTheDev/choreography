# Quickstart: Authentication System Refactor (better-auth)

## Goal

Run the refactored authentication stack locally using existing SvelteKit + Drizzle + SQLite infrastructure, with local auth and optional generic OIDC.

## 1. Install dependencies

```bash
npm install
npm install better-auth
```

## 2. Configure environment

Start from existing environment file:

```bash
cp .env.example .env
```

Required/updated auth settings:

- `BETTER_AUTH_SECRET` (required, 32+ chars)
- `AUTH_MODE` (`local`, `oidc`, `both`; default `local`)
- `OIDC_ISSUER` (required when OIDC is enabled)
- `OIDC_ACCOUNT_CLAIM` (default `email`)
- `OIDC_CLIENT_ID` (required when OIDC is enabled)
- `OIDC_CLIENT_SECRET` (required when OIDC is enabled)
- `OIDC_ISSUER_LABEL` (default `Single Sign-On`)
- `OIDC_ZERO_MATCH_POLICY` (`deny` or `provision`; default `deny`)

Keep existing values:

- `DATABASE_URL` (reuse existing DB)
- `ORIGIN`
- `PORT`
- `LOG_LEVEL`

## 3. Create auth modules and route

Implementation adds:

- `src/lib/auth.ts` (server-side `betterAuth()` setup)
- `src/lib/auth-client.ts` (Svelte client integration via `better-auth/svelte`)
- `src/routes/api/auth/[...all]/+server.ts` (auth endpoint handler)

## 4. Apply auth migrations

Use project migration flow, then run better-auth migration as required by feature design:

```bash
npm run db:migrate
npx auth migrate
```

Notes:

- Do not initialize a new database. Use existing `DATABASE_URL`.
- Ensure migration metadata/journal entries are updated when adding SQL migration files.

## 5. Run the app

```bash
npm run dev
```

Open `/login` and verify mode rendering:

- `AUTH_MODE=local`: local email/password form only
- `AUTH_MODE=oidc`: OIDC button only
- `AUTH_MODE=both`: OIDC button first, divider, then local form

## 6. Validate critical behavior

### Local

- Valid local credentials sign in successfully.
- Invalid local credentials stay on login with clear error.

### OIDC

- Valid OIDC configuration allows provider sign-in.
- Missing claim denies login with missing-claim error.
- Ambiguous local matches deny login with admin-action-required error.
- Zero local match follows `OIDC_ZERO_MATCH_POLICY` (`deny` blocks with guidance, `provision` creates auth user/account mapping).

### Mixed mode (`both`)

- If OIDC config invalid, OIDC entry is suppressed and local login remains available.
- Structured config error logs are emitted for DevOps troubleshooting.

## 7. Run test suites

```bash
npm test
npm run test:e2e
npm run lint
```

## 8. UI compliance

All login UI components use **Skeleton v4** (`@skeletonlabs/skeleton-svelte`) + **Tailwind CSS v4**.
No Flowbite, DaisyUI, or custom CSS is used for auth-related UI elements.

## 9. Integration test summary (post-refactor)

All 90 integration tests pass after migration to better-auth:

- `auth-local.test.ts`: 7 tests — local login load, actions, and AUTH_MODE fallback (T013/T042)
- `auth-oidc.test.ts`: 13 tests — OIDC mode flags, claim matching, error surfacing (T020/T022/T028-T030/T034/T038/T044/T047/T050)
- `auth-session-guards.test.ts`: 6 tests — session guard regressions for unauthenticated and role-based access (T039)
- All pre-existing integration tests: 64 tests — unchanged

Run the full integration suite:

```bash
npx vitest run tests/integration/
```
