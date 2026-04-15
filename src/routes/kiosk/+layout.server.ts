import { redirect, error } from '@sveltejs/kit';
import { eq, and, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { families, members, familyMembers, choreCompletions, prizeRedemptions } from '$lib/server/db/schema.js';
import { familyCode } from '$lib/server/db/utils.js';
import type { LayoutServerLoad } from './$types.js';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.session) redirect(302, '/login');
	if (locals.session.memberRole !== 'admin') error(403, 'Kiosk mode is only available to admins.');

	const { session } = locals;
	const fid = session.familyId;

	const [family] = await db.select().from(families).where(eq(families.id, fid)).limit(1);
	if (!family) redirect(302, '/login');

	const activeMembers = await db
		.select({ id: members.id, displayName: members.displayName, avatarEmoji: members.avatarEmoji })
		.from(familyMembers)
		.innerJoin(members, eq(familyMembers.memberId, members.id))
		.where(and(eq(familyMembers.familyId, fid), eq(members.isActive, true)));

	const membersWithBalances = await Promise.all(
		activeMembers.map(async (member) => {
			const [earnedRow] = await db
				.select({ total: sum(choreCompletions.coinsAwarded) })
				.from(choreCompletions)
				.where(eq(choreCompletions.memberId, member.id));
			const [spentRow] = await db
				.select({ total: sum(prizeRedemptions.coinCost) })
				.from(prizeRedemptions)
				.where(eq(prizeRedemptions.memberId, member.id));
			const coinBalance = Number(earnedRow?.total ?? 0) - Number(spentRow?.total ?? 0);
			return { id: member.id, displayName: member.displayName, avatarEmoji: member.avatarEmoji, coinBalance };
		})
	);

	const memberParam = url.searchParams.get('member');
	const validIds = new Set(membersWithBalances.map((m) => m.id));
	let activeMemberId: string | null = null;

	if (memberParam && validIds.has(memberParam)) {
		activeMemberId = memberParam;
	} else if (membersWithBalances.length > 0) {
		activeMemberId = membersWithBalances[0].id;
	}

	return {
		user: {
			id: session.user.id,
			displayName: session.user.displayName,
			role: session.memberRole,
			avatarEmoji: session.user.avatarEmoji
		},
		family: {
			id: family.id,
			name: family.name,
			familyCode: familyCode(family.id),
			leaderboardResetDay: family.leaderboardResetDay
		},
		members: membersWithBalances,
		activeMemberId
	};
};
