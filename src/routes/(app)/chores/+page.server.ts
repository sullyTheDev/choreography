import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { chores, choreCompletions, kids } from '$lib/server/db/schema.js';
import { ulid, now, getPeriodKey } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');

	const { activeKidId, kids: layoutKids } = await parent();

	// The active kid — from URL param or layout default
	const kidParam = url.searchParams.get('kid');
	const resolvedKidId =
		session.userRole === 'kid'
			? session.userId
			: kidParam && layoutKids.some((k) => k.id === kidParam)
				? kidParam
				: (activeKidId ?? null);

	if (!resolvedKidId) {
		return { greeting: 'Hey there! 👋', remainingCount: 0, chores: [], activeKidId: null };
	}

	const [kid] = await db.select().from(kids).where(eq(kids.id, resolvedKidId)).limit(1);
	if (!kid) error(404, 'Kid not found');

	const today = new Date();

	// Load active chores for this family (assigned to this kid or unassigned)
	const familyChores = await db
		.select()
		.from(chores)
		.where(and(eq(chores.familyId, session.familyId), eq(chores.isActive, true)));

	const visibleChores = familyChores.filter(
		(c) => c.assignedKidId === null || c.assignedKidId === resolvedKidId
	);

	// Get all completions by this kid this relevant period
	const periodKeys = new Set(visibleChores.map((c) => getPeriodKey(c.frequency, today)));
	const completionRows = await db
		.select({ choreId: choreCompletions.choreId, periodKey: choreCompletions.periodKey })
		.from(choreCompletions)
		.where(eq(choreCompletions.kidId, resolvedKidId));

	const completedSet = new Set(
		completionRows
			.filter((r) => periodKeys.has(r.periodKey))
			.map((r) => `${r.choreId}:${r.periodKey}`)
	);

	const choreList = visibleChores.map((chore) => {
		const periodKey = getPeriodKey(chore.frequency, today);
		const isCompleted = completedSet.has(`${chore.id}:${periodKey}`);
		return {
			id: chore.id,
			emoji: chore.emoji,
			title: chore.title,
			description: chore.description,
			frequency: chore.frequency,
			coinValue: chore.coinValue,
			assignedKidName: null as string | null,
			isCompleted
		};
	});

	const remainingCount = choreList.filter((c) => !c.isCompleted).length;
	const greeting = `Hey ${kid.avatarEmoji} ${kid.displayName}!`;

	return { greeting, remainingCount, chores: choreList, activeKidId: resolvedKidId };
};

export const actions: Actions = {
	complete: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) error(401, 'Unauthorized');

		const data = await request.formData();
		const choreId = String(data.get('choreId') ?? '').trim();
		const kidId = String(data.get('kidId') ?? '').trim();

		if (!choreId) return fail(400, { error: 'Chore ID is required' });

		// Determine which kid is marking the chore complete
		const effectiveKidId = session.userRole === 'kid' ? session.userId : kidId;
		if (!effectiveKidId) return fail(400, { error: 'Kid ID is required' });

		// Load the chore and verify it belongs to this family
		const [chore] = await db
			.select()
			.from(chores)
			.where(and(eq(chores.id, choreId), eq(chores.familyId, session.familyId)))
			.limit(1);

		if (!chore || !chore.isActive) return fail(404, { error: 'Chore not found' });

		// Verify the chore is accessible to this kid
		if (chore.assignedKidId !== null && chore.assignedKidId !== effectiveKidId) {
			return fail(403, { error: 'This chore is assigned to a different kid' });
		}

		const today = new Date();
		const periodKey = getPeriodKey(chore.frequency, today);

		// Check for duplicate completion in this period
		const [existing] = await db
			.select({ id: choreCompletions.id })
			.from(choreCompletions)
			.where(
				and(
					eq(choreCompletions.choreId, choreId),
					eq(choreCompletions.kidId, effectiveKidId),
					eq(choreCompletions.periodKey, periodKey)
				)
			)
			.limit(1);

		if (existing) {
			return fail(409, { error: 'Already completed this chore for the current period' });
		}

		// Compute coin balance for this kid to use as snapshot value
		const [earnedRow] = await db
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.kidId, effectiveKidId));

		const id = ulid();
		await db.insert(choreCompletions).values({
			id,
			choreId,
			kidId: effectiveKidId,
			familyId: session.familyId,
			coinsAwarded: chore.coinValue,
			periodKey,
			completedAt: now()
		});

		logger.info(
			{ completionId: id, choreId, kidId: effectiveKidId, coins: chore.coinValue },
			'Chore completed'
		);

		return { success: true };
	}
};
