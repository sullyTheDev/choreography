import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { kids, choreCompletions, prizeRedemptions } from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { hashPin, verifyPin } from '$lib/server/auth.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

	const allKids = await db.select().from(kids).where(eq(kids.familyId, session.familyId));

	const kidsWithBalances = await Promise.all(
		allKids.map(async (kid) => {
			const [earnedRow] = await db
				.select({ total: sum(choreCompletions.coinsAwarded) })
				.from(choreCompletions)
				.where(eq(choreCompletions.kidId, kid.id));

			const [spentRow] = await db
				.select({ total: sum(prizeRedemptions.coinCost) })
				.from(prizeRedemptions)
				.where(eq(prizeRedemptions.kidId, kid.id));

			return {
				id: kid.id,
				displayName: kid.displayName,
				avatarEmoji: kid.avatarEmoji,
				coinBalance: Number(earnedRow?.total ?? 0) - Number(spentRow?.total ?? 0),
				isActive: kid.isActive
			};
		})
	);

	return { kids: kidsWithBalances };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const displayName = String(data.get('displayName') ?? '').trim();
		const avatarEmoji = String(data.get('avatarEmoji') ?? '').trim();
		const pin = String(data.get('pin') ?? '').trim();

		if (!displayName) return fail(400, { error: 'Display name is required' });
		if (!avatarEmoji) return fail(400, { error: 'Avatar emoji is required' });
		if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4–6 digits' });

		const existingPins = await db
			.select({ pin: kids.pin })
			.from(kids)
			.where(eq(kids.familyId, session.familyId));
		for (const row of existingPins) {
			if (await verifyPin(pin, row.pin)) return fail(400, { error: 'That PIN is already used by another child in this family.' });
		}

		const id = ulid();
		await db.insert(kids).values({
			id,
			familyId: session.familyId,
			displayName,
			avatarEmoji,
			pin: await hashPin(pin),
			isActive: true,
			createdAt: now()
		});

		logger.info({ kidId: id, familyId: session.familyId }, 'Kid created');
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const kidId = String(data.get('kidId') ?? '').trim();
		const displayName = String(data.get('displayName') ?? '').trim();
		const avatarEmoji = String(data.get('avatarEmoji') ?? '').trim();
		const pin = String(data.get('pin') ?? '').trim();

		if (!kidId) return fail(400, { error: 'Kid ID is required' });
		if (!displayName) return fail(400, { error: 'Display name is required' });
		if (!avatarEmoji) return fail(400, { error: 'Avatar emoji is required' });

		const updates: Record<string, unknown> = { displayName, avatarEmoji };
		if (pin) {
			if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4–6 digits' });
			const existingPins = await db
				.select({ id: kids.id, pin: kids.pin })
				.from(kids)
				.where(eq(kids.familyId, session.familyId));
			for (const row of existingPins) {
				if (row.id === kidId) continue;
				if (await verifyPin(pin, row.pin)) return fail(400, { error: 'That PIN is already used by another child in this family.' });
			}
			updates.pin = await hashPin(pin);
		}

		await db
			.update(kids)
			.set(updates)
			.where(and(eq(kids.id, kidId), eq(kids.familyId, session.familyId)));

		logger.info({ kidId, familyId: session.familyId }, 'Kid updated');
		return { success: true };
	},

	deactivate: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const kidId = String(data.get('kidId') ?? '').trim();
		if (!kidId) return fail(400, { error: 'Kid ID is required' });

		await db
			.update(kids)
			.set({ isActive: false })
			.where(and(eq(kids.id, kidId), eq(kids.familyId, session.familyId)));

		logger.info({ kidId, familyId: session.familyId }, 'Kid deactivated');
		return { success: true };
	}
};
