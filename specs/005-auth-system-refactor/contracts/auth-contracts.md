# Contracts: Authentication Interfaces

## Scope

Defines runtime interface expectations for login UX, auth endpoints, session behavior, and failure handling for the better-auth migration.

## 1. Environment Configuration Contract

### Inputs

- `AUTH_MODE`: `local` | `oidc` | `both` (default `local`)
- `OIDC_ISSUER`: URL string
- `OIDC_ACCOUNT_CLAIM`: claim key string (default `email`)
- `OIDC_CLIENT_ID`: string
- `OIDC_CLIENT_SECRET`: string
- `OIDC_ISSUER_LABEL`: string (default `Single Sign-On`)
- `OIDC_ZERO_MATCH_POLICY`: `deny` | `provision` (default `deny`)
- `BETTER_AUTH_SECRET`: 32+ character secret

### Required combinations

- `AUTH_MODE=local`: only `BETTER_AUTH_SECRET` required for auth engine operation.
- `AUTH_MODE=oidc`: all OIDC vars required.
- `AUTH_MODE=both`: local remains available if OIDC vars are invalid/missing.
- `OIDC_ZERO_MATCH_POLICY=deny`: no local match on first OIDC sign-in denies login with guidance.
- `OIDC_ZERO_MATCH_POLICY=provision`: no local match on first OIDC sign-in provisions auth user/account and allows login.

## 2. Login UI Contract (`/login`)

### Local mode (`AUTH_MODE=local`)

- Must render local form fields (email + password).
- Must not render OIDC sign-in button.

### OIDC mode (`AUTH_MODE=oidc`)

- Must render single OIDC sign-in button labeled with `OIDC_ISSUER_LABEL`.
- Must not render local password form.
- If OIDC config invalid, sign-in must be blocked with guidance message.

### Both mode (`AUTH_MODE=both`)

- Must render OIDC button first, then divider, then local form.
- If OIDC config invalid/missing, OIDC entry is hidden/disabled per UX decision and local form remains usable.

## 3. Auth API Route Contract

### Route

- `GET/POST /api/auth/[...all]`

### Behavior

- All auth lifecycle traffic (signin/signup/callback/signout/session) is handled by `better-auth` route handler.
- Existing app routes must rely on resolved auth session state from this single source.

## 4. OIDC Account Linking Contract

### Inputs

- OIDC callback payload including configured `OIDC_ACCOUNT_CLAIM`.

### Normalization

- Claim comparison for local linking must apply:
  - trim surrounding whitespace
  - case-insensitive comparison

### Outcomes

- Exactly one local match: link identity to existing user.
- Zero local matches: apply `OIDC_ZERO_MATCH_POLICY` (`deny` -> block with guidance, `provision` -> create auth user/account mapping).
- No claim present: deny login with missing-claim configuration error.
- Multiple local matches: deny login with admin-action-required error.
- In all deny cases above: no account creation and no linking side effects.

## 5. Session and Guard Contract

### Session source

- Authenticated session is provided by `better-auth` only.
- Legacy cookie-token table/session validation logic is removed.

### Route protection

- Authenticated route groups continue to redirect unauthenticated users to `/login`.
- Admin-only routes continue to enforce role checks.

## 6. Observability Contract

### Required structured log events

- `auth_oidc_config_invalid`
- `auth_oidc_claim_missing`
- `auth_oidc_link_ambiguous`

### Required fields (non-secret)

- `authMode`
- `issuer` (if configured)
- `claimKey`
- `path`
- `requestId` (or equivalent correlation key if available)
- `reason`

### Security rules

- Never log client secret, access tokens, refresh tokens, or raw ID tokens.
