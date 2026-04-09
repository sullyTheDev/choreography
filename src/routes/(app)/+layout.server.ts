import { redirect } from '@sveltejs/kit';
import { eq, and, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { families, kids, choreCompletions, prizeRedemptions } from '$lib/server/db/schema.js';
import { familyCode } from '$lib/server/db/utils.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session) redirect(302, '/login');

	const { session } = locals;
	const fid = session.familyId;

	const [family] = await db.select().from(families).where(eq(families.id, fid)).limit(1);
	if (!family) redirect(302, '/login');

	const activeKids = await db
		.select()
		.from(kids)
		.where(and(eq(kids.familyId, fid), eq(kids.isActive, true)));

	// Compute each kid's coin balance: SUM(earned) - SUM(spent)
	const kidsWithBalances = await Promise.all(
		activeKids.map(async (kid) => {
			const [earnedRow] = await db
				.select({ total: sum(choreCompletions.coinsAwarded) })
				.from(choreCompletions)
				.where(eq(choreCompletions.kidId, kid.id));

			const [spentRow] = await db
				.select({ total: sum(prizeRedemptions.coinCost) })
				.from(prizeRedemptions)
				.where(eq(prizeRedemptions.kidId, kid.id));

			const coinBalance = Number(earnedRow?.total ?? 0) - Number(spentRow?.total ?? 0);
			return { id: kid.id, displayName: kid.displayName, avatarEmoji: kid.avatarEmoji, coinBalance };
		})
	);

	// Resolve activeKidId from URL param or session (kid role)
	const kidParam = url.searchParams.get('kid');
	const validIds = new Set(kidsWithBalances.map((k) => k.id));
	let activeKidId: string | null = null;

	if (session.userRole === 'kid' && validIds.has(session.userId)) {
		activeKidId = session.userId;
	} else if (kidParam && validIds.has(kidParam)) {
		activeKidId = kidParam;
	} else if (kidsWithBalances.length > 0) {
		activeKidId = kidsWithBalances[0].id;
	}

	return {
		user: {
			id: session.user.id,
			displayName: session.user.displayName,
			role: session.userRole,
			avatarEmoji: session.user.avatarEmoji
		},
		family: {
			id: family.id,
			name: family.name,
			familyCode: familyCode(family.id),
			leaderboardResetDay: family.leaderboardResetDay
		},
		kids: kidsWithBalances,
		activeKidId
	};
};
