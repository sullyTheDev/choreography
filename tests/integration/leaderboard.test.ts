/**
 * T048 — Integration tests for leaderboard server loader.
 * Covers: ranking calculation, period boundaries, period reset behavior.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	parents,
	kids,
	chores,
	choreCompletions
} from '../../src/lib/server/db/schema.js';
import { ulid, now, getWeeklyPeriod } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';
import { eq } from 'drizzle-orm';

const getLoad = async () =>
	(await import('../../src/routes/(app)/leaderboard/+page.server.js')).load;

function parentSession(familyId: string, parentId: string) {
	return {
		id: 'sess-parent-1',
		familyId,
		userId: parentId,
		userRole: 'parent' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: parentId, displayName: 'Parent', familyId }
	};
}

function kidSession(familyId: string, kidId: string, displayName: string) {
	return {
		id: `sess-kid-${kidId}`,
		familyId,
		userId: kidId,
		userRole: 'kid' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: kidId, displayName, avatarEmoji: '🧒', familyId }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockLoadEvent(session: any, kidId?: string): any {
	return {
		locals: { session },
		url: new URL(`http://localhost/leaderboard${kidId ? `?kid=${kidId}` : ''}`),
		parent: async () => ({
			user: session.user,
			family: { id: session.familyId, name: 'Test', familyCode: 'CODE', leaderboardResetDay: 1 },
			kids: [],
			activeKidId: kidId ?? null
		})
	};
}

async function seedLeaderboardSetup() {
	const familyId = ulid();
	const parentId = ulid();
	const kidId1 = ulid();
	const kidId2 = ulid();
	const choreId = ulid();
	const choreId2 = ulid();

	await testDb.insert(families).values({
		id: familyId,
		name: 'Test Family',
		leaderboardResetDay: 1,
		createdAt: now()
	});
	await testDb.insert(parents).values({
		id: parentId,
		familyId,
		email: `parent-lb-${familyId}@example.com`,
		passwordHash: await hashPassword('password123'),
		displayName: 'Test Parent',
		createdAt: now()
	});
	await testDb.insert(kids).values([
		{
			id: kidId1,
			familyId,
			displayName: 'Emma',
			avatarEmoji: '👧',
			pin: 'hashed',
			isActive: true,
			createdAt: now()
		},
		{
			id: kidId2,
			familyId,
			displayName: 'Liam',
			avatarEmoji: '👦',
			pin: 'hashed',
			isActive: true,
			createdAt: now()
		}
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
			assignedKidId: null,
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
			assignedKidId: null,
			isActive: true,
			createdAt: now()
		}
	]);

	return { familyId, parentId, kidId1, kidId2, choreId, choreId2 };
}

type LeaderboardData = {
	period: { start: string; end: string; label: string };
	rankings: Array<{ rank: number; kidId: string; displayName: string; avatarEmoji: string; coinsEarned: number }>;
};

describe('leaderboard — load', () => {
	it('returns rankings sorted by coins earned descending', async () => {
		const { familyId, parentId, kidId1, kidId2, choreId, choreId2 } =
			await seedLeaderboardSetup();
		const load = await getLoad();

		// kid1 earns 35 coins, kid2 earns 10 coins
		const periodKey = new Date().toISOString().slice(0, 10);
		await testDb.insert(choreCompletions).values([
			{
				id: ulid(),
				choreId,
				kidId: kidId1,
				familyId,
				coinsAwarded: 10,
				periodKey,
				completedAt: now()
			},
			{
				id: ulid(),
				choreId: choreId2,
				kidId: kidId1,
				familyId,
				coinsAwarded: 25,
				periodKey,
				completedAt: now()
			},
			{
				id: ulid(),
				choreId,
				kidId: kidId2,
				familyId,
				coinsAwarded: 10,
				periodKey,
				completedAt: now()
			}
		]);

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as LeaderboardData;

		expect(result.rankings).toHaveLength(2);
		expect(result.rankings[0].displayName).toBe('Emma');
		expect(result.rankings[0].coinsEarned).toBe(35);
		expect(result.rankings[0].rank).toBe(1);
		expect(result.rankings[1].displayName).toBe('Liam');
		expect(result.rankings[1].coinsEarned).toBe(10);
		expect(result.rankings[1].rank).toBe(2);
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
		const { familyId, parentId, kidId1, choreId } = await seedLeaderboardSetup();
		const load = await getLoad();

		// Insert a completion from last week
		const oldDate = new Date();
		oldDate.setDate(oldDate.getDate() - 10);
		const oldPeriodKey = oldDate.toISOString().slice(0, 10);

		await testDb.insert(choreCompletions).values({
			id: ulid(),
			choreId,
			kidId: kidId1,
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

	it('returns 0 coins for kids with no completions this period', async () => {
		const { familyId, parentId } = await seedLeaderboardSetup();
		const load = await getLoad();

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as LeaderboardData;

		expect(result.rankings).toHaveLength(2);
		result.rankings.forEach((r) => {
			expect(r.coinsEarned).toBe(0);
		});
	});

	it('is accessible to kid role as well', async () => {
		const { familyId, kidId1 } = await seedLeaderboardSetup();
		const load = await getLoad();

		// Should not throw for kid role
		const result = (await load(mockLoadEvent(kidSession(familyId, kidId1, 'Emma')))) as LeaderboardData;
		expect(result.rankings).toBeDefined();
	});
});
