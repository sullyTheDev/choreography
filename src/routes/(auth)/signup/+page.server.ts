import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { families, members, familyMembers } from '$lib/server/db/schema.js';
import { hashPassword, hashPin, createSession, SESSION_COOKIE_NAME, sessionCookieOptions } from '$lib/server/auth.js';
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
		const [existing] = await db.select().from(members).where(eq(members.email, email)).limit(1);
		if (existing) {
			return fail(409, { error: 'An account with that email already exists.' });
		}

		const familyId = ulid();
		const memberId = ulid();
		const passwordHash = await hashPassword(password);
		const pinHash = pin ? await hashPin(pin) : null;

		await db.insert(families).values({ id: familyId, name: familyName, createdAt: now() });
		await db.insert(members).values({
			id: memberId,
			email,
			passwordHash,
			pin: pinHash,
			displayName,
			avatarEmoji,
			isActive: true,
			createdAt: now()
		});
		await db.insert(familyMembers).values({
			memberId,
			familyId,
			role: 'admin',
			joinedAt: now()
		});

		const sessionToken = await createSession({ familyId, memberId, memberRole: 'admin' });
		cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

		logger.info({ familyId, memberId }, 'family registered');

		redirect(302, '/admin/family?new=1');
	}
};
