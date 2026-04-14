import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq, and, gte, lte, sum, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { members, familyMembers, choreCompletions } from '$lib/server/db/schema.js';
import { getWeeklyPeriod } from '$lib/server/db/utils.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { family } = await parent();
	const resetDay = family.leaderboardResetDay ?? 1;

	const { start, end, label } = getWeeklyPeriod(new Date(), resetDay);

	const familyMembersList = await db
		.select({
			id: members.id,
			displayName: members.displayName,
			avatarEmoji: members.avatarEmoji
		})
		.from(familyMembers)
		.innerJoin(members, eq(familyMembers.memberId, members.id))
		.where(
			and(
				eq(familyMembers.familyId, session.familyId),
				eq(members.isActive, true)
			)
		);

	if (familyMembersList.length === 0) {
		return {
			period: { start: start.toISOString(), end: end.toISOString(), label },
			rankings: []
		};
	}

	const memberIds = familyMembersList.map((m) => m.id);

	// Aggregate coinsAwarded per kid within the current period
	const rows = await db
		.select({
			memberId: choreCompletions.memberId,
			total: sum(choreCompletions.coinsAwarded)
		})
		.from(choreCompletions)
		.where(
			and(
				inArray(choreCompletions.memberId, memberIds),
				gte(choreCompletions.completedAt, start.toISOString()),
				lte(choreCompletions.completedAt, end.toISOString())
			)
		)
		.groupBy(choreCompletions.memberId);

	const totalsMap = new Map<string, number>(
		rows.map((r) => [r.memberId, Number(r.total ?? 0)])
	);

	const unsorted = familyMembersList.map((member) => ({
		memberId: member.id,
		displayName: member.displayName,
		avatarEmoji: member.avatarEmoji,
		coinsEarned: totalsMap.get(member.id) ?? 0
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
