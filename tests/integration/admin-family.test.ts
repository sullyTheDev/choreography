/**
 * T027 — Integration tests for admin family member CRUD server actions.
 * Uses the in-memory testDb from setup.ts (auto-applied via setupFiles).
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import { families, authUser, authAccount, familyMembers } from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword, hashPin } from '../../src/lib/server/auth.js';
import { eq } from 'drizzle-orm';

// Lazily import the server module (after vi.mock is in effect)
const getActions = async () => (await import('../../src/routes/(app)/admin/family/+page.server.js')).actions;

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

describe('admin/family — create action', () => {
	it('creates a member with valid data', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				displayName: 'Emma',
				avatarEmoji: '👧',
				role: 'member',
				pin: '1234'
			})
		);

		expect(result).toMatchObject({ success: true });

		const allMembers = await testDb.select().from(authUser);
		expect(allMembers).toHaveLength(2);
		const created = allMembers.find((m) => m.name === 'Emma');
		expect(created).toBeDefined();
		expect(created?.avatarEmoji).toBe('👧');
		expect(created?.isActive).toBe(true);

		const links = await testDb.select().from(familyMembers);
		expect(links.some((l) => l.familyId === familyId && l.role === 'member')).toBe(true);
	});

	it('rejects missing display name', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				displayName: '',
				avatarEmoji: '👧',
				role: 'member',
				pin: '1234'
			})
		);

		// ActionFailure has status and data
		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/display name/i);
	});

	it('rejects invalid pin format', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.create(
			mockEvent(parentSession(familyId, parentId), {
				displayName: 'Jake',
				avatarEmoji: '👦',
				role: 'member',
				pin: 'abc'
			})
		);

		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/pin/i);
	});
});

describe('admin/family — update action', () => {
	it('updates a member display name', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = ulid();
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

		const actions = await getActions();
		const result = await actions.update(
			mockEvent(parentSession(familyId, parentId), {
				id: memberId,
				displayName: 'Emma Belle',
				avatarEmoji: '👧',
				role: 'member',
				pin: '4567'
			})
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(authUser).where(eq(authUser.id, memberId));
		expect(updated.name).toBe('Emma Belle');
	});
});

describe('admin/family — deactivate action', () => {
	it('sets isActive to false', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = ulid();
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

		const actions = await getActions();
		const result = await actions.deactivate(
			mockEvent(parentSession(familyId, parentId), { id: memberId })
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(authUser).where(eq(authUser.id, memberId));
		expect(updated.isActive).toBe(false);
	});

	it('rejects missing id', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();

		const result = await actions.deactivate(
			mockEvent(parentSession(familyId, parentId), { id: '' })
		);

		expect((result as { status: number }).status).toBe(400);
	});
});

describe('admin/family — reactivate action', () => {
	it('sets isActive back to true', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = ulid();
		await testDb.insert(authUser).values({
			id: memberId,
			name: 'Emma',
			avatarEmoji: '👧',
			email: null,
			emailVerified: false,
			isActive: false,
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

		const actions = await getActions();
		const result = await actions.reactivate(
			mockEvent(parentSession(familyId, parentId), { id: memberId })
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(authUser).where(eq(authUser.id, memberId));
		expect(updated.isActive).toBe(true);
	});
});
