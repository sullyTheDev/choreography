import { fail, redirect } from '@sveltejs/kit';
import { auth, AUTH_MODE, oidcConfigValid, OIDC_ISSUER_LABEL } from '$lib/auth.js';
import { SESSION_COOKIE_NAME } from '$lib/server/auth.js';
import { logger } from '$lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types.js';

// ── Load ────────────────────────────────────────────────────────────────────

export const load: PageServerLoad = ({ locals, url }) => {
	// Redirect already-authenticated users (T019)
	if (locals.session) {
		redirect(302, locals.session.memberRole === 'admin' ? '/admin/chores' : '/chores');
	}

	// Expose auth-mode UI flags for the page (T015)
	const showOidc = (AUTH_MODE === 'oidc' || AUTH_MODE === 'both') && oidcConfigValid;
	const showLocalForm = AUTH_MODE === 'local' || AUTH_MODE === 'both';
	const oidcMisconfigured = (AUTH_MODE === 'oidc' || AUTH_MODE === 'both') && !oidcConfigValid;

	// Surface OIDC callback errors from better-auth error redirect (T046/T049)
	const rawOidcError = url.searchParams.get('error');
	// better-auth sends 'user_info_is_missing' to the redirect URL when the OIDC
	// zero-match-deny hook fires (user not registered in this family).
	const oidcError =
		rawOidcError === 'user_info_is_missing' || rawOidcError === 'OIDC_ZERO_MATCH_DENY'
			? 'OIDC_ZERO_MATCH_DENY'
			: rawOidcError === 'OIDC_CLAIM_MISSING'
				? 'OIDC_CLAIM_MISSING'
				: rawOidcError === 'OIDC_LINK_AMBIGUOUS'
					? 'OIDC_LINK_AMBIGUOUS'
					: null;

	return {
		authMode: AUTH_MODE,
		showLocalForm,
		showOidc,
		oidcMisconfigured,
		...(showOidc || oidcMisconfigured ? { oidcIssuerLabel: OIDC_ISSUER_LABEL } : {}),
		...(oidcError ? { oidcError } : {})
	};
};

// ── Actions ─────────────────────────────────────────────────────────────────

export const actions: Actions = {
	/**
	 * T017 — Admin local credential sign-in via better-auth.
	 * Used when AUTH_MODE is 'local' or 'both'.
	 */
	localLogin: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required.' });
		}

		try {
			const result = await auth.api.signInEmail({
				body: { email, password },
				headers: request.headers,
				asResponse: true
			});

			if (!result || !result.ok) {
				return fail(401, { error: 'Invalid email or password.' });
			}

			// Forward better-auth session cookie(s) to the browser
			// Use getSetCookie() (Node 18+) for a reliable per-cookie array instead of the
			// comma-joined get('set-cookie') string, which needs complex splitting logic.
			const rawHeaders = result.headers as unknown as { getSetCookie?: () => string[] };
			const setCookieList: string[] =
				typeof rawHeaders.getSetCookie === 'function'
					? rawHeaders.getSetCookie()
					: result.headers.get('set-cookie')
						? [result.headers.get('set-cookie')!]
						: [];

			logger.debug({ email, cookieCount: setCookieList.length }, 'login cookie forwarded');

			for (const cookieStr of setCookieList) {
				const [nameVal, ...attrs] = cookieStr.split(';');
				const eqIdx = nameVal.indexOf('=');
				if (eqIdx < 0) continue;
				const name = nameVal.slice(0, eqIdx).trim();
				const value = nameVal.slice(eqIdx + 1).trim();
				const options: Record<string, unknown> = { path: '/' };
				for (const attr of attrs) {
					const a = attr.trim().toLowerCase();
					if (a === 'httponly') options.httpOnly = true;
					if (a === 'secure') options.secure = true;
					if (a.startsWith('samesite=')) options.sameSite = a.split('=')[1];
					if (a.startsWith('max-age=')) options.maxAge = parseInt(a.split('=')[1]);
				}
				// better-auth already URL-encodes the signed cookie value (via encodeURIComponent
				// in signCookieValue). Prevent SvelteKit from encoding it a second time.
				(options as Record<string, unknown>).encode = (v: string) => v;
				cookies.set(name, value, options as unknown as Parameters<typeof cookies.set>[2]);
			}

			logger.info({ email }, 'admin local login');
		} catch (err) {
			logger.warn({ err, email }, 'local login failed');
			return fail(401, { error: 'Invalid email or password.' });
		}

		redirect(302, '/admin/chores');
	},

	/**
	 * PIN-based member (child) login via better-auth pin-auth plugin.
	 */
	pinLogin: async ({ request, cookies }) => {
		const data = await request.formData();
		const familyCode = String(data.get('familyCode') ?? '').trim().toUpperCase();
		const displayName = String(data.get('displayName') ?? '').trim();
		const pin = String(data.get('pin') ?? '').trim();

		if (!familyCode || !displayName || !pin) {
			return fail(400, { error: 'Family code, name, and PIN are required.' });
		}

		try {
			// auth.api.signInPin is added by the pinAuth plugin at runtime;
			// cast required because TypeScript cannot infer custom plugin endpoints.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await (auth.api as any).signInPin({
				body: { displayName, familyCode, pin },
				headers: request.headers,
				asResponse: true
			});

			if (!result || !result.ok) {
				const body = await result?.json().catch(() => null);
				const message = body?.message ?? 'Invalid family code, name, or PIN.';
				return fail(401, { error: message });
			}

			// Forward better-auth session cookie(s) to the browser
			const rawHeaders2 = result.headers as unknown as { getSetCookie?: () => string[] };
			const setCookieList2: string[] =
				typeof rawHeaders2.getSetCookie === 'function'
					? rawHeaders2.getSetCookie()
					: result.headers.get('set-cookie')
						? [result.headers.get('set-cookie')!]
						: [];

			for (const cookieStr of setCookieList2) {
				const [nameVal, ...attrs] = cookieStr.split(';');
				const eqIdx = nameVal.indexOf('=');
				if (eqIdx < 0) continue;
				const name = nameVal.slice(0, eqIdx).trim();
				const value = nameVal.slice(eqIdx + 1).trim();
				const options: Record<string, unknown> = { path: '/' };
				for (const attr of attrs) {
					const a = attr.trim().toLowerCase();
					if (a === 'httponly') options.httpOnly = true;
					if (a === 'secure') options.secure = true;
					if (a.startsWith('samesite=')) options.sameSite = a.split('=')[1];
					if (a.startsWith('max-age=')) options.maxAge = parseInt(a.split('=')[1]);
				}
				// better-auth already URL-encodes the signed cookie value; prevent double-encoding.
				options.encode = (v: string) => v;
				cookies.set(name, value, options as unknown as Parameters<typeof cookies.set>[2]);
			}
		} catch (err) {
			logger.warn({ err, displayName }, 'pin login failed');
			return fail(401, { error: 'Invalid family code, name, or PIN.' });
		}

		redirect(302, '/member/chores');
	},

	/**
	 * Logout: sign out via better-auth and clear any lingering legacy cookies.
	 */
	logout: async ({ request, cookies }) => {
		try {
			await auth.api.signOut({ headers: request.headers });
		} catch {
			// Ignore — may not have a session
		}

		// Clear any lingering legacy PIN session cookie (30-day TTL window)
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

		redirect(302, '/login');
	}
};
