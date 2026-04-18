/**
 * T029 — Integration tests for kid chore completion server action.
 * Covers: success, duplicate prevention, coin award.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	authUser,
	authAccount,
	familyMembers,
	chores,
	choreCompletions,
	choreAssignments
} from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword, hashPin } from '../../src/lib/server/auth.js';
import { eq } from 'drizzle-orm';

const getActions = async () =>
	(await import('../../src/routes/(app)/member/chores/+page.server.js')).actions;

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(data)) fd.append(k, v);
	return fd;
}

function kidSession(familyId: string, memberId: string) {
	return {
		id: 'sess-kid-1',
		familyId,
		memberId: memberId,
		memberRole: 'member' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: memberId, displayName: 'Emma', avatarEmoji: '👧', familyId }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockKidEvent(session: ReturnType<typeof kidSession>, formDataObj: Record<string, string>): any {
	return {
		locals: { session },
		request: { formData: async () => makeFormData(formDataObj) }
	};
}

async function seedChoreSetup() {
	const familyId = ulid();
	const parentId = ulid();
	const memberId = ulid();
	const choreId = ulid();

	await testDb.insert(families).values({
		id: familyId,
		name: 'Test Family',
		leaderboardResetDay: 1,
		createdAt: now()
	});
	await testDb.insert(authUser).values({
		id: parentId,
		name: 'Test Parent',
		avatarEmoji: '🧑',
		email: `parent-${familyId}@example.com`,
		emailVerified: false,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await testDb.insert(authAccount).values({
		id: `cred_${parentId}`,
		accountId: `parent-${familyId}@example.com`,
		providerId: 'credential',
		userId: parentId,
		password: await hashPassword('password123'),
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await testDb.insert(familyMembers).values({
		memberId: parentId,
		familyId,
		role: 'admin',
		joinedAt: now()
	});
	await testDb.insert(authUser).values({
		id: memberId,
		name: 'Emma',
		avatarEmoji: '👧',
		email: null,
		emailVerified: false,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await testDb.insert(authAccount).values({
		id: `pin_${memberId}`,
		accountId: memberId,
		providerId: 'pin-auth',
		userId: memberId,
		password: await hashPin('1234'),
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await testDb.insert(familyMembers).values({
		memberId,
		familyId,
		role: 'member',
		joinedAt: now()
	});
	await testDb.insert(chores).values({
		id: choreId,
		familyId,
		title: 'Make your bed',
		description: '',
		emoji: '🛏️',
		frequency: 'daily',
		coinValue: 10,
		isActive: true,
		createdAt: now()
	});
	await testDb.insert(choreAssignments).values([
		{ choreId, memberId: parentId },
		{ choreId, memberId }
	]);

	return { familyId, parentId, memberId, choreId };
}

describe('chores — complete action', () => {
	it('records a chore completion and awards coins', async () => {
		const { familyId, memberId, choreId } = await seedChoreSetup();
		const actions = await getActions();

		const result = await actions.complete(
			mockKidEvent(kidSession(familyId, memberId), { choreId })
		);

		expect(result).toMatchObject({ success: true });

		const completions = await testDb.select().from(choreCompletions);
		expect(completions).toHaveLength(1);
		expect(completions[0].choreId).toBe(choreId);
		expect(completions[0].memberId).toBe(memberId);
		expect(completions[0].coinsAwarded).toBe(10);
		expect(completions[0].periodKey).toMatch(/^\d{4}-\d{2}-\d{2}$/); // daily format
	});

	it('prevents duplicate completions in the same period', async () => {
		const { familyId, memberId, choreId } = await seedChoreSetup();
		const actions = await getActions();

		// First completion — should succeed
		await actions.complete(mockKidEvent(kidSession(familyId, memberId), { choreId }));

		// Second completion in same period — should fail
		const result = await actions.complete(
			mockKidEvent(kidSession(familyId, memberId), { choreId })
		);

		expect((result as { status: number }).status).toBe(409);
		expect((result as { data: { error: string } }).data.error).toMatch(/already completed/i);

		// Only one completion record should exist
		const completions = await testDb.select().from(choreCompletions);
		expect(completions).toHaveLength(1);
	});

	it('respects chore assignment — rejects if assigned to different kid', async () => {
		const { familyId, parentId } = await seedChoreSetup();

		// Create a second kid
		const kid2Id = ulid();
		await testDb.insert(authUser).values({
			id: kid2Id,
			name: 'Jake',
			avatarEmoji: '👦',
			email: null,
			emailVerified: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await testDb.insert(familyMembers).values({
			memberId: kid2Id,
			familyId,
			role: 'member',
			joinedAt: now()
		});

		// Create a chore assigned only to kid2
		const kid1Id = ulid();
		await testDb.insert(authUser).values({
			id: kid1Id,
			name: 'Emma2',
			avatarEmoji: '👧',
			email: null,
			emailVerified: false,
			isActive: true,
			createdAt: new Date(),
			updatedAt: new Date()
		});
		await testDb.insert(familyMembers).values({
			memberId: kid1Id,
			familyId,
			role: 'member',
			joinedAt: now()
		});

		const assignedChoreId = ulid();
		await testDb.insert(chores).values({
			id: assignedChoreId,
			familyId,
			title: 'Jake-only chore',
			description: '',
			emoji: '🐕',
			frequency: 'daily',
			coinValue: 5,
			isActive: true,
			createdAt: now()
		});
		// Only kid2 is assigned to this chore
		await testDb.insert(choreAssignments).values({ choreId: assignedChoreId, memberId: kid2Id });

		const actions = await getActions();
		// kid1 tries to complete kid2's chore
		const result = await actions.complete(
			mockKidEvent(kidSession(familyId, kid1Id), { choreId: assignedChoreId })
		);

		expect((result as { status: number }).status).toBe(403);
	});

	it('rejects missing choreId', async () => {
		const { familyId, memberId } = await seedChoreSetup();
		const actions = await getActions();

		const result = await actions.complete(
			mockKidEvent(kidSession(familyId, memberId), { choreId: '' })
		);

		expect((result as { status: number }).status).toBe(400);
	});

	it('awards correct coin amount matching chore coinValue', async () => {
		const { familyId, memberId } = await seedChoreSetup();

		// Add a weekly chore with 25 coins
		const weeklyChoreId = ulid();
		await testDb.insert(chores).values({
			id: weeklyChoreId,
			familyId,
			title: 'Weekly task',
			description: '',
			emoji: '📚',
			frequency: 'weekly',
			coinValue: 25,
			isActive: true,
			createdAt: now()
		});
		await testDb.insert(choreAssignments).values({ choreId: weeklyChoreId, memberId });

		const actions = await getActions();
		await actions.complete(mockKidEvent(kidSession(familyId, memberId), { choreId: weeklyChoreId }));

		const completions = await testDb
			.select()
			.from(choreCompletions)
			.where(eq(choreCompletions.choreId, weeklyChoreId));

		expect(completions[0].coinsAwarded).toBe(25);
		expect(completions[0].periodKey).toMatch(/^\d{4}-W\d{2}$/); // weekly format
	});
});
