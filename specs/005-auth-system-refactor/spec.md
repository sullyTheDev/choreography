# Feature Specification: Authentication System Refactor (Local + Generic OIDC)

**Feature Branch**: `005-auth-system-refactor`  
**Created**: 2026-04-17  
**Status**: Draft  
**Input**: User description: "Feature Specification: Authentication System Refactor (Local + Generic OIDC)"

## Clarifications

### Session 2026-04-17

- Q: How should OIDC linking behave when the configured account claim matches multiple local users? -> A: Fail linking, deny login for this attempt, and show an admin-action-required error.
- Q: How should sign-in behave when the configured OIDC account claim is missing in the provider response? -> A: Deny login and show a missing-claim configuration error.
- Q: In both mode, what should happen if OIDC configuration is missing or invalid? -> A: Show only local login in UI and log an extensive OIDC configuration error for DevOps visibility.
- Q: How should account-claim matching be normalized for OIDC-to-local account linking? -> A: Use exact match after trimming whitespace and case-folding.
- Q: How should first-time OIDC sign-in behave when no local user matches the normalized account claim? -> A: Use a configuration-driven policy with `OIDC_ZERO_MATCH_POLICY` (`deny` or `provision`), defaulting to `deny`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Local Sign-In Flow (Priority: P1)

As a self-hosted household admin, I can sign in with email and password when local authentication is enabled so I can access the app without an external identity provider.

**Why this priority**: Local sign-in is the default mode and must remain available for self-hosted deployments that do not use single sign-on.

**Independent Test**: Set authentication mode to local, open the login page, sign in with valid local credentials, and confirm access to authenticated app routes.

**Acceptance Scenarios**:

1. **Given** authentication mode is set to local, **When** a user opens the login page, **Then** the page shows email and password inputs with a Sign In action.
2. **Given** authentication mode is set to local and credentials are valid, **When** the user submits the form, **Then** the user is authenticated and redirected to the post-login experience.
3. **Given** authentication mode is set to local and credentials are invalid, **When** the user submits the form, **Then** the user remains on the login page and sees an authentication failure message.

---

### User Story 2 - OIDC Sign-In Flow (Priority: P1)

As a self-hosted household admin, I can sign in through a generic OIDC identity provider when OIDC mode is enabled so I can reuse my existing identity platform.

**Why this priority**: OIDC support is a core objective of this refactor and enables integration with common self-hosted identity systems.

**Independent Test**: Set authentication mode to OIDC with valid provider settings, open the login page, start sign-in via the provider button, complete authentication, and confirm successful app access.

**Acceptance Scenarios**:

1. **Given** authentication mode is set to OIDC, **When** a user opens the login page, **Then** the page shows a single sign-in button labeled with the configured provider display name and no password inputs.
2. **Given** authentication mode is set to OIDC and provider settings are valid, **When** the user completes provider authentication, **Then** the user is authenticated and redirected to the post-login experience.
3. **Given** authentication mode is set to OIDC but required provider settings are incomplete, **When** the user opens the login page, **Then** the OIDC sign-in action is unavailable and the page explains that sign-in is not configured.

---

### User Story 3 - Hybrid Sign-In and Account Linking (Priority: P2)

As a household admin migrating from local sign-in to OIDC, I can use either method and have matching identities linked to a single account so I do not lose history or create duplicate users.

**Why this priority**: Mixed-mode login and automatic identity linking are essential for safe migration and testability in self-hosted environments.

**Independent Test**: Enable both modes, verify the login page shows OIDC first with a divider and local form below, then sign in via OIDC using an identifier that matches an existing local user and confirm no duplicate user is created.

**Acceptance Scenarios**:

1. **Given** authentication mode is set to both, **When** a user opens the login page, **Then** the page shows the OIDC button first, followed by a divider, then the local email/password form.
2. **Given** a local user already exists and an OIDC sign-in returns a matching account claim, **When** the user signs in through OIDC for the first time, **Then** the external identity is linked to the existing user account.
3. **Given** a local user already exists and an OIDC sign-in returns a matching account claim, **When** linking completes, **Then** the system does not create a duplicate user record and the user can access existing household data.

---

### Edge Cases

- Authentication mode is set to an unsupported value; the system falls back to local mode behavior.
- Authentication mode is OIDC-only but OIDC settings are missing or invalid.
- Authentication mode is both and OIDC settings are missing or invalid; OIDC entry is not shown in the login UI, local login remains available, and a detailed configuration error is logged for DevOps.
- OIDC sign-in response does not include the configured account claim; login is denied and a missing-claim configuration error is shown.
- The configured account claim maps to multiple existing local users due to legacy data quality issues; login is denied and an admin-action-required error is shown.
- OIDC claim values differ only by letter case or surrounding whitespace; they are treated as the same identifier for linking decisions.
- First-time OIDC sign-in has zero local matches for the normalized claim; behavior is controlled by `OIDC_ZERO_MATCH_POLICY`.
- A previously linked OIDC identity attempts sign-in after local credentials were changed.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support three authentication modes controlled by configuration: local, OIDC, and both, with local as the default when no mode is provided.
- **FR-002**: System MUST drive login page rendering from authentication mode configuration at runtime.
- **FR-003**: In local mode, system MUST display only email/password sign-in controls and a Sign In action.
- **FR-004**: In OIDC mode, system MUST display only a single OIDC sign-in button labeled with the configured provider display name.
- **FR-005**: In both mode, system MUST display the OIDC sign-in button before local sign-in controls, separated by a clear visual divider.
- **FR-006**: System MUST allow administrators to configure OIDC issuer URL, client ID, client secret, account-claim key, and provider display label through environment configuration.
- **FR-007**: System MUST use email as the default account-claim key when no account-claim key is configured.
- **FR-008**: System MUST use "Single Sign-On" as the default provider display label when no provider display label is configured.
- **FR-009**: On first successful OIDC sign-in, system MUST extract the configured account claim from the identity response and use it as the external account identifier.
- **FR-010**: If first-time OIDC sign-in returns an account-claim value that matches an existing local user identifier after trimming whitespace and case-insensitive comparison, system MUST link the OIDC identity to that existing user account.
- **FR-011**: When an OIDC identity is linked to an existing local account, system MUST prevent duplicate user creation.
- **FR-012**: If required OIDC configuration is missing while authentication mode is OIDC, system MUST block login attempts and show a configuration guidance message.
- **FR-013**: System MUST maintain authenticated session continuity after successful sign-in from either local or OIDC flow.
- **FR-014**: System MUST replace legacy authentication/session behavior with one unified authentication engine to avoid conflicting authentication states.
- **FR-015**: System MUST support generic OIDC provider compatibility and MUST NOT require vendor-specific OAuth SDK integrations for this feature.
- **FR-016**: If the configured OIDC account claim matches multiple local user records, system MUST deny the OIDC login attempt, MUST NOT create or link any account, and MUST show an admin-action-required error message.
- **FR-017**: If a successful OIDC authentication response omits the configured account claim, system MUST deny login, MUST NOT create or link any account, and MUST show a missing-claim configuration error message.
- **FR-018**: If authentication mode is both and required OIDC configuration is missing or invalid, system MUST keep local login available, MUST suppress OIDC login UI actions for end users, and MUST emit a detailed configuration error log intended for DevOps troubleshooting.
- **FR-019**: System MUST support configuration-driven handling for first-time OIDC sign-in when no local user matches the normalized account claim via `OIDC_ZERO_MATCH_POLICY` with allowed values `deny` and `provision`.
- **FR-020**: If `OIDC_ZERO_MATCH_POLICY=deny` and no local match exists, system MUST deny login, MUST NOT create or link any account, and MUST show a configuration/policy guidance message.
- **FR-021**: If `OIDC_ZERO_MATCH_POLICY=provision` and no local match exists, system MUST create a new auth user/account mapping and complete sign-in without creating duplicate provider-account records.

### Key Entities *(include if feature involves data)*

- **User Account**: A person identity used to access the application, including local sign-in attributes and household membership context.
- **Authenticated Session**: The active sign-in state that ties an authenticated user account to subsequent authorized requests.
- **External Identity Link**: A mapping between a user account and an OIDC provider identity based on issuer and account-claim value.
- **Authentication Configuration**: Runtime settings that determine allowed sign-in methods and OIDC connection metadata.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In acceptance testing, 100% of deployments using local mode show only local sign-in controls on the login page.
- **SC-002**: In acceptance testing, 100% of deployments using OIDC mode show only one provider-labeled sign-in button and no password form.
- **SC-003**: In acceptance testing, 100% of deployments using both mode show OIDC sign-in first, divider second, and local form third.
- **SC-004**: In migration testing, at least 95% of first-time OIDC sign-ins with a matching existing local identifier link to the existing account without creating duplicates.
- **SC-005**: In user testing, at least 90% of users complete sign-in within 60 seconds in each enabled authentication mode.
- **SC-006**: In test runs where OIDC is misconfigured in both mode, 100% of login page loads keep local sign-in usable and produce at least one structured authentication-configuration error log entry for operators.
- **SC-007**: In test runs, 100% of first-time OIDC zero-match scenarios follow the configured `OIDC_ZERO_MATCH_POLICY` outcome (`deny` or `provision`) with matching user-facing behavior.

## Assumptions

- Existing user records contain a stable local identifier suitable for matching to the configured OIDC account claim.
- Login route behavior changes are limited to authentication presentation and flow; unrelated route content is out of scope.
- Households using OIDC mode will provide valid OIDC provider metadata and client credentials outside this feature.
- Data migration and cleanup for pre-existing duplicate local users is out of scope, except for preventing new duplicates during OIDC linking.
