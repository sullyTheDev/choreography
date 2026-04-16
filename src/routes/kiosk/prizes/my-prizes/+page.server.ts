import type { Actions, PageServerLoad } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { activityEvents, prizeRedemptions, prizes } from '$lib/server/db/schema.js';
import { now, ulid } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { activeMemberId } = await parent();
	if (!activeMemberId) return { prizeGroups: [] };

	const rows = await db
		.select({
			id: prizeRedemptions.id,
			prizeId: prizes.id,
			prizeTitle: prizes.title,
			prizeEmoji: prizes.emoji,
			status: prizeRedemptions.status,
			redeemedAt: prizeRedemptions.redeemedAt
		})
		.from(prizeRedemptions)
		.innerJoin(prizes, eq(prizeRedemptions.prizeId, prizes.id))
		.where(
			and(
				eq(prizeRedemptions.familyId, session.familyId),
				eq(prizeRedemptions.memberId, activeMemberId)
			)
		)
		.orderBy(asc(prizes.title), desc(prizeRedemptions.redeemedAt));

	const map = new Map<string, {
		prizeId: string;
		prizeTitle: string;
		prizeEmoji: string;
		redemptions: { id: string; status: string; redeemedAt: string }[];
	}>();

	for (const row of rows) {
		if (!map.has(row.prizeId)) {
			map.set(row.prizeId, {
				prizeId: row.prizeId,
				prizeTitle: row.prizeTitle,
				prizeEmoji: row.prizeEmoji,
				redemptions: []
			});
		}
		map.get(row.prizeId)!.redemptions.push({ id: row.id, status: row.status, redeemedAt: row.redeemedAt });
	}

	return { prizeGroups: [...map.values()] };
};

export const actions: Actions = {
	use: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) error(401, 'Unauthorized');

		const fd = await request.formData();
		const redemptionId = String(fd.get('redemptionId') ?? '').trim();
		const requestedMemberId = String(fd.get('memberId') ?? '').trim();
		if (!redemptionId) return fail(400, { error: 'Redemption ID required' });
		if (!requestedMemberId) return fail(400, { error: 'Member ID required' });

		const [existing] = await db
			.select({ id: prizeRedemptions.id, prizeId: prizeRedemptions.prizeId })
			.from(prizeRedemptions)
			.where(
				and(
					eq(prizeRedemptions.id, redemptionId),
					eq(prizeRedemptions.familyId, session.familyId),
					eq(prizeRedemptions.memberId, requestedMemberId),
					eq(prizeRedemptions.status, 'available')
				)
			)
			.limit(1);

		if (!existing) return fail(404, { error: 'Redemption not found or not available' });

		const [prize] = await db
			.select({ title: prizes.title })
			.from(prizes)
			.where(and(eq(prizes.id, existing.prizeId), eq(prizes.familyId, session.familyId)))
			.limit(1);

		const occurredAt = now();
		await db.transaction(async (tx) => {
			await tx
				.update(prizeRedemptions)
				.set({ status: 'pending' })
				.where(eq(prizeRedemptions.id, redemptionId));

			await tx.insert(activityEvents).values({
				id: ulid(),
				familyId: session.familyId,
				actorMemberId: requestedMemberId,
				subjectMemberId: requestedMemberId,
				eventType: 'prize_redeemed',
				entityType: 'prize_redemption',
				entityId: redemptionId,
				deltaCoins: 0,
				metadata: JSON.stringify({
					prizeId: existing.prizeId,
					prizeTitle: prize?.title ?? 'Unknown prize',
					fromStatus: 'available',
					toStatus: 'pending',
					source: 'kiosk_prizes_redeem'
				}),
				occurredAt,
				createdAt: occurredAt
			});
		});

		logger.info({ redemptionId, memberId: requestedMemberId }, 'Prize redemption used (available → pending) - kiosk');
		return { success: true };
	}
};
