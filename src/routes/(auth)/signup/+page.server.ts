import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { families, parents } from '$lib/server/db/schema.js';
import { hashPassword, createSession, SESSION_COOKIE_NAME, sessionCookieOptions } from '$lib/server/auth.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.session) redirect(302, locals.session.userRole === 'parent' ? '/admin/chores' : '/chores');
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');
		const displayName = String(data.get('displayName') ?? '').trim();
		const familyName = String(data.get('familyName') ?? '').trim();

		// Validation
		if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return fail(400, { error: 'Please enter a valid email address.' });
		}
		if (password.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters.' });
		}
		if (!displayName) {
			return fail(400, { error: 'Your name is required.' });
		}
		if (!familyName) {
			return fail(400, { error: 'Family name is required.' });
		}

		// Check for duplicate email
		const [existing] = await db.select().from(parents).where(eq(parents.email, email)).limit(1);
		if (existing) {
			return fail(409, { error: 'An account with that email already exists.' });
		}

		const familyId = ulid();
		const parentId = ulid();
		const passwordHash = await hashPassword(password);

		await db.insert(families).values({ id: familyId, name: familyName, createdAt: now() });
		await db.insert(parents).values({ id: parentId, familyId, email, passwordHash, displayName, createdAt: now() });

		const sessionToken = await createSession({ familyId, userId: parentId, userRole: 'parent' });
		cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

		logger.info({ familyId, parentId }, 'family registered');

		redirect(302, '/admin/kids');
	}
};
