import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.session) redirect(302, '/login');
	redirect(302, '/member/chores');
};
