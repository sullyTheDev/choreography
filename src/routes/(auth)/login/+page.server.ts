import { fail, redirect } from '@sveltejs/kit';
import {
	verifyPassword,
	verifyPin,
	createSession,
	SESSION_COOKIE_NAME,
	sessionCookieOptions,
	deleteSession,
	getMemberByEmail,
	getMemberByDisplayNameInFamily,
	getMemberFamilyId
} from '$lib/server/auth.js';
import { logger } from '$lib/server/logger.js';
import type { Actions, PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.session) redirect(302, locals.session.memberRole === 'admin' ? '/admin/chores' : '/chores');
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const role = String(data.get('role') ?? 'admin') as 'admin' | 'member';

		if (role === 'admin') {
			const email = String(data.get('email') ?? '').trim().toLowerCase();
			const password = String(data.get('password') ?? '');

			if (!email || !password) return fail(400, { error: 'Email and password are required.' });

			const member = await getMemberByEmail(email);
			if (!member || !member.passwordHash || !(await verifyPassword(password, member.passwordHash))) {
				return fail(401, { error: 'Invalid email or password.' });
			}
			const familyId = await getMemberFamilyId(member.id);
			if (!familyId) return fail(401, { error: 'Unable to resolve family membership.' });

			const sessionToken = await createSession({ familyId, memberId: member.id, memberRole: 'admin' });
			cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

			logger.info({ memberId: member.id }, 'admin login');
			redirect(302, '/member/chores');
		} else {
const familyCode = String(data.get('familyCode') ?? '').trim().toUpperCase();
		const displayName = String(data.get('displayName') ?? '').trim();
		const pin = String(data.get('pin') ?? '').trim();

		if (!familyCode || !displayName || !pin) return fail(400, { error: 'Family code, name, and PIN are required.' });
		const member = await getMemberByDisplayNameInFamily(displayName, familyCode);
		if (!member || !member.pin || !(await verifyPin(pin, member.pin))) {
			return fail(401, { error: 'Invalid family code, name, or PIN.' });
			}
			const familyId = await getMemberFamilyId(member.id);
			if (!familyId) return fail(401, { error: 'Unable to resolve family membership.' });

			const sessionToken = await createSession({ familyId, memberId: member.id, memberRole: 'member' });
			cookies.set(SESSION_COOKIE_NAME, sessionToken, sessionCookieOptions());

			logger.info({ memberId: member.id }, 'member login');
			redirect(302, 'member/chores');
		}
	},

	logout: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE_NAME);
		if (token) await deleteSession(token);
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(302, '/login');
	}
};
