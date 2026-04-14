import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	choreCompletions,
	prizeRedemptions,
	chores,
	prizes,
	members,
	familyMembers
} from '$lib/server/db/schema.js';

const PAGE_SIZE = 25;

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const offset = (page - 1) * PAGE_SIZE;

	const familyId = session.familyId;

	// Fetch all completions and redemptions for the family
	const [completionRows, redemptionRows] = await Promise.all([
		db
			.select({
				id: choreCompletions.id,
				memberId: choreCompletions.memberId,
				choreId: choreCompletions.choreId,
				coinsAwarded: choreCompletions.coinsAwarded,
				completedAt: choreCompletions.completedAt
			})
			.from(choreCompletions)
			.where(eq(choreCompletions.familyId, familyId))
			.orderBy(desc(choreCompletions.completedAt)),
		db
			.select({
				id: prizeRedemptions.id,
				memberId: prizeRedemptions.memberId,
				prizeId: prizeRedemptions.prizeId,
				coinCost: prizeRedemptions.coinCost,
				redeemedAt: prizeRedemptions.redeemedAt
			})
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.familyId, familyId))
			.orderBy(desc(prizeRedemptions.redeemedAt))
	]);

	const [allMembers, allChores, allPrizes] = await Promise.all([
		db
			.select({ id: members.id, displayName: members.displayName, avatarEmoji: members.avatarEmoji })
			.from(familyMembers)
			.innerJoin(members, eq(familyMembers.memberId, members.id))
			.where(eq(familyMembers.familyId, familyId)),
		db.select({ id: chores.id, title: chores.title }).from(chores).where(eq(chores.familyId, familyId)),
		db.select({ id: prizes.id, title: prizes.title }).from(prizes).where(eq(prizes.familyId, familyId))
	]);

	const memberMap = new Map(allMembers.map((m) => [m.id, m]));
	const choreMap = new Map(allChores.map((c) => [c.id, c.title]));
	const prizeMap = new Map(allPrizes.map((p) => [p.id, p.title]));

	// Merge and sort events
	type ActivityEvent = {
		type: 'chore_completion' | 'prize_redemption';
		memberId: string;
		memberName: string;
		memberAvatarEmoji: string;
		title: string;
		coins: number;
		occurredAt: string;
	};

	const events: ActivityEvent[] = [];

	for (const row of completionRows) {
		const member = memberMap.get(row.memberId);
		if (!member) continue;
		events.push({
			type: 'chore_completion',
			memberId: row.memberId,
			memberName: member.displayName,
			memberAvatarEmoji: member.avatarEmoji,
			title: choreMap.get(row.choreId) ?? 'Unknown chore',
			coins: row.coinsAwarded,
			occurredAt: row.completedAt
		});
	}

	for (const row of redemptionRows) {
		const member = memberMap.get(row.memberId);
		if (!member) continue;
		events.push({
			type: 'prize_redemption',
			memberId: row.memberId,
			memberName: member.displayName,
			memberAvatarEmoji: member.avatarEmoji,
			title: prizeMap.get(row.prizeId) ?? 'Unknown prize',
			coins: row.coinCost,
			occurredAt: row.redeemedAt
		});
	}

	// Sort by occurredAt descending
	events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

	const totalCount = events.length;
	const pagedEvents = events.slice(offset, offset + PAGE_SIZE);

	return { events: pagedEvents, totalCount, page };
};
