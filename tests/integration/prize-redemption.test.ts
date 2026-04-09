/**
 * T040 — Integration tests for kid prize redemption.
 * Covers: success, insufficient coins, balance update, SC-006 coin consistency.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	parents,
	kids,
	chores,
	prizes,
	choreCompletions,
	prizeRedemptions
} from '../../src/lib/server/db/schema.js';
import { ulid, now, getPeriodKey } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';
import { eq, sum } from 'drizzle-orm';

const getActions = async () =>
	(await import('../../src/routes/(app)/prizes/+page.server.js')).actions;

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(data)) fd.append(k, v);
	return fd;
}

function kidSession(familyId: string, kidId: string, kidDisplayName = 'Emma') {
	return {
		id: 'sess-kid-1',
		familyId,
		userId: kidId,
		userRole: 'kid' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: kidId, displayName: kidDisplayName, avatarEmoji: '👧', familyId }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockEvent(session: ReturnType<typeof kidSession>, formDataObj: Record<string, string>): any {
	return {
		locals: { session },
		request: { formData: async () => makeFormData(formDataObj) }
	};
}

async function seedRedemptionSetup(kidCoinBalance: number) {
	const familyId = ulid();
	const parentId = ulid();
	const kidId = ulid();
	const choreId = ulid();
	const prizeId = ulid();

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
	await testDb.insert(kids).values({
		id: kidId,
		familyId,
		displayName: 'Emma',
		avatarEmoji: '👧',
		pin: 'hashed',
		isActive: true,
		createdAt: now()
	});

	// Give the kid some coins via chore completions
	if (kidCoinBalance > 0) {
		await testDb.insert(chores).values({
			id: choreId,
			familyId,
			title: 'Test Chore',
			description: '',
			emoji: '🛏️',
			frequency: 'daily',
			coinValue: kidCoinBalance,
			assignedKidId: null,
			isActive: true,
			createdAt: now()
		});
		await testDb.insert(choreCompletions).values({
			id: ulid(),
			choreId,
			kidId,
			familyId,
			coinsAwarded: kidCoinBalance,
			periodKey: getPeriodKey('daily', new Date()),
			completedAt: now()
		});
	}

	await testDb.insert(prizes).values({
		id: prizeId,
		familyId,
		title: 'Extra screen time',
		description: '30 min',
		coinCost: 50,
		isActive: true,
		createdAt: now()
	});

	return { familyId, kidId, prizeId, choreId };
}

describe('prizes — redeem action', () => {
	it('redeems a prize when kid has sufficient coins', async () => {
		const { familyId, kidId, prizeId } = await seedRedemptionSetup(100);
		const actions = await getActions();

		const result = await actions.redeem(
			mockEvent(kidSession(familyId, kidId), { prizeId })
		);

		expect(result).toMatchObject({ success: true });

		const redemptions = await testDb.select().from(prizeRedemptions);
		expect(redemptions).toHaveLength(1);
		expect(redemptions[0].prizeId).toBe(prizeId);
		expect(redemptions[0].kidId).toBe(kidId);
		expect(redemptions[0].coinCost).toBe(50);
	});

	it('rejects redemption when kid has insufficient coins', async () => {
		const { familyId, kidId, prizeId } = await seedRedemptionSetup(30); // needs 50
		const actions = await getActions();

		const result = await actions.redeem(
			mockEvent(kidSession(familyId, kidId), { prizeId })
		);

		expect((result as { status: number }).status).toBe(400);
		expect((result as { data: { error: string } }).data.error).toMatch(/not enough coins/i);

		const redemptions = await testDb.select().from(prizeRedemptions);
		expect(redemptions).toHaveLength(0);
	});

	it('rejects redemption when kid has zero coins', async () => {
		const { familyId, kidId, prizeId } = await seedRedemptionSetup(0);
		const actions = await getActions();

		const result = await actions.redeem(
			mockEvent(kidSession(familyId, kidId), { prizeId })
		);

		expect((result as { status: number }).status).toBe(400);
	});

	it('SC-006: coin balance consistency after mixed completions and redemptions', async () => {
		const { familyId, kidId, choreId } = await seedRedemptionSetup(100);

		// Create a second prize
		const prize2Id = ulid();
		await testDb.insert(prizes).values({
			id: prize2Id,
			familyId,
			title: 'Small reward',
			description: '',
			coinCost: 30,
			isActive: true,
			createdAt: now()
		});

		// Add more coins (second chore completion in a different period)
		const chore2Id = ulid();
		await testDb.insert(chores).values({
			id: chore2Id,
			familyId,
			title: 'Weekly Chore',
			description: '',
			emoji: '📚',
			frequency: 'weekly',
			coinValue: 40,
			assignedKidId: null,
			isActive: true,
			createdAt: now()
		});
		await testDb.insert(choreCompletions).values({
			id: ulid(),
			choreId: chore2Id,
			kidId,
			familyId,
			coinsAwarded: 40,
			periodKey: getPeriodKey('weekly', new Date()),
			completedAt: now()
		});

		// Redeem both prizes
		const actions = await getActions();
		await actions.redeem(mockEvent(kidSession(familyId, kidId), { prizeId: prize2Id }));

		// Total earned = 100 + 40 = 140
		// Total spent = 30 (prize2)
		// Expected balance = 110
		const [earnedRow] = await testDb
			.select({ total: sum(choreCompletions.coinsAwarded) })
			.from(choreCompletions)
			.where(eq(choreCompletions.kidId, kidId));
		const [spentRow] = await testDb
			.select({ total: sum(prizeRedemptions.coinCost) })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.kidId, kidId));

		const earned = Number(earnedRow?.total ?? 0);
		const spent = Number(spentRow?.total ?? 0);
		const balance = earned - spent;

		expect(earned).toBe(140);
		expect(spent).toBe(30);
		expect(balance).toBe(110);
	});
});
