import type { LayoutServerLoad } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { choreCompletions, prizeRedemptions } from '$lib/server/db/schema.js';

export const load: LayoutServerLoad = async ({ locals, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { activeMemberId } = await parent();
	const effectiveMemberId = activeMemberId ?? null;

	if (!effectiveMemberId) {
		return {
			activeMemberId: null,
			coinBalance: 0,
			memberRole: session.memberRole
		};
	}

	const [earnedRow, spentRow] = await Promise.all([
		db
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.memberId, effectiveMemberId)),
		db
			.select({ total: sum(prizeRedemptions.coinCost) })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.memberId, effectiveMemberId))
	]);

	const coinBalance = Number(earnedRow[0]?.total ?? 0) - Number(spentRow[0]?.total ?? 0);

	return {
		activeMemberId: effectiveMemberId,
		coinBalance,
		memberRole: session.memberRole
	};
};
