import type { Actions, PageServerLoad } from './$types.js';
import { fail, error, redirect } from '@sveltejs/kit';
import { eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	families,
	members,
	familyMembers,
	chores,
	choreAssignments,
	choreCompletions,
	prizes,
	prizeAssignments,
	prizeRedemptions,
	sessions
} from '$lib/server/db/schema.js';

import { SESSION_COOKIE_NAME } from '$lib/server/auth.js';
import { familyCode } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const [family] = await db.select().from(families).where(eq(families.id, session.familyId)).limit(1);
	if (!family) error(404, 'Family not found');

	return {
		family: {
			id: family.id,
			name: family.name,
			familyCode: familyCode(family.id),
			leaderboardResetDay: family.leaderboardResetDay
		}
	};
};

export const actions: Actions = {
	updateFamily: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const familyName = String(data.get('familyName') ?? '').trim();
		const resetDayRaw = data.get('leaderboardResetDay');

		const updates: Record<string, unknown> = {};

		if (familyName) {
			updates.name = familyName;
		}

		if (resetDayRaw !== null && String(resetDayRaw).trim() !== '') {
			const resetDay = parseInt(String(resetDayRaw), 10);
			if (!Number.isInteger(resetDay) || resetDay < 1 || resetDay > 7) {
				return fail(400, { error: 'Leaderboard reset day must be between 1 and 7' });
			}
			updates.leaderboardResetDay = resetDay;
		}

		if (Object.keys(updates).length > 0) {
			await db.update(families).set(updates).where(eq(families.id, session.familyId));
			logger.info({ familyId: session.familyId }, 'Family settings updated');
		}

		return { success: true };
	},

	exportData: async ({ locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		redirect(302, '/api/export');
	},

	deleteFamily: async ({ request, locals, cookies }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const confirm = String(data.get('confirm') ?? '').trim();

		if (confirm !== 'DELETE') {
			return fail(400, { error: 'Type DELETE to confirm family deletion' });
		}

		const familyId = session.familyId;

		// Delete in FK-safe order: child records first, then parent tables
		logger.warn({ familyId }, 'Deleting family — all data will be removed');

		// Collect member IDs before we delete junction rows
		const familyMemberIds = (await db.select({ memberId: familyMembers.memberId }).from(familyMembers).where(eq(familyMembers.familyId, familyId))).map(r => r.memberId);

		await db.delete(prizeRedemptions).where(eq(prizeRedemptions.familyId, familyId));
		await db.delete(choreCompletions).where(eq(choreCompletions.familyId, familyId));

		// Junction tables reference chores/prizes — delete before parent rows
		const familyChoreIds = (await db.select({ id: chores.id }).from(chores).where(eq(chores.familyId, familyId))).map(r => r.id);
		if (familyChoreIds.length) await db.delete(choreAssignments).where(inArray(choreAssignments.choreId, familyChoreIds));

		const familyPrizeIds = (await db.select({ id: prizes.id }).from(prizes).where(eq(prizes.familyId, familyId))).map(r => r.id);
		if (familyPrizeIds.length) await db.delete(prizeAssignments).where(inArray(prizeAssignments.prizeId, familyPrizeIds));

		await db.delete(prizes).where(eq(prizes.familyId, familyId));
		await db.delete(chores).where(eq(chores.familyId, familyId));
		await db.delete(sessions).where(eq(sessions.familyId, familyId));
		await db.delete(familyMembers).where(eq(familyMembers.familyId, familyId));
		await db.delete(families).where(eq(families.id, familyId));

		// Delete any members that no longer belong to any family
		if (familyMemberIds.length) {
			const stillMembered = await db
				.select({ memberId: familyMembers.memberId })
				.from(familyMembers)
				.where(inArray(familyMembers.memberId, familyMemberIds));
			const stillMemberedIds = new Set(stillMembered.map(r => r.memberId));
			const orphanIds = familyMemberIds.filter(id => !stillMemberedIds.has(id));
			if (orphanIds.length) {
				await db.delete(sessions).where(inArray(sessions.memberId, orphanIds));
				await db.delete(members).where(inArray(members.id, orphanIds));
			}
		}

		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

		return { deleted: true };
	}
};
