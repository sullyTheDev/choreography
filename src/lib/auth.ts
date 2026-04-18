/**
 * Better Auth server bootstrap module.
 *
 * Configures authentication mode (local / oidc / both), generic OIDC
 * provider, and account-linking behaviour per the contract in
 * specs/005-auth-system-refactor/contracts/auth-contracts.md.
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { genericOAuth } from 'better-auth/plugins/generic-oauth';
import { pinAuth } from '$lib/plugins/pin-auth.js';
import type { OAuth2Tokens, OAuth2UserInfo } from '@better-auth/core/oauth2';
import { db } from '$lib/server/db/index.js';
import { authUser, authSession, authAccount, authVerification } from '$lib/server/db/schema.js';
import { logger } from '$lib/server/logger.js';
import { hashPassword, verifyPassword } from '$lib/server/auth.js';
import { eq } from 'drizzle-orm';

// Runtime configuration

const rawMode = process.env.AUTH_MODE ?? 'local';

/** Active auth mode; falls back to 'local' for unsupported values (FR-001, T043). */
export const AUTH_MODE: 'local' | 'oidc' | 'both' = (['local', 'oidc', 'both'] as const).includes(
    rawMode as 'local' | 'oidc' | 'both'
)
    ? (rawMode as 'local' | 'oidc' | 'both')
    : 'local';

export const OIDC_ISSUER = process.env.OIDC_ISSUER ?? '';
export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID ?? '';
export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET ?? '';
export const OIDC_ACCOUNT_CLAIM = process.env.OIDC_ACCOUNT_CLAIM ?? 'email';
export const OIDC_ISSUER_LABEL = process.env.OIDC_ISSUER_LABEL ?? 'Single Sign-On';
export const OIDC_ZERO_MATCH_POLICY: 'deny' | 'provision' =
    process.env.OIDC_ZERO_MATCH_POLICY === 'provision' ? 'provision' : 'deny';

/** True when all required OIDC env vars are present. */
export const oidcConfigValid = !!(OIDC_ISSUER && OIDC_CLIENT_ID && OIDC_CLIENT_SECRET);

// Shared log context helpers

function oidcLogCtx() {
    return {
        authMode: AUTH_MODE,
        issuer: OIDC_ISSUER || undefined,
        claimKey: OIDC_ACCOUNT_CLAIM
    };
}

// Log OIDC config warning at startup when mode needs OIDC but config invalid

if ((AUTH_MODE === 'oidc' || AUTH_MODE === 'both') && !oidcConfigValid) {
    logger.error(
        {
            ...oidcLogCtx(),
            reason: 'OIDC_ISSUER, OIDC_CLIENT_ID, or OIDC_CLIENT_SECRET not set'
        },
        'auth_oidc_config_invalid'
    );
}

// OIDC account-linking helpers

/**
 * Normalise a claim value for deterministic local-member matching:
 * trim whitespace and case-fold to lower-case (FR-010).
 */
export function normalizeClaim(value: string): string {
    return value.trim().toLowerCase();
}

/**
 * Look up the local member whose email matches the normalised OIDC claim.
 * Returns:
 *   - the member record when exactly one match is found
 *   - null   when zero matches (zero-match policy applies)
 *   - 'ambiguous' when multiple matches are found (hard-fail)
 */
export async function findMemberByClaim(
    claimValue: string
): Promise<{ id: string; displayName: string; email: string | null } | null | 'ambiguous'> {
    const normalised = normalizeClaim(claimValue);
    const rows = await db
        .select({ id: authUser.id, displayName: authUser.name, email: authUser.email })
        .from(authUser)
        .where(eq(authUser.email, normalised));

    if (rows.length === 0) return null;
    if (rows.length > 1) return 'ambiguous';
    return rows[0];
}

// Lazy cache for OIDC userinfo endpoint URL (discovered from issuer)
let _oidcUserInfoEndpoint: string | null = null;

async function getOidcUserInfoEndpoint(): Promise<string> {
    if (_oidcUserInfoEndpoint) return _oidcUserInfoEndpoint;
    const resp = await fetch(`${OIDC_ISSUER}/.well-known/openid-configuration`);
    if (!resp.ok) throw new Error(`OIDC discovery failed: ${resp.status}`);
    const doc = (await resp.json()) as Record<string, unknown>;
    _oidcUserInfoEndpoint = String(doc.userinfo_endpoint);
    return _oidcUserInfoEndpoint;
}

/**
 * Custom getUserInfo for the OIDC provider.
 * Fetches userinfo, validates the configured claim, enforces linking rules,
 * and returns OAuth2UserInfo or null (which blocks sign-in).
 */
async function oidcGetUserInfo(tokens: OAuth2Tokens): Promise<OAuth2UserInfo | null> {
    let userInfoUrl: string;
    try {
        userInfoUrl = await getOidcUserInfoEndpoint();
    } catch (err) {
        logger.error({ ...oidcLogCtx(), err }, 'auth_oidc_discovery_failed');
        return null;
    }

    let userinfo: Record<string, unknown>;
    try {
        const resp = await fetch(userInfoUrl, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` }
        });
        if (!resp.ok) {
            logger.error({ ...oidcLogCtx(), status: resp.status }, 'auth_oidc_userinfo_fetch_failed');
            return null;
        }
        userinfo = (await resp.json()) as Record<string, unknown>;
    } catch (err) {
        logger.error({ ...oidcLogCtx(), err }, 'auth_oidc_userinfo_fetch_failed');
        return null;
    }

    const rawClaim = userinfo[OIDC_ACCOUNT_CLAIM];

    // FR-017: missing claim
    if (rawClaim === undefined || rawClaim === null || rawClaim === '') {
        logger.error(
            { ...oidcLogCtx(), reason: 'configured claim absent from provider response' },
            'auth_oidc_claim_missing'
        );
        return null;
    }

    const claimStr = String(rawClaim);
    const localMatch = await findMemberByClaim(claimStr);

    if (localMatch === 'ambiguous') {
        // FR-016: multiple matches
        logger.error(
            { ...oidcLogCtx(), reason: 'claim matched multiple local members' },
            'auth_oidc_link_ambiguous'
        );
        return null;
    }

    if (localMatch === null) {
        // FR-019/FR-020/FR-021: zero matches
        if (OIDC_ZERO_MATCH_POLICY === 'deny') {
            logger.warn({ ...oidcLogCtx() }, 'auth_oidc_zero_match_deny');
            return null;
        }
        // provision: allow better-auth to create a new user
        const email = normalizeClaim(claimStr);
        return {
            id: String(userinfo.sub ?? email),
            email,
            emailVerified: true,
            name: String(userinfo.name ?? email)
        };
    }

    // Exactly one match: link to existing member email identity (FR-010/FR-011)
    const email = normalizeClaim(claimStr);
    return {
        id: String(userinfo.sub ?? email),
        email,
        emailVerified: true,
        name: localMatch.displayName
    };
}

// Generic OIDC plugin

const plugins: ReturnType<typeof genericOAuth>[] = [];

if (oidcConfigValid && (AUTH_MODE === 'oidc' || AUTH_MODE === 'both')) {
    plugins.push(
        genericOAuth({
            config: [
                {
                    providerId: 'oidc',
                    discoveryUrl: `${OIDC_ISSUER}/.well-known/openid-configuration`,
                    issuer: OIDC_ISSUER,
                    clientId: OIDC_CLIENT_ID,
                    clientSecret: OIDC_CLIENT_SECRET,
                    scopes: ['openid', 'email', 'profile'],
                    getUserInfo: oidcGetUserInfo
                }
            ]
        })
    );
}

// Auth instance

export const auth = betterAuth({
    baseURL: process.env.ORIGIN,
    database: drizzleAdapter(db, {
        provider: 'sqlite',
        schema: {
            user: authUser,
            session: authSession,
            account: authAccount,
            verification: authVerification
        }
    }),

    emailAndPassword: {
        enabled: AUTH_MODE === 'local' || AUTH_MODE === 'both',
        // Keep bcrypt compatibility with pre-better-auth credentials/backfills.
        password: {
            hash: hashPassword,
            verify: ({ hash, password }) => verifyPassword(password, hash)
        }
    },

    plugins: [...plugins, pinAuth()] as Parameters<typeof betterAuth>[0]['plugins'],

    onAPIError: {
        // Redirect OIDC callback errors back to /login so the page can surface them (T046/T049)
        errorURL: '/login'
    },

    secret: process.env.BETTER_AUTH_SECRET
});

export type AuthSession = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;