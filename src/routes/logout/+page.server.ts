import { redirect } from '@sveltejs/kit';
import { auth } from '$lib/auth.js';
import { SESSION_COOKIE_NAME } from '$lib/server/auth.js';
import type { Actions } from './$types.js';

export const actions: Actions = {
	default: async ({ request, cookies }) => {
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
