import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { parents, kids, families } from '$lib/server/db/schema.js';
import {
	verifyPassword,
	verifyPin,
	createSession,
	SESSION_COOKIE_NAME,
	sessionCookieOptions,
	deleteSession
} from '$lib/server/auth.js';
import { familyCode } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.session) redirect(302, locals.session.userRole === 'parent' ? '/admin/chores' : '/chores');
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const role = String(data.get('role') ?? 'parent') as 'parent' | 'kid';

		if (role === 'parent') {
			const email = String(data.get('email') ?? '').trim().toLowerCase();
			const password = String(data.get('password') ?? '');

			if (!email || !password) return fail(400, { error: 'Email and password are required.' });

			const [parent] = await db.select().from(parents).where(eq(parents.email, email)).limit(1);
			if (!parent || !(await verifyPassword(password, parent.passwordHash))) {
				return fail(401, { error: 'Invalid email or password.' });
			}

			const sessionToken = await createSession({ familyId: parent.familyId, userId: parent.id, userRole: 'parent' });
			cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

			logger.info({ parentId: parent.id }, 'parent login');
			redirect(302, '/admin/chores');
		} else {
			// Kid login: familyCode + PIN
			const code = String(data.get('familyCode') ?? '').trim().toUpperCase();
			const pin = String(data.get('pin') ?? '').trim();

			if (!code || !pin) return fail(400, { error: 'Family code and PIN are required.' });

			// Find family by familyCode (last 8 chars of ULID)
			const allFamilies = await db.select().from(families);
			const family = allFamilies.find((f) => familyCode(f.id) === code);
			if (!family) return fail(401, { error: 'Invalid family code.' });

			// Find active kids in the family and check PIN against each
			const activeKids = await db
				.select()
				.from(kids)
				.where(and(eq(kids.familyId, family.id), eq(kids.isActive, true)));

			let matchedKid: (typeof activeKids)[0] | undefined;
			for (const kid of activeKids) {
				if (await verifyPin(pin, kid.pin)) {
					matchedKid = kid;
					break;
				}
			}

			if (!matchedKid) return fail(401, { error: 'Invalid PIN.' });

			const sessionToken = await createSession({ familyId: family.id, userId: matchedKid.id, userRole: 'kid' });
			cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

			logger.info({ kidId: matchedKid.id }, 'kid login');
			redirect(302, '/chores');
		}
	},

	logout: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE_NAME);
		if (token) await deleteSession(token);
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(302, '/login');
	}
};
