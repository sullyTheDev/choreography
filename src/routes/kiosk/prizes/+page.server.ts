import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types.js';

export const load: PageServerLoad = async ({ url }) => {
	const suffix = url.search ? `${url.search}` : '';
	throw redirect(302, `/kiosk/prizes/shop${suffix}`);
};
