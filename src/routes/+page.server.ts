import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = ({ locals }) => {
	if (!locals.session) redirect(302, '/login');
	if (locals.session.memberRole === 'admin') redirect(302, '/admin/chores');
	redirect(302, '/chores');
};
