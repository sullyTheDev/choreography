import type { PageServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq, desc, and } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	activityEvents,
	choreCompletions,
	prizeRedemptions,
	chores,
	prizes,
	authUser,
	familyMembers
} from '$lib/server/db/schema.js';

const PAGE_SIZE = 5;

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const offset = (page - 1) * PAGE_SIZE;
	const rawFilter = url.searchParams.get('filter') ?? 'all'; // 'all' | 'completions' | 'prizes' (legacy: redemptions)
	const filter = rawFilter === 'redemptions' ? 'prizes' : rawFilter;
	const memberFilter = url.searchParams.get('member') ?? 'all';

	const familyId = session.familyId;

	const [eventRows, allMembers, allChores, allPrizes] = await Promise.all([
		db
			.select({
				id: activityEvents.id,
				actorMemberId: activityEvents.actorMemberId,
				subjectMemberId: activityEvents.subjectMemberId,
				eventType: activityEvents.eventType,
				entityType: activityEvents.entityType,
				entityId: activityEvents.entityId,
				deltaCoins: activityEvents.deltaCoins,
				metadata: activityEvents.metadata,
				occurredAt: activityEvents.occurredAt
			})
			.from(activityEvents)
			.where(eq(activityEvents.familyId, familyId))
			.orderBy(desc(activityEvents.occurredAt)),
		db
			.select({ id: authUser.id, displayName: authUser.name, avatarEmoji: authUser.avatarEmoji })
			.from(familyMembers)
			.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(and(eq(familyMembers.familyId, familyId), eq(authUser.isActive, true))),
		db.select({ id: chores.id, title: chores.title }).from(chores).where(eq(chores.familyId, familyId)),
		db.select({ id: prizes.id, title: prizes.title }).from(prizes).where(eq(prizes.familyId, familyId))
	]);

	const memberMap = new Map(allMembers.map((m) => [m.id, m]));
	const choreMap = new Map(allChores.map((c) => [c.id, c.title]));
	const prizeMap = new Map(allPrizes.map((p) => [p.id, p.title]));

	type EventType = 'chore_completed' | 'prize_purchased' | 'prize_redeemed' | 'prize_fulfilled';
	type ActivityEvent = {
		id: string;
		eventType: EventType | string;
		type: 'chore_completion' | 'prize_redemption';
		memberId: string;
		memberName: string;
		memberAvatarEmoji: string;
		title: string;
		deltaCoins: number;
		coins: number;
		occurredAt: string;
	};

	const events: ActivityEvent[] = [];

	for (const row of eventRows) {
		const memberId = row.subjectMemberId ?? row.actorMemberId ?? '';
		const member = memberId ? memberMap.get(memberId) : null;

		let metadata: Record<string, unknown> = {};
		try {
			metadata = row.metadata ? JSON.parse(row.metadata) : {};
		} catch {
			metadata = {};
		}

		let title = 'Unknown item';
		const metaChoreTitle = typeof metadata.choreTitle === 'string' ? metadata.choreTitle : null;
		const metaPrizeTitle = typeof metadata.prizeTitle === 'string' ? metadata.prizeTitle : null;
		const metaPrizeId = typeof metadata.prizeId === 'string' ? metadata.prizeId : null;

		if (metaChoreTitle) {
			title = metaChoreTitle;
		} else if (metaPrizeTitle) {
			title = metaPrizeTitle;
		} else if (row.entityType === 'chore' && row.entityId) {
			title = choreMap.get(row.entityId) ?? 'Unknown chore';
		} else if (row.entityType === 'prize' && row.entityId) {
			title = prizeMap.get(row.entityId) ?? 'Unknown prize';
		} else if (metaPrizeId) {
			title = prizeMap.get(metaPrizeId) ?? 'Unknown prize';
		}

		events.push({
			id: row.id,
			eventType: row.eventType,
			type: row.eventType === 'chore_completed' ? 'chore_completion' : 'prize_redemption',
			memberId,
			memberName: member?.displayName ?? 'Unknown member',
			memberAvatarEmoji: member?.avatarEmoji ?? '👤',
			title,
			deltaCoins: row.deltaCoins,
			coins: Math.abs(row.deltaCoins),
			occurredAt: row.occurredAt
		});
	}

	// Compatibility fallback for tests or environments that seed legacy tables directly.
	if (events.length === 0) {
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
				.where(eq(choreCompletions.familyId, familyId)),
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
		]);

		for (const row of completionRows) {
			const member = memberMap.get(row.memberId);
			if (!member) continue;
			events.push({
				id: row.id,
				eventType: 'chore_completed',
				type: 'chore_completion',
				memberId: row.memberId,
				memberName: member.displayName,
				memberAvatarEmoji: member.avatarEmoji,
				title: choreMap.get(row.choreId) ?? 'Unknown chore',
				deltaCoins: row.coinsAwarded,
				coins: row.coinsAwarded,
				occurredAt: row.completedAt
			});
		}

		for (const row of redemptionRows) {
			const member = memberMap.get(row.memberId);
			if (!member) continue;
			events.push({
				id: row.id,
				eventType: 'prize_redeemed',
				type: 'prize_redemption',
				memberId: row.memberId,
				memberName: member.displayName,
				memberAvatarEmoji: member.avatarEmoji,
				title: prizeMap.get(row.prizeId) ?? 'Unknown prize',
				deltaCoins: -row.coinCost,
				coins: row.coinCost,
				occurredAt: row.redeemedAt
			});
		}

		events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
	}

	// Apply type filter
	const filteredEvents = (filter === 'completions'
		? events.filter((e) => e.eventType === 'chore_completed')
		: filter === 'prizes'
			? events.filter((e) => e.eventType.startsWith('prize_'))
			: events
	).filter((e) => memberFilter === 'all' || e.memberId === memberFilter);

	const totalCount = filteredEvents.length;
	const pagedEvents = filteredEvents.slice(offset, offset + PAGE_SIZE);

	return { events: pagedEvents, totalCount, page, filter, memberFilter, members: allMembers };
};
