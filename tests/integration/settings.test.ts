/**
 * T057 — Integration tests for settings CRUD and family deletion.
 * Covers: updateFamily, deleteFamily (cascades all data + invalidates sessions).
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	authUser,
	authAccount,
	authSession,
	familyMembers,
	chores,
	choreCompletions,
	prizes,
	prizeRedemptions
} from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword, hashPin } from '../../src/lib/server/auth.js';
import { eq } from 'drizzle-orm';

const getLoad = async () =>
	(await import('../../src/routes/(app)/admin/settings/+page.server.js')).load;
const getActions = async () =>
	(await import('../../src/routes/(app)/admin/settings/+page.server.js')).actions;

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(data)) fd.append(k, v);
	return fd;
}

function parentSession(familyId: string, memberId: string) {
	return {
		id: `sess-${memberId}`,
		familyId,
		memberId,
		memberRole: 'admin' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: memberId, displayName: 'Test Parent', familyId }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockLoadEvent(session: ReturnType<typeof parentSession>): any {
	return {
		locals: { session }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockEvent(session: ReturnType<typeof parentSession>, formDataObj: Record<string, string>, cookiesFn?: any): any {
	return {
		locals: { session },
		request: { formData: async () => makeFormData(formDataObj) },
		cookies: cookiesFn ?? {
			delete: () => {},
			get: () => undefined,
			set: () => {}
		}
	};
}

async function seedFullFamily() {
	const familyId = ulid();
	const parentId = ulid();
	const memberId = ulid();
	const choreId = ulid();
	const prizeId = ulid();
	const sessionId = `sess-${parentId}`;

	await testDb.insert(families).values({
		id: familyId,
		name: 'Full Family',
		leaderboardResetDay: 1,
		createdAt: now()
	});
	await testDb.insert(authUser).values({
		id: parentId,
		name: 'Full Parent',
		avatarEmoji: '🧑',
		email: `full-${familyId}@example.com`,
		emailVerified: false,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await testDb.insert(authAccount).values({
		id: `cred_${parentId}`,
		accountId: `full-${familyId}@example.com`,
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
		name: 'Test Kid',
		avatarEmoji: '🧒',
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
		title: 'Test Chore',
		description: '',
		emoji: '🧹',
		frequency: 'daily',
		coinValue: 10,
		isActive: true,
		createdAt: now()
	});
	await testDb.insert(prizes).values({
		id: prizeId,
		familyId,
		title: 'Test Prize',
		description: '',
		coinCost: 20,
		isActive: true,
		createdAt: now()
	});
	await testDb.insert(choreCompletions).values({
		id: ulid(),
		choreId,
		memberId,
		familyId,
		coinsAwarded: 10,
		periodKey: new Date().toISOString().slice(0, 10),
		completedAt: now()
	});
	await testDb.insert(prizeRedemptions).values({
		id: ulid(),
		prizeId,
		memberId,
		familyId,
		coinCost: 20,
		redeemedAt: now()
	});
	await testDb.insert(authSession).values({
		id: sessionId,
		token: `token_${sessionId}`,
		userId: parentId,
		expiresAt: new Date(Date.now() + 86_400_000),
		createdAt: new Date(),
		updatedAt: new Date()
	});

	return { familyId, parentId, memberId, choreId, prizeId, sessionId };
}

describe('admin/settings — load', () => {
	it('returns family data for parent', async () => {
		const { familyId, parentId } = await seedFullFamily();
		const load = await getLoad();

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as {
			family: { id: string; name: string; familyCode: string; leaderboardResetDay: number };
		};

		expect(result.family).toMatchObject({
			id: familyId,
			name: 'Full Family',
			leaderboardResetDay: 1
		});
	});
});

describe('admin/settings — updateFamily action', () => {
	it('updates family name', async () => {
		const { familyId, parentId } = await seedFullFamily();
		const actions = await getActions();

		const result = await actions.updateFamily(
			mockEvent(parentSession(familyId, parentId), {
				familyName: 'Updated Family Name'
			})
		);

		expect(result).toMatchObject({ success: true });

		const [updated] = await testDb.select().from(families).where(eq(families.id, familyId));
		expect(updated.name).toBe('Updated Family Name');
	});

	it('updates leaderboardResetDay', async () => {
		const { familyId, parentId } = await seedFullFamily();
		const actions = await getActions();

		await actions.updateFamily(
			mockEvent(parentSession(familyId, parentId), {
				leaderboardResetDay: '3'
			})
		);

		const [updated] = await testDb.select().from(families).where(eq(families.id, familyId));
		expect(updated.leaderboardResetDay).toBe(3);
	});

	it('rejects invalid leaderboardResetDay', async () => {
		const { familyId, parentId } = await seedFullFamily();
		const actions = await getActions();

		const result = await actions.updateFamily(
			mockEvent(parentSession(familyId, parentId), {
				leaderboardResetDay: '9'
			})
		);

		expect(result).toMatchObject({ data: { error: expect.stringContaining('reset day') } });
	});
});

describe('admin/settings — deleteFamily action', () => {
	it('deletes all family data and sessions', async () => {
		const { familyId, parentId, memberId, choreId, prizeId, sessionId } =
			await seedFullFamily();
		const actions = await getActions();

		let deletedCookieName = '';
		const mockCookies = {
			delete: (name: string) => { deletedCookieName = name; },
			get: () => undefined,
			set: () => {}
		};

		await expect(
			actions.deleteFamily(
				mockEvent(parentSession(familyId, parentId), { confirm: 'DELETE' }, mockCookies)
			)
		).rejects.toMatchObject({ status: 302 }); // redirect after deletion

		// Verify all data is gone
		const [family] = await testDb.select().from(families).where(eq(families.id, familyId));
		expect(family).toBeUndefined();

		const remainingFamilyMembers = await testDb
			.select()
			.from(familyMembers)
			.where(eq(familyMembers.familyId, familyId));
		expect(remainingFamilyMembers).toHaveLength(0);

		const remainingChores = await testDb.select().from(chores).where(eq(chores.familyId, familyId));
		expect(remainingChores).toHaveLength(0);

		const remainingPrizes = await testDb.select().from(prizes).where(eq(prizes.familyId, familyId));
		expect(remainingPrizes).toHaveLength(0);

		const remainingCompletions = await testDb.select().from(choreCompletions).where(eq(choreCompletions.familyId, familyId));
		expect(remainingCompletions).toHaveLength(0);

		const remainingRedemptions = await testDb.select().from(prizeRedemptions).where(eq(prizeRedemptions.familyId, familyId));
		expect(remainingRedemptions).toHaveLength(0);

		const remainingSessions = await testDb.select().from(authSession).where(eq(authSession.userId, parentId));
		expect(remainingSessions).toHaveLength(0);
	});

	it('requires confirm=DELETE to proceed', async () => {
		const { familyId, parentId } = await seedFullFamily();
		const actions = await getActions();

		const result = await actions.deleteFamily(
			mockEvent(parentSession(familyId, parentId), { confirm: 'wrong' })
		);

		expect(result).toMatchObject({ data: { error: expect.any(String) } });

		// Family should still exist
		const [family] = await testDb.select().from(families).where(eq(families.id, familyId));
		expect(family).toBeDefined();
	});
});
