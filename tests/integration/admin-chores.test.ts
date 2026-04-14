/**
 * T028 — Integration tests for parent chore CRUD server actions.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import { families, members, familyMembers, chores } from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';

const getActions = async () =>
	(await import('../../src/routes/(app)/admin/chores/+page.server.js')).actions;

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(data)) fd.append(k, v);
	return fd;
}

function parentSession(familyId: string, memberId: string) {
	return {
		id: 'sess-1',
		familyId,
		memberId,
		memberRole: 'admin' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: memberId, displayName: 'Test Parent', familyId }
	};
}

async function seedFamily() {
	const familyId = ulid();
	const parentId = ulid();
	await testDb.insert(families).values({
		id: familyId,
		name: 'Test Family',
		leaderboardResetDay: 1,
		createdAt: now()
	});
	await testDb.insert(members).values({
		id: parentId,
		displayName: 'Test Parent',
		avatarEmoji: '🧑',
		email: `parent-${familyId}@example.com`,
		passwordHash: await hashPassword('password123'),
		pin: null,
		isActive: true,
		createdAt: now()
	});
	await testDb.insert(familyMembers).values({
		memberId: parentId,
		familyId,
		role: 'admin',
		joinedAt: now()
	});
	return { familyId, parentId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockEvent(session: ReturnType<typeof parentSession>, formDataObj: Record<string, string>): any {
	return {
		locals: { session },
		request: { formData: async () => makeFormData(formDataObj) }
	};
}

describe('admin/chores — create action', () => {
	it('creates a chore with valid data', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				title: 'Make your bed',
				description: 'Neatly make your bed',
				emoji: '🛏️',
				frequency: 'daily',
				coinValue: '10'
			})
		);

		expect(result).toMatchObject({ success: true });

		const allChores = await testDb.select().from(chores);
		expect(allChores).toHaveLength(1);
		expect(allChores[0].title).toBe('Make your bed');
		expect(allChores[0].frequency).toBe('daily');
		expect(allChores[0].coinValue).toBe(10);
		expect(allChores[0].isActive).toBe(true);
	});

	it('rejects invalid frequency', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				title: 'Test',
				emoji: '🛏️',
				frequency: 'hourly',
				coinValue: '5'
			})
		);

		expect((result as { status: number }).status).toBe(400);
	});

	it('rejects zero or negative coinValue', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				title: 'Test',
				emoji: '🛏️',
				frequency: 'daily',
				coinValue: '0'
			})
		);

		expect((result as { status: number }).status).toBe(400);
	});

	it('rejects missing title', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				title: '',
				emoji: '🛏️',
				frequency: 'daily',
				coinValue: '10'
			})
		);

		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/title/i);
	});
});

describe('admin/chores — update action', () => {
	it('updates a chore', async () => {
		const { familyId, parentId } = await seedFamily();
		const choreId = ulid();
		await testDb.insert(chores).values({
			id: choreId,
			familyId,
			title: 'Old Title',
			description: '',
			emoji: '🛏️',
			frequency: 'daily',
			coinValue: 5,
			assignedMemberId: null,
			isActive: true,
			createdAt: now()
		});

		const actions = await getActions();
		const result = await actions.update(
			mockEvent(parentSession(familyId, parentId), {
				choreId,
				title: 'New Title',
				emoji: '🍽️',
				frequency: 'weekly',
				coinValue: '15'
			})
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(chores);
		expect(updated.title).toBe('New Title');
		expect(updated.frequency).toBe('weekly');
		expect(updated.coinValue).toBe(15);
	});
});

describe('admin/chores — delete action (soft-delete)', () => {
	it('sets isActive to false', async () => {
		const { familyId, parentId } = await seedFamily();
		const choreId = ulid();
		await testDb.insert(chores).values({
			id: choreId,
			familyId,
			title: 'Test Chore',
			description: '',
			emoji: '🛏️',
			frequency: 'daily',
			coinValue: 10,
			assignedMemberId: null,
			isActive: true,
			createdAt: now()
		});

		const actions = await getActions();
		await actions.delete(mockEvent(parentSession(familyId, parentId), { choreId }));

		const [updated] = await testDb.select().from(chores);
		expect(updated.isActive).toBe(false);
	});
});
