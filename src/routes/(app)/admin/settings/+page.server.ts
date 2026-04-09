import type { Actions, PageServerLoad } from './$types.js';
import { fail, error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	families,
	parents,
	kids,
	chores,
	choreCompletions,
	prizes,
	prizeRedemptions,
	sessions
} from '$lib/server/db/schema.js';
import { SESSION_COOKIE_NAME } from '$lib/server/auth.js';
import { familyCode } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

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
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

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
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		redirect(302, '/api/export');
	},

	deleteFamily: async ({ request, locals, cookies }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const confirm = String(data.get('confirm') ?? '').trim();

		if (confirm !== 'DELETE') {
			return fail(400, { error: 'Type DELETE to confirm family deletion' });
		}

		const familyId = session.familyId;

		// Delete in FK-safe order: child records first, then parent tables
		logger.warn({ familyId }, 'Deleting family — all data will be removed');

		await db.delete(prizeRedemptions).where(eq(prizeRedemptions.familyId, familyId));
		await db.delete(choreCompletions).where(eq(choreCompletions.familyId, familyId));
		await db.delete(prizes).where(eq(prizes.familyId, familyId));
		await db.delete(chores).where(eq(chores.familyId, familyId));
		await db.delete(kids).where(eq(kids.familyId, familyId));
		await db.delete(sessions).where(eq(sessions.familyId, familyId));
		await db.delete(parents).where(eq(parents.familyId, familyId));
		await db.delete(families).where(eq(families.id, familyId));

		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });

		redirect(302, '/login');
	}
};
