/**
 * T027 — Integration tests for parent kid CRUD server actions.
 * Uses the in-memory testDb from setup.ts (auto-applied via setupFiles).
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import { families, parents, kids } from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';

// Lazily import the server module (after vi.mock is in effect)
const getActions = async () => (await import('../../src/routes/(app)/admin/kids/+page.server.js')).actions;
const getLoad = async () => (await import('../../src/routes/(app)/admin/kids/+page.server.js')).load;

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(data)) fd.append(k, v);
	return fd;
}

function parentSession(familyId: string, userId: string) {
	return {
		id: 'sess-1',
		familyId,
		userId,
		userRole: 'parent' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: userId, displayName: 'Test Parent', familyId }
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
	await testDb.insert(parents).values({
		id: parentId,
		familyId,
		email: `parent-${familyId}@example.com`,
		passwordHash: await hashPassword('password123'),
		displayName: 'Test Parent',
		createdAt: now()
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

describe('admin/kids — create action', () => {
	it('creates a kid with valid data', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				displayName: 'Emma',
				avatarEmoji: '👧',
				pin: '1234'
			})
		);

		expect(result).toMatchObject({ success: true });

		const allKids = await testDb.select().from(kids);
		expect(allKids).toHaveLength(1);
		expect(allKids[0].displayName).toBe('Emma');
		expect(allKids[0].avatarEmoji).toBe('👧');
		expect(allKids[0].familyId).toBe(familyId);
		expect(allKids[0].isActive).toBe(true);
	});

	it('rejects missing display name', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				displayName: '',
				avatarEmoji: '👧',
				pin: '1234'
			})
		);

		// ActionFailure has status and data
		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/display name/i);
	});

	it('rejects invalid PIN format', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				displayName: 'Jake',
				avatarEmoji: '👦',
				pin: 'abc'
			})
		);

		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/PIN/i);
	});
});

describe('admin/kids — update action', () => {
	it('updates a kid display name', async () => {
		const { familyId, parentId } = await seedFamily();
		const kidId = ulid();
		await testDb.insert(kids).values({
			id: kidId,
			familyId,
			displayName: 'Emma',
			avatarEmoji: '👧',
			pin: 'hashed',
			isActive: true,
			createdAt: now()
		});

		const actions = await getActions();
		const result = await actions.update(
			mockEvent(parentSession(familyId, parentId), {
				kidId,
				displayName: 'Emma Belle',
				avatarEmoji: '👧'
			})
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(kids);
		expect(updated.displayName).toBe('Emma Belle');
	});
});

describe('admin/kids — deactivate action', () => {
	it('sets isActive to false', async () => {
		const { familyId, parentId } = await seedFamily();
		const kidId = ulid();
		await testDb.insert(kids).values({
			id: kidId,
			familyId,
			displayName: 'Emma',
			avatarEmoji: '👧',
			pin: 'hashed',
			isActive: true,
			createdAt: now()
		});

		const actions = await getActions();
		const result = await actions.deactivate(
			mockEvent(parentSession(familyId, parentId), { kidId })
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(kids);
		expect(updated.isActive).toBe(false);
	});

	it('rejects missing kidId', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.deactivate(
			mockEvent(parentSession(familyId, parentId), { kidId: '' })
		);

		expect((result as { status: number }).status).toBe(400);
	});
});
