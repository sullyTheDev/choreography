import { redirect } from '@sveltejs/kit';
import { deleteSession, SESSION_COOKIE_NAME } from '$lib/server/auth.js';
import type { Actions } from './$types.js';

export const actions: Actions = {
	default: async ({ cookies }) => {
		const token = cookies.get(SESSION_COOKIE_NAME);
		if (token) await deleteSession(token);
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(302, '/login');
	}
};
