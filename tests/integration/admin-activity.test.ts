/**
 * T064 — Integration tests for parent activity log server loader.
 * Covers: merged events, reverse-chronological, pagination, parent-only access.
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	members,
	familyMembers,
	chores,
	prizes,
	choreCompletions,
	prizeRedemptions
} from '../../src/lib/server/db/schema.js';
import { ulid, now, getPeriodKey } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';

const getLoad = async () =>
	(await import('../../src/routes/(app)/admin/activity/+page.server.js')).load;

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

function kidSession(familyId: string, memberId: string) {
	return {
		id: 'sess-kid',
		familyId,
		memberId: memberId,
		memberRole: 'member' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now(),
		user: { id: memberId, displayName: 'Emma', avatarEmoji: '👧', familyId }
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockLoadEvent(session: any, searchParams: Record<string, string> = {}): any {
	const urlParams = new URLSearchParams(searchParams);
	return {
		locals: { session },
		url: { searchParams: urlParams }
	};
}

async function seedActivityData() {
	const familyId = ulid();
	const parentId = ulid();
	const memberId = ulid();
	const choreId = ulid();
	const prizeId = ulid();

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
	await testDb.insert(members).values({
		id: memberId,
		displayName: 'Emma',
		avatarEmoji: '👧',
		email: null,
		passwordHash: null,
		pin: 'hashed',
		isActive: true,
		createdAt: now()
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
		assignedMemberId: null,
		isActive: true,
		createdAt: now()
	});
	await testDb.insert(prizes).values({
		id: prizeId,
		familyId,
		title: 'Screen time',
		description: '',
		coinCost: 50,
		isActive: true,
		createdAt: now()
	});

	// Add a completion (older)
	await testDb.insert(choreCompletions).values({
		id: ulid(),
		choreId,
		memberId,
		familyId,
		coinsAwarded: 10,
		periodKey: getPeriodKey('daily', new Date()),
		completedAt: new Date(Date.now() - 10_000).toISOString() // 10s ago
	});

	// Add a redemption (newer)
	await testDb.insert(prizeRedemptions).values({
		id: ulid(),
		prizeId,
		memberId,
		familyId,
		coinCost: 50,
		redeemedAt: now()
	});

	return { familyId, parentId, memberId, choreId, prizeId };
}

describe('admin/activity — load function', () => {
	it('returns merged events in reverse-chronological order', async () => {
		const { familyId, parentId } = await seedActivityData();
		const load = await getLoad();

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as {
			events: Array<{ type: string; title: string; occurredAt: string }>;
			totalCount: number;
			page: number;
		};

		expect(result.events).toHaveLength(2);
		// Redemption (newer) should come first
		expect(result.events[0].type).toBe('prize_redemption');
		expect(result.events[0].title).toBe('Screen time');
		expect(result.events[1].type).toBe('chore_completion');
		expect(result.events[1].title).toBe('Make your bed');
		expect(result.totalCount).toBe(2);
		expect(result.page).toBe(1);
	});

	it('blocks member access — requires admin role', async () => {
		const { familyId, memberId } = await seedActivityData();
		const load = await getLoad();

		await expect(load(mockLoadEvent(kidSession(familyId, memberId)))).rejects.toMatchObject({
			status: 403
		});
	});

	it('returns correct event fields', async () => {
		const { familyId, parentId } = await seedActivityData();
		const load = await getLoad();

		const result = (await load(mockLoadEvent(parentSession(familyId, parentId)))) as {
			events: Array<{
				type: string;
				memberName: string;
				memberAvatarEmoji: string;
				title: string;
				coins: number;
				occurredAt: string;
			}>;
		};

		const redemption = result.events.find((e) => e.type === 'prize_redemption');
		expect(redemption).toBeDefined();
		expect(redemption!.memberName).toBe('Emma');
		expect(redemption!.memberAvatarEmoji).toBe('👧');
		expect(redemption!.coins).toBe(50);
	});

	it('supports page-based pagination', async () => {
		const { familyId, parentId } = await seedActivityData();
		const load = await getLoad();

		// Page 2 with 1 item per page (default 25, so page 2 returns nothing)
		const result = (await load(
			mockLoadEvent(parentSession(familyId, parentId), { page: '2' })
		)) as { events: unknown[]; totalCount: number; page: number };

		expect(result.page).toBe(2);
		expect(result.totalCount).toBe(2); // total still 2
		expect(result.events).toHaveLength(0); // page 2 is empty since only 2 events with 25/page
	});
});
