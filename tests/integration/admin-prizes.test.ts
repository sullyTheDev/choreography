/**
 * T039 — Integration tests for parent prize CRUD server actions.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import { families, authUser, authAccount, familyMembers, prizes } from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';

const getActions = async () =>
	(await import('../../src/routes/(app)/admin/prizes/+page.server.js')).actions;

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
	return { familyId, parentId };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockEvent(session: ReturnType<typeof parentSession>, formDataObj: Record<string, string>): any {
	return {
		locals: { session },
		request: { formData: async () => makeFormData(formDataObj) }
	};
}

describe('admin/prizes — create action', () => {
	it('creates a prize with valid data', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				title: 'Extra screen time',
				description: '30 extra minutes',
				coinCost: '50'
			})
		);

		expect(result).toMatchObject({ success: true });

		const allPrizes = await testDb.select().from(prizes);
		expect(allPrizes).toHaveLength(1);
		expect(allPrizes[0].title).toBe('Extra screen time');
		expect(allPrizes[0].coinCost).toBe(50);
		expect(allPrizes[0].isActive).toBe(true);
	});

	it('rejects missing title', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), { title: '', coinCost: '10' })
		);

		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/title/i);
	});

	it('rejects zero coin cost', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), { title: 'Toy', coinCost: '0' })
		);

		expect((result as { status: number }).status).toBe(400);
	});
});

describe('admin/prizes — update action', () => {
	it('updates a prize', async () => {
		const { familyId, parentId } = await seedFamily();
		const prizeId = ulid();
		await testDb.insert(prizes).values({
			id: prizeId,
			familyId,
			title: 'Old Prize',
			description: '',
			coinCost: 20,
			isActive: true,
			createdAt: now()
		});

		const actions = await getActions();
		const result = await actions.update(
			mockEvent(parentSession(familyId, parentId), {
				prizeId,
				title: 'Better Prize',
				coinCost: '35'
			})
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(prizes);
		expect(updated.title).toBe('Better Prize');
		expect(updated.coinCost).toBe(35);
	});
});

describe('admin/prizes — delete action (soft-delete)', () => {
	it('sets isActive to false', async () => {
		const { familyId, parentId } = await seedFamily();
		const prizeId = ulid();
		await testDb.insert(prizes).values({
			id: prizeId,
			familyId,
			title: 'Prize to Delete',
			description: '',
			coinCost: 100,
			isActive: true,
			createdAt: now()
		});

		const actions = await getActions();
		await actions.delete(mockEvent(parentSession(familyId, parentId), { prizeId }));

		const [updated] = await testDb.select().from(prizes);
		expect(updated.isActive).toBe(false);
	});
});
