import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, sum, exists } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	prizes,
	prizeAssignments,
	prizeRedemptions,
	activityEvents,
	choreCompletions,
	authUser,
	familyMembers,
	families
} from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';
import { dispatchWebhook } from '$lib/server/webhook.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { activeMemberId } = await parent();
	if (!activeMemberId) {
		return { prizes: [], activeMemberId: null, memberRole: session.memberRole };
	}

	const [allPrizes, earnedRow, spentRow] = await Promise.all([
		db
			.select()
			.from(prizes)
			.where(
				and(
					eq(prizes.familyId, session.familyId),
					eq(prizes.isActive, true),
					exists(
						db.select().from(prizeAssignments).where(
							and(
								eq(prizeAssignments.prizeId, prizes.id),
								eq(prizeAssignments.memberId, activeMemberId)
							)
						)
					)
				)
			),
		db
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.memberId, activeMemberId)),
		db
			.select({ total: sum(prizeRedemptions.coinCost) })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.memberId, activeMemberId))
	]);

	const coinBalance = Number(earnedRow[0]?.total ?? 0) - Number(spentRow[0]?.total ?? 0);

	const prizesWithAfford = allPrizes.map((prize) => {
		const canAfford = coinBalance >= prize.coinCost;
		return {
			id: prize.id,
			title: prize.title,
			description: prize.description,
			emoji: prize.emoji,
			coinCost: prize.coinCost,
			canAfford,
			shortfall: canAfford ? 0 : prize.coinCost - coinBalance
		};
	});

	return { prizes: prizesWithAfford, activeMemberId, memberRole: session.memberRole };
};

export const actions: Actions = {
	redeem: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) error(401, 'Unauthorized');

		const data = await request.formData();
		const prizeId = String(data.get('prizeId') ?? '').trim();
		const requestedMemberId = String(data.get('memberId') ?? '').trim();
		if (!prizeId) return fail(400, { error: 'Prize ID is required' });
		if (!requestedMemberId) return fail(400, { error: 'Member ID is required' });

		const [selectedMember] = await db
				.select({ id: authUser.id, name: authUser.name })
				.from(familyMembers)
				.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(
				and(
					eq(familyMembers.familyId, session.familyId),
					eq(familyMembers.memberId, requestedMemberId),
						eq(authUser.isActive, true)
				)
			)
			.limit(1);

		if (!selectedMember) return fail(403, { error: 'Selected member is not active in this family' });

		const [prize] = await db
			.select()
			.from(prizes)
			.where(and(eq(prizes.id, prizeId), eq(prizes.familyId, session.familyId)))
			.limit(1);

		if (!prize || !prize.isActive) return fail(404, { error: 'Prize not found' });

		const [earnedRow] = await db
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.memberId, requestedMemberId));
		const [spentRow] = await db
			.select({ total: sum(prizeRedemptions.coinCost) })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.memberId, requestedMemberId));
		const coinBalance = Number(earnedRow?.total ?? 0) - Number(spentRow?.total ?? 0);

		if (coinBalance < prize.coinCost) return fail(400, { error: 'Not enough coins to redeem this prize' });

		const id = ulid();
		const occurredAt = now();
		await db.transaction(async (tx) => {
			await tx.insert(prizeRedemptions).values({
				id,
				prizeId,
				memberId: requestedMemberId,
				familyId: session.familyId,
				coinCost: prize.coinCost,
				status: 'available',
				redeemedAt: occurredAt
			});

			await tx.insert(activityEvents).values({
				id: ulid(),
				familyId: session.familyId,
				actorMemberId: requestedMemberId,
				subjectMemberId: requestedMemberId,
				eventType: 'prize_purchased',
				entityType: 'prize_redemption',
				entityId: id,
				deltaCoins: -prize.coinCost,
				metadata: JSON.stringify({
					prizeId,
					prizeTitle: prize.title,
					status: 'available',
					source: 'kiosk_prizes_purchase'
				}),
				occurredAt,
				createdAt: occurredAt
			});
		});

		logger.info(
			{ redemptionId: id, prizeId, memberId: requestedMemberId, coins: prize.coinCost, status: 'available' },
			'Prize redeemed (kiosk)'
		);

		try {
			const [familyRow] = await db
				.select({ name: families.name, webhookUrl: families.webhookUrl })
				.from(families)
				.where(eq(families.id, session.familyId))
				.limit(1);
			if (familyRow?.webhookUrl) {
				dispatchWebhook(familyRow.webhookUrl, {
					event: 'prize_purchased',
					timestamp: occurredAt,
					family: { id: session.familyId, name: familyRow.name },
					actor: { id: requestedMemberId, name: selectedMember?.name ?? requestedMemberId },
					subject: null,
					chore: null,
					prize: { id: prizeId, title: prize.title, coinCost: prize.coinCost },
					coinsAwarded: null,
					coinsSpent: prize.coinCost,
					redemptionId: id
				});
			}
		} catch (err) {
			logger.warn({ err, familyId: session.familyId }, 'Failed to dispatch prize_purchased webhook (kiosk)');
		}

		return { success: true };
	}
};
