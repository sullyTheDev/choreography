import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { chores, kids } from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

	const [allChores, activeKids] = await Promise.all([
		db
			.select()
			.from(chores)
			.where(and(eq(chores.familyId, session.familyId), eq(chores.isActive, true))),
		db
			.select({ id: kids.id, displayName: kids.displayName })
			.from(kids)
			.where(and(eq(kids.familyId, session.familyId), eq(kids.isActive, true)))
	]);

	const kidMap = new Map(activeKids.map((k) => [k.id, k]));
	const choresWithKid = allChores.map((chore) => ({
		id: chore.id,
		emoji: chore.emoji,
		title: chore.title,
		description: chore.description,
		frequency: chore.frequency,
		coinValue: chore.coinValue,
		assignedKid: chore.assignedKidId ? (kidMap.get(chore.assignedKidId) ?? null) : null
	}));

	return { chores: choresWithKid, kids: activeKids };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const emoji = String(data.get('emoji') ?? '').trim();
		const frequency = String(data.get('frequency') ?? '') as 'daily' | 'weekly';
		const coinValue = parseInt(String(data.get('coinValue') ?? '0'), 10);
		const assignedKidId = String(data.get('assignedKidId') ?? '').trim() || null;

		if (!title) return fail(400, { error: 'Title is required' });
		if (!emoji) return fail(400, { error: 'Emoji is required' });
		if (!['daily', 'weekly'].includes(frequency))
			return fail(400, { error: 'Frequency must be daily or weekly' });
		if (!Number.isInteger(coinValue) || coinValue <= 0)
			return fail(400, { error: 'Coin value must be a positive integer' });

		const id = ulid();
		await db.insert(chores).values({
			id,
			familyId: session.familyId,
			title,
			description,
			emoji,
			frequency,
			coinValue,
			assignedKidId,
			isActive: true,
			createdAt: now()
		});

		logger.info({ choreId: id, familyId: session.familyId }, 'Chore created');
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const choreId = String(data.get('choreId') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const emoji = String(data.get('emoji') ?? '').trim();
		const frequency = String(data.get('frequency') ?? '') as 'daily' | 'weekly';
		const coinValue = parseInt(String(data.get('coinValue') ?? '0'), 10);
		const assignedKidId = String(data.get('assignedKidId') ?? '').trim() || null;

		if (!choreId) return fail(400, { error: 'Chore ID is required' });
		if (!title) return fail(400, { error: 'Title is required' });
		if (!emoji) return fail(400, { error: 'Emoji is required' });
		if (!['daily', 'weekly'].includes(frequency))
			return fail(400, { error: 'Frequency must be daily or weekly' });
		if (!Number.isInteger(coinValue) || coinValue <= 0)
			return fail(400, { error: 'Coin value must be a positive integer' });

		await db
			.update(chores)
			.set({ title, description, emoji, frequency, coinValue, assignedKidId })
			.where(and(eq(chores.id, choreId), eq(chores.familyId, session.familyId)));

		logger.info({ choreId, familyId: session.familyId }, 'Chore updated');
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

		const data = await request.formData();
		const choreId = String(data.get('choreId') ?? '').trim();
		if (!choreId) return fail(400, { error: 'Chore ID is required' });

		await db
			.update(chores)
			.set({ isActive: false })
			.where(and(eq(chores.id, choreId), eq(chores.familyId, session.familyId)));

		logger.info({ choreId, familyId: session.familyId }, 'Chore deleted');
		return { success: true };
	}
};
