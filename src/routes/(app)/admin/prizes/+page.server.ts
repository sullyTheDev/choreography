import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { prizes } from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

	const allPrizes = await db
		.select()
		.from(prizes)
		.where(and(eq(prizes.familyId, session.familyId), eq(prizes.isActive, true)));

	return {
		prizes: allPrizes.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			coinCost: p.coinCost
		}))
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const coinCost = parseInt(String(data.get('coinCost') ?? '0'), 10);

		if (!title) return fail(400, { error: 'Title is required' });
		if (!Number.isInteger(coinCost) || coinCost <= 0)
			return fail(400, { error: 'Coin cost must be a positive integer' });

		const id = ulid();
		await db.insert(prizes).values({
			id,
			familyId: session.familyId,
			title,
			description,
			coinCost,
			isActive: true,
			createdAt: now()
		});

		logger.info({ prizeId: id, familyId: session.familyId }, 'Prize created');
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const prizeId = String(data.get('prizeId') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const coinCost = parseInt(String(data.get('coinCost') ?? '0'), 10);

		if (!prizeId) return fail(400, { error: 'Prize ID is required' });
		if (!title) return fail(400, { error: 'Title is required' });
		if (!Number.isInteger(coinCost) || coinCost <= 0)
			return fail(400, { error: 'Coin cost must be a positive integer' });

		await db
			.update(prizes)
			.set({ title, description, coinCost })
			.where(and(eq(prizes.id, prizeId), eq(prizes.familyId, session.familyId)));

		logger.info({ prizeId, familyId: session.familyId }, 'Prize updated');
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const prizeId = String(data.get('prizeId') ?? '').trim();
		if (!prizeId) return fail(400, { error: 'Prize ID is required' });

		await db
			.update(prizes)
			.set({ isActive: false })
			.where(and(eq(prizes.id, prizeId), eq(prizes.familyId, session.familyId)));

		logger.info({ prizeId, familyId: session.familyId }, 'Prize deleted');
		return { success: true };
	}
};
