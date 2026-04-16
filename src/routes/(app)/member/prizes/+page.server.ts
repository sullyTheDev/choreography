import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const suffix = url.search ? `${url.search}` : '';
	throw redirect(302, `/member/prizes/shop${suffix}`);
};
