/**
 * T048 — Integration tests for leaderboard server loader.
 * Covers: ranking calculation, period boundaries, period reset behavior.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	members,
	familyMembers,
	chores,
	choreCompletions
} from '../../src/lib/server/db/schema.js';
import { ulid, now, getWeeklyPeriod } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';
import { eq } from 'drizzle-orm';

const getLoad = async () =>
	(await import('../../src/routes/(app)/member/leaderboard/+page.server.js')).load;

function parentSession(familyId: string, parentId: string) {
	return {
		id: 'sess-parent-1',
		familyId,
		memberId: parentId,
		memberRole: 'admin' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: parentId, displayName: 'Parent', familyId }
	};
}

function kidSession(familyId: string, memberId: string, displayName: string) {
	return {
		id: `sess-kid-${memberId}`,
		familyId,
		memberId: memberId,
		memberRole: 'member' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: memberId, displayName, avatarEmoji: '🧒', familyId }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockLoadEvent(session: any, memberId?: string): any {
	return {
		locals: { session },
		url: new URL(`http://localhost/leaderboard${memberId ? `?member=${memberId}` : ''}`),
		parent: async () => ({
			user: session.user,
			family: { id: session.familyId, name: 'Test', familyCode: 'CODE', leaderboardResetDay: 1 },
			members: [],
			activeMemberId: memberId ?? null
		})
	};
}

async function seedLeaderboardSetup() {
	const familyId = ulid();
	const parentId = ulid();
	const memberId1 = ulid();
	const memberId2 = ulid();
	const choreId = ulid();
	const choreId2 = ulid();

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
		email: `parent-lb-${familyId}@example.com`,
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
	await testDb.insert(members).values([
		{
			id: memberId1,
			displayName: 'Emma',
			avatarEmoji: '👧',
			email: null,
			passwordHash: null,
			pin: 'hashed',
			isActive: true,
			createdAt: now()
		},
		{
			id: memberId2,
			displayName: 'Liam',
			avatarEmoji: '👦',
			email: null,
			passwordHash: null,
			pin: 'hashed',
			isActive: true,
			createdAt: now()
		}
	]);
	await testDb.insert(familyMembers).values([
		{ memberId: memberId1, familyId, role: 'member', joinedAt: now() },
		{ memberId: memberId2, familyId, role: 'member', joinedAt: now() }
	]);
	await testDb.insert(chores).values([
		{
			id: choreId,
			familyId,
			title: 'Make your bed',
			description: '',
			emoji: '🛏️',
			frequency: 'daily',
			coinValue: 10,
			isActive: true,
			createdAt: now()
		},
		{
			id: choreId2,
			familyId,
			title: 'Set the table',
			description: '',
			emoji: '🍽️',
			frequency: 'daily',
			coinValue: 25,
			isActive: true,
			createdAt: now()
		}
	]);

	return { familyId, parentId, memberId1, memberId2, choreId, choreId2 };
}

type LeaderboardData = {
	period: { start: string; end: string; label: string };
	rankings: Array<{ rank: number; memberId: string; displayName: string; avatarEmoji: string; coinsEarned: number }>;
};

describe('leaderboard — load', () => {
	it('returns rankings sorted by coins earned descending', async () => {
		const { familyId, parentId, memberId1, memberId2, choreId, choreId2 } =
			await seedLeaderboardSetup();
		const load = await getLoad();

		// kid1 earns 35 coins, kid2 earns 10 coins
		const periodKey = new Date().toISOString().slice(0, 10);
		await testDb.insert(choreCompletions).values([
			{
				id: ulid(),
				choreId,
				memberId: memberId1,
				familyId,
				coinsAwarded: 10,
				periodKey,
				completedAt: now()
			},
			{
				id: ulid(),
				choreId: choreId2,
				memberId: memberId1,
				familyId,
				coinsAwarded: 25,
				periodKey,
				completedAt: now()
			},
			{
				id: ulid(),
				choreId,
				memberId: memberId2,
				familyId,
				coinsAwarded: 10,
				periodKey,
				completedAt: now()
			}
		]);

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as LeaderboardData;

		expect(result.rankings).toHaveLength(3);
		expect(result.rankings[0].displayName).toBe('Emma');
		expect(result.rankings[0].coinsEarned).toBe(35);
		expect(result.rankings[0].rank).toBe(1);
		expect(result.rankings[1].displayName).toBe('Liam');
		expect(result.rankings[1].coinsEarned).toBe(10);
		expect(result.rankings[1].rank).toBe(2);
		expect(result.rankings[2].displayName).toBe('Test Parent');
		expect(result.rankings[2].coinsEarned).toBe(0);
		expect(result.rankings[2].rank).toBe(3);
	});

	it('returns period label and start/end dates', async () => {
		const { familyId, parentId } = await seedLeaderboardSetup();
		const load = await getLoad();

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as LeaderboardData;

		expect(result.period).toHaveProperty('label');
		expect(result.period).toHaveProperty('start');
		expect(result.period).toHaveProperty('end');
		expect(typeof result.period.label).toBe('string');
		expect(result.period.label).toMatch(/[A-Z][a-z]{2} \d+/); // e.g. "Apr 7 – Apr 13"
	});

	it('excludes completions outside the current period', async () => {
		const { familyId, parentId, memberId1, choreId } = await seedLeaderboardSetup();
		const load = await getLoad();

		// Insert a completion from last week
		const oldDate = new Date();
		oldDate.setDate(oldDate.getDate() - 10);
		const oldPeriodKey = oldDate.toISOString().slice(0, 10);

		await testDb.insert(choreCompletions).values({
			id: ulid(),
			choreId,
			memberId: memberId1,
			familyId,
			coinsAwarded: 100,
			periodKey: oldPeriodKey,
			completedAt: oldDate.toISOString()
		});

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as LeaderboardData;

		// kid1 should have 0 coins in current period (only old data exists)
		const emma = result.rankings.find((r) => r.displayName === 'Emma');
		expect(emma?.coinsEarned ?? 0).toBe(0);
	});

	it('returns 0 coins for members with no completions this period', async () => {
		const { familyId, parentId } = await seedLeaderboardSetup();
		const load = await getLoad();

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as LeaderboardData;

		expect(result.rankings).toHaveLength(3);
		result.rankings.forEach((r) => {
			expect(r.coinsEarned).toBe(0);
		});
	});

	it('is accessible to member role as well', async () => {
		const { familyId, memberId1 } = await seedLeaderboardSetup();
		const load = await getLoad();

		// Should not throw for kid role
		const result = (await load(mockLoadEvent(kidSession(familyId, memberId1, 'Emma')))) as LeaderboardData;
		expect(result.rankings).toBeDefined();
	});
});
