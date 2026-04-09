import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq, and, gte, lte, sum, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { kids, choreCompletions } from '$lib/server/db/schema.js';
import { getWeeklyPeriod } from '$lib/server/db/utils.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { family } = await parent();
	const resetDay = family.leaderboardResetDay ?? 1;

	const { start, end, label } = getWeeklyPeriod(new Date(), resetDay);

	// All active kids in this family
	const familyKids = await db
		.select()
		.from(kids)
		.where(and(eq(kids.familyId, session.familyId), eq(kids.isActive, true)));

	if (familyKids.length === 0) {
		return {
			period: { start: start.toISOString(), end: end.toISOString(), label },
			rankings: []
		};
	}

	const kidIds = familyKids.map((k) => k.id);

	// Aggregate coinsAwarded per kid within the current period
	const rows = await db
		.select({
			kidId: choreCompletions.kidId,
			total: sum(choreCompletions.coinsAwarded)
		})
		.from(choreCompletions)
		.where(
			and(
				inArray(choreCompletions.kidId, kidIds),
				gte(choreCompletions.completedAt, start.toISOString()),
				lte(choreCompletions.completedAt, end.toISOString())
			)
		)
		.groupBy(choreCompletions.kidId);

	const totalsMap = new Map<string, number>(
		rows.map((r) => [r.kidId, Number(r.total ?? 0)])
	);

	// Build rankings with 0 for kids with no completions
	const unsorted = familyKids.map((kid) => ({
		kidId: kid.id,
		displayName: kid.displayName,
		avatarEmoji: kid.avatarEmoji,
		coinsEarned: totalsMap.get(kid.id) ?? 0
	}));

	// Sort descending by coinsEarned, then by displayName for ties
	unsorted.sort((a, b) => b.coinsEarned - a.coinsEarned || a.displayName.localeCompare(b.displayName));

	const rankings = unsorted.map((entry, index) => ({
		rank: index + 1,
		...entry
	}));

	return {
		period: { start: start.toISOString(), end: end.toISOString(), label },
		rankings
	};
};
