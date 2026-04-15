import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, sum } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { chores, choreCompletions, members, familyMembers, choreAssignments } from '$lib/server/db/schema.js';
import { ulid, now, getPeriodKey } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

export const load: PageServerLoad = async ({ locals, url, parent }) => {
	const { session } = locals;
	if (!session) error(401, 'Unauthorized');
	const { activeMemberId, members: layoutMembers } = await parent();
	const memberParam = url.searchParams.get('member');
	const resolvedMemberId =
		session.memberRole === 'member'
			? session.memberId
			: memberParam && layoutMembers.some((m) => m.id === memberParam)
				? memberParam
				: (activeMemberId ?? null);

	if (!resolvedMemberId) {
		return { greeting: 'Hey there! 👋', remainingCount: 0, chores: [], activeMemberId: null };
	}

	const member = layoutMembers.find((m) => m.id === resolvedMemberId);
	if (!member) error(404, 'Member not found');

	const today = new Date();

	// Load active chores for this family and filter by member's assignments
	const familyChores = await db
		.select()
		.from(chores)
		.where(and(eq(chores.familyId, session.familyId), eq(chores.isActive, true)));

	const memberAssignmentRows = await db
		.select({ choreId: choreAssignments.choreId })
		.from(choreAssignments)
		.where(eq(choreAssignments.memberId, resolvedMemberId));

	const assignedChoreIds = new Set(memberAssignmentRows.map((r) => r.choreId));
	const visibleChores = familyChores.filter((c) => assignedChoreIds.has(c.id));

	// Get all completions by this kid this relevant period
	const periodKeys = new Set(visibleChores.map((c) => getPeriodKey(c.frequency, today)));
	const completionRows = await db
		.select({ choreId: choreCompletions.choreId, periodKey: choreCompletions.periodKey })
		.from(choreCompletions)
		.where(eq(choreCompletions.memberId, resolvedMemberId));

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
	const greeting = `Hey ${member.avatarEmoji} ${member.displayName}!`;

	choreList.sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
	return { greeting, remainingCount, chores: choreList, activeMemberId: resolvedMemberId };
};

export const actions: Actions = {
	complete: async ({ request, locals }) => {
		const { session } = locals;
		if (!session) error(401, 'Unauthorized');

		const data = await request.formData();
		const choreId = String(data.get('choreId') ?? '').trim();
		const memberId = String(data.get('memberId') ?? '').trim();

		if (!choreId) return fail(400, { error: 'Chore ID is required' });

		const effectiveMemberId = session.memberRole === 'member' ? session.memberId : memberId;
		if (!effectiveMemberId) return fail(400, { error: 'Member ID is required' });

		const [targetMember] = await db
			.select({ id: members.id })
			.from(familyMembers)
			.innerJoin(members, eq(familyMembers.memberId, members.id))
			.where(
				and(
					eq(familyMembers.familyId, session.familyId),
					eq(familyMembers.memberId, effectiveMemberId),
					eq(members.isActive, true)
				)
			)
			.limit(1);

		if (!targetMember) return fail(403, { error: 'Invalid active member for this family' });

		// Load the chore and verify it belongs to this family
		const [chore] = await db
			.select()
			.from(chores)
			.where(and(eq(chores.id, choreId), eq(chores.familyId, session.familyId)))
			.limit(1);

		if (!chore || !chore.isActive) return fail(404, { error: 'Chore not found' });

		// Verify the chore is accessible to this member
		const [assignment] = await db
			.select({ choreId: choreAssignments.choreId })
			.from(choreAssignments)
			.where(
				and(eq(choreAssignments.choreId, choreId), eq(choreAssignments.memberId, effectiveMemberId))
			)
			.limit(1);

		if (!assignment) {
			return fail(403, { error: 'This chore is not assigned to you' });
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
					eq(choreCompletions.memberId, effectiveMemberId),
					eq(choreCompletions.periodKey, periodKey)
				)
			)
			.limit(1);

		if (existing) {
			return fail(409, { error: 'Already completed this chore for the current period' });
		}

		const id = ulid();
		try {
			await db.insert(choreCompletions).values({
				id,
				choreId,
				memberId: effectiveMemberId,
				familyId: session.familyId,
				coinsAwarded: chore.coinValue,
				periodKey,
				completedAt: now()
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			if (message.includes('uq_completion_period') || message.includes('UNIQUE constraint failed')) {
				return fail(409, { error: 'Already completed this chore for the current period' });
			}
			logger.error({ err, choreId, memberId: effectiveMemberId }, 'Failed to record chore completion');
			return fail(500, { error: 'Unable to complete chore right now. Please try again.' });
		}

		logger.info(
			{ completionId: id, choreId, memberId: effectiveMemberId, coins: chore.coinValue },
			'Chore completed'
		);

		return { success: true };
	}
};
