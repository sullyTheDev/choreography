import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { families, familyMembers, authUser, authAccount } from '$lib/server/db/schema.js';
import { hashPassword, hashPin } from '$lib/server/auth.js';
import { auth } from '$lib/auth.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.session) redirect(302, locals.session.memberRole === 'admin' ? '/admin/chores' : '/chores');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');
		const pin = String(data.get('pin') ?? '').trim();
		const displayName = String(data.get('displayName') ?? '').trim();
		const avatarEmoji = String(data.get('avatarEmoji') ?? '').trim() || '👤';
		const familyName = String(data.get('familyName') ?? '').trim();

		// Validation
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (pin && !/^\d{4,6}$/.test(pin)) {
			return fail(400, { error: 'PIN must be 4-6 digits.' });
		}
		if (!displayName) {
			return fail(400, { error: 'Your name is required.' });
		}
		if (!familyName) {
			return fail(400, { error: 'Family name is required.' });
		}

		// Check for duplicate email
		const [existing] = await db.select().from(authUser).where(eq(authUser.email, email)).limit(1);
		if (existing) {
			return fail(409, { error: 'An account with that email already exists.' });
		}

		const familyId = ulid();
		const memberId = ulid();
		const passwordHash = await hashPassword(password);
		const pinHash = pin ? await hashPin(pin) : null;
		const ts = new Date();

		// Insert family + authUser + familyMembers
		await db.insert(families).values({ id: familyId, name: familyName, createdAt: now() });
		await db.insert(authUser).values({
			id: memberId,
			name: displayName,
			email,
			emailVerified: false,
			avatarEmoji,
			isActive: true,
			createdAt: ts,
			updatedAt: ts
		});
		await db.insert(familyMembers).values({
			memberId,
			familyId,
			role: 'admin',
			joinedAt: now()
		});

		// Create credential account
		await db.insert(authAccount).values({
			id: `cred_${memberId}`,
			accountId: email,
			providerId: 'credential',
			userId: memberId,
			password: passwordHash,
			createdAt: ts,
			updatedAt: ts
		});

		// Create PIN account if provided
		if (pinHash) {
			await db.insert(authAccount).values({
				id: `pin_${memberId}`,
				accountId: memberId,
				providerId: 'pin-auth',
				userId: memberId,
				password: pinHash,
				createdAt: ts,
				updatedAt: ts
			});
		}

		// Sign in via better-auth to establish session + set cookie
		try {
			const result = await auth.api.signInEmail({
				body: { email, password },
				headers: request.headers,
				asResponse: true
			});
			if (result?.ok) {
				const rawHdrs = result.headers as unknown as { getSetCookie?: () => string[] };
				const scList: string[] =
					typeof rawHdrs.getSetCookie === 'function'
						? rawHdrs.getSetCookie()
						: result.headers.get('set-cookie')
							? [result.headers.get('set-cookie')!]
							: [];
				for (const cookieStr of scList) {
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
			}
		} catch (err) {
			logger.warn({ err, email }, 'post-signup auto-login failed');
		}

		logger.info({ familyId, memberId }, 'family registered');

		redirect(302, '/admin/family?new=1');
	}
};
