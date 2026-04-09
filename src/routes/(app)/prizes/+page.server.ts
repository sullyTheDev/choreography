import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { prizes, prizeRedemptions, choreCompletions, kids } from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { activeKidId } = await parent();

	const effectiveKidId = session.userRole === 'kid' ? session.userId : (activeKidId ?? null);
	if (!effectiveKidId) {
		return { prizes: [], coinBalance: 0 };
	}

	const [allPrizes, earnedRow, spentRow] = await Promise.all([
		db
			.select()
			.from(prizes)
			.where(and(eq(prizes.familyId, session.familyId), eq(prizes.isActive, true))),
		db
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.kidId, effectiveKidId)),
		db
			.select({ total: sum(prizeRedemptions.coinCost) })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.kidId, effectiveKidId))
	]);

	const coinBalance = Number(earnedRow[0]?.total ?? 0) - Number(spentRow[0]?.total ?? 0);

	const prizesWithAfford = allPrizes.map((prize) => {
		const canAfford = coinBalance >= prize.coinCost;
		return {
			id: prize.id,
			title: prize.title,
			description: prize.description,
			coinCost: prize.coinCost,
			canAfford,
			shortfall: canAfford ? 0 : prize.coinCost - coinBalance
		};
	});

	return { prizes: prizesWithAfford, coinBalance };
};

export const actions: Actions = {
	redeem: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) error(401, 'Unauthorized');

		const data = await request.formData();
		const prizeId = String(data.get('prizeId') ?? '').trim();
		if (!prizeId) return fail(400, { error: 'Prize ID is required' });

		const effectiveKidId = session.userRole === 'kid' ? session.userId : null;
		if (!effectiveKidId) return fail(400, { error: 'Only kids can redeem prizes' });

		// Load the prize
		const [prize] = await db
			.select()
			.from(prizes)
			.where(and(eq(prizes.id, prizeId), eq(prizes.familyId, session.familyId)))
			.limit(1);

		if (!prize || !prize.isActive) return fail(404, { error: 'Prize not found' });

		// Compute current coin balance
		const [earnedRow] = await db
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.kidId, effectiveKidId));

		const [spentRow] = await db
			.select({ total: sum(prizeRedemptions.coinCost) })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.kidId, effectiveKidId));

		const coinBalance = Number(earnedRow?.total ?? 0) - Number(spentRow?.total ?? 0);

		if (coinBalance < prize.coinCost) {
			return fail(400, { error: 'Not enough coins to redeem this prize' });
		}

		const id = ulid();
		await db.insert(prizeRedemptions).values({
			id,
			prizeId,
			kidId: effectiveKidId,
			familyId: session.familyId,
			coinCost: prize.coinCost,
			redeemedAt: now()
		});

		logger.info(
			{
				redemptionId: id,
				prizeId,
				kidId: effectiveKidId,
				coins: prize.coinCost
			},
			'Prize redeemed'
		);

		return { success: true };
	}
};
