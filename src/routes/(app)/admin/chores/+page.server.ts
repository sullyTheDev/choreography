import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { chores, members, familyMembers, choreAssignments } from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const [allChores, activeMembers] = await Promise.all([
		db
			.select()
			.from(chores)
			.where(and(eq(chores.familyId, session.familyId), eq(chores.isActive, true))),
		db
			.select({ id: members.id, displayName: members.displayName, avatarEmoji: members.avatarEmoji })
			.from(familyMembers)
			.innerJoin(members, eq(familyMembers.memberId, members.id))
			.where(and(eq(familyMembers.familyId, session.familyId), eq(members.isActive, true)))
	]);

	const choreIds = allChores.map((c) => c.id);
	const assignmentRows =
		choreIds.length > 0
			? await db
					.select({ choreId: choreAssignments.choreId, memberId: choreAssignments.memberId })
					.from(choreAssignments)
					.where(inArray(choreAssignments.choreId, choreIds))
			: [];

	const assignmentMap = new Map<string, string[]>();
	for (const row of assignmentRows) {
		const list = assignmentMap.get(row.choreId) ?? [];
		list.push(row.memberId);
		assignmentMap.set(row.choreId, list);
	}

	const choresWithAssignments = allChores.map((chore) => ({
		id: chore.id,
		emoji: chore.emoji,
		title: chore.title,
		description: chore.description,
		frequency: chore.frequency,
		coinValue: chore.coinValue,
		assignedMemberIds: assignmentMap.get(chore.id) ?? []
	}));

	return { chores: choresWithAssignments, members: activeMembers };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const emoji = String(data.get('emoji') ?? '').trim();
		const frequency = String(data.get('frequency') ?? '') as 'daily' | 'weekly';
		const coinValue = parseInt(String(data.get('coinValue') ?? '0'), 10);
		const memberIds = data.getAll('memberIds').map(String).filter(Boolean);

		if (!title) return fail(400, { error: 'Title is required' });
		if (!emoji) return fail(400, { error: 'Emoji is required' });
		if (!['daily', 'weekly'].includes(frequency))
			return fail(400, { error: 'Frequency must be daily or weekly' });
		if (!Number.isInteger(coinValue) || coinValue <= 0)
			return fail(400, { error: 'Coin value must be a positive integer' });
		if (memberIds.length === 0)
			return fail(400, { error: 'At least one member must be assigned' });

		const id = ulid();
		await db.insert(chores).values({
			id,
			familyId: session.familyId,
			title,
			description,
			emoji,
			frequency,
			coinValue,
			isActive: true,
			createdAt: now()
		});

		await db.insert(choreAssignments).values(memberIds.map((memberId) => ({ choreId: id, memberId })));

		logger.info({ choreId: id, familyId: session.familyId }, 'Chore created');
		return { success: true };
	},

	update: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const choreId = String(data.get('choreId') ?? '').trim();
		const title = String(data.get('title') ?? '').trim();
		const description = String(data.get('description') ?? '').trim();
		const emoji = String(data.get('emoji') ?? '').trim();
		const frequency = String(data.get('frequency') ?? '') as 'daily' | 'weekly';
		const coinValue = parseInt(String(data.get('coinValue') ?? '0'), 10);
		const memberIds = data.getAll('memberIds').map(String).filter(Boolean);

		if (!choreId) return fail(400, { error: 'Chore ID is required' });
		if (!title) return fail(400, { error: 'Title is required' });
		if (!emoji) return fail(400, { error: 'Emoji is required' });
		if (!['daily', 'weekly'].includes(frequency))
			return fail(400, { error: 'Frequency must be daily or weekly' });
		if (!Number.isInteger(coinValue) || coinValue <= 0)
			return fail(400, { error: 'Coin value must be a positive integer' });
		if (memberIds.length === 0)
			return fail(400, { error: 'At least one member must be assigned' });

		await db
			.update(chores)
			.set({ title, description, emoji, frequency, coinValue })
			.where(and(eq(chores.id, choreId), eq(chores.familyId, session.familyId)));

		await db.delete(choreAssignments).where(eq(choreAssignments.choreId, choreId));
		await db.insert(choreAssignments).values(memberIds.map((memberId) => ({ choreId, memberId })));

		logger.info({ choreId, familyId: session.familyId }, 'Chore updated');
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

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
