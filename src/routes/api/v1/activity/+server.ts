import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { choreCompletions, chores, prizeRedemptions, prizes, familyMembers } from '$lib/server/db/schema.js';
import { eq, sql } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey } from '$lib/server/api-utils.js';

export const GET: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
		const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0);

		// Get chore completions
		const completionEvents = await db
			.select({
				type: sql<'completion'>`'completion'`,
				id: choreCompletions.id,
				choreId: choreCompletions.choreId,
				choreTitle: chores.title,
				choreEmoji: chores.emoji,
				memberId: choreCompletions.memberId,
				memberRole: familyMembers.role,
				timestamp: choreCompletions.completedAt,
				coinsAwarded: choreCompletions.coinsAwarded
			})
			.from(choreCompletions)
			.innerJoin(chores, eq(chores.id, choreCompletions.choreId))
			.innerJoin(familyMembers, eq(familyMembers.memberId, choreCompletions.memberId))
			.where(eq(choreCompletions.familyId, apiKey.familyId));

		// Get prize redemptions
		const redemptionEvents = await db
			.select({
				type: sql<'redemption'>`'redemption'`,
				id: prizeRedemptions.id,
				prizeId: prizeRedemptions.prizeId,
				prizeTitle: prizes.title,
				prizeEmoji: prizes.emoji,
				memberId: prizeRedemptions.memberId,
				memberRole: familyMembers.role,
				timestamp: prizeRedemptions.redeemedAt,
				status: prizeRedemptions.status
			})
			.from(prizeRedemptions)
			.innerJoin(prizes, eq(prizes.id, prizeRedemptions.prizeId))
			.innerJoin(familyMembers, eq(familyMembers.memberId, prizeRedemptions.memberId))
			.where(eq(prizeRedemptions.familyId, apiKey.familyId));

		// Combine and sort by timestamp
		const allEvents = [...completionEvents, ...redemptionEvents].sort(
			(a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);

		const paginatedEvents = allEvents.slice(offset, offset + limit);

		return apiOk({
			events: paginatedEvents,
			pagination: {
				limit,
				offset,
				total: paginatedEvents.length,
				hasMore: offset + paginatedEvents.length < allEvents.length
			}
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Activity API GET error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
