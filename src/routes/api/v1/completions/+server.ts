import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { choreCompletions, chores, familyMembers } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey } from '$lib/server/api-utils.js';

export const GET: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
		const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

		// Get completions for family
		const completions = await db
			.select({
				id: choreCompletions.id,
				choreId: choreCompletions.choreId,
				choreName: chores.name,
				choreEmoji: chores.emoji,
				memberId: choreCompletions.memberId,
				memberDisplayName: familyMembers.displayName,
				completedAt: choreCompletions.completedAt,
				pointsEarned: choreCompletions.pointsEarned
			})
			.from(choreCompletions)
			.innerJoin(chores, eq(chores.id, choreCompletions.choreId))
			.innerJoin(familyMembers, eq(familyMembers.memberId, choreCompletions.memberId))
			.where(eq(choreCompletions.familyId, apiKey.familyId))
			.orderBy(choreCompletions.completedAt)
			.limit(limit)
			.offset(offset);

		const [{ total }] = await db
			.select({ total: choreCompletions.id })
			.from(choreCompletions)
			.where(eq(choreCompletions.familyId, apiKey.familyId));

		return apiOk({
			completions,
			pagination: {
				limit,
				offset,
				total: completions.length,
				hasMore: offset + completions.length < (total || 0)
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Completions API GET error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
