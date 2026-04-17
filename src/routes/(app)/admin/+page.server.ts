import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq, and, count } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { prizeRedemptions } from '$lib/server/db/schema.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const [{ pendingCount }] = await db
		.select({ pendingCount: count() })
		.from(prizeRedemptions)
		.where(
			and(
				eq(prizeRedemptions.familyId, session.familyId),
				eq(prizeRedemptions.status, 'pending')
			)
		);

	return {
		pendingApprovalsCount: pendingCount
	};
};
