/**
 * T008  — US1: pending-only load and family-scope integration tests
 * T015  — US2: fulfill-action (status update, event insert, conflict handling)
 * T021  — US3: dismiss-action (delete, no refund side effect, conflict handling)
 * T028  — US1: non-admin authorization tests (expect 403 for member role)
 * T029  — US1: badge-accuracy verification tests
 */
import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import {
	families,
	members,
	familyMembers,
	prizes,
	prizeRedemptions,
	activityEvents
} from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';
import { hashPassword } from '../../src/lib/server/auth.js';
import { eq, and } from 'drizzle-orm';

const getLoad = async () =>
	(await import('../../src/routes/(app)/admin/approvals/+page.server.js')).load;
const getActions = async () =>
	(await import('../../src/routes/(app)/admin/approvals/+page.server.js')).actions;
const getAdminLoad = async () =>
	(await import('../../src/routes/(app)/admin/+page.server.js')).load;

function makeFormData(data: Record<string, string>): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(data)) fd.append(k, v);
	return fd;
}

function adminSession(familyId: string, memberId: string) {
	return {
		id: 'sess-admin-1',
		familyId,
		memberId,
		memberRole: 'admin' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now()
	};
}

function memberSession(familyId: string, memberId: string) {
	return {
		id: 'sess-member-1',
		familyId,
		memberId,
		memberRole: 'member' as const,
		expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
		createdAt: now()
	};
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockLoadEvent(session: ReturnType<typeof adminSession> | ReturnType<typeof memberSession>, searchParams: Record<string, string> = {}): any {
	const url = new URL('http://localhost/admin/approvals');
	for (const [k, v] of Object.entries(searchParams)) url.searchParams.set(k, v);
	return { locals: { session }, url };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockActionEvent(session: ReturnType<typeof adminSession> | ReturnType<typeof memberSession>, formDataObj: Record<string, string>): any {
	return {
		locals: { session },
		request: { formData: async () => makeFormData(formDataObj) }
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

async function seedMember(familyId: string, displayName: string) {
	const memberId = ulid();
	await testDb.insert(members).values({
		id: memberId,
		displayName,
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
	return memberId;
}

async function seedPrize(familyId: string, title: string, coinCost = 50) {
	const prizeId = ulid();
	await testDb.insert(prizes).values({
		id: prizeId,
		familyId,
		title,
		description: '',
		emoji: '🎁',
		coinCost,
		isActive: true,
		createdAt: now()
	});
	return prizeId;
}

async function seedRedemption(
	familyId: string,
	memberId: string,
	prizeId: string,
	status: 'available' | 'pending' | 'fulfilled' = 'pending',
	offsetMs = 0,
	coinCost = 50
) {
	const id = ulid();
	await testDb.insert(prizeRedemptions).values({
		id,
		prizeId,
		memberId,
		familyId,
		coinCost,
		status,
		redeemedAt: new Date(Date.now() - offsetMs).toISOString()
	});
	return id;
}

// ---------------------------------------------------------------------------
// T028 — Authorization tests
// ---------------------------------------------------------------------------
describe('admin/approvals — authorization', () => {
	it('load: returns 403 for member role', async () => {
		const { familyId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Regular Kid');
		const load = await getLoad();

		await expect(
			load(mockLoadEvent(memberSession(familyId, memberId)))
		).rejects.toMatchObject({ status: 403 });
	});

	it('load: returns 403 when session is null', async () => {
		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		await expect(load({ locals: { session: null }, url: new URL('http://localhost/admin/approvals') } as any)).rejects.toMatchObject({ status: 403 });
	});

	it('fulfill action: returns 403 for member role', async () => {
		const { familyId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Regular Kid');
		const prizeId = await seedPrize(familyId, 'Test Prize');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId);
		const actions = await getActions();

		await expect(
			actions.fulfill(mockActionEvent(memberSession(familyId, memberId), { redemptionId }))
		).rejects.toMatchObject({ status: 403 });
	});

	it('dismiss action: returns 403 for member role', async () => {
		const { familyId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Regular Kid');
		const prizeId = await seedPrize(familyId, 'Test Prize');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId);
		const actions = await getActions();

		await expect(
			actions.dismiss(mockActionEvent(memberSession(familyId, memberId), { redemptionId }))
		).rejects.toMatchObject({ status: 403 });
	});
});

// ---------------------------------------------------------------------------
// T008 — US1: Pending-only load and family scoping
// ---------------------------------------------------------------------------
describe('admin/approvals — load (US1)', () => {
	it('returns only pending redemptions for current family', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Alice');
		const prizeId = await seedPrize(familyId, 'Weekend Treat');

		// Other family that should NOT appear
		const otherFamilyId = ulid();
		const otherParentId = ulid();
		const otherMemberId = ulid();
		const otherPrizeId = ulid();
		await testDb.insert(families).values({ id: otherFamilyId, name: 'Other Family', leaderboardResetDay: 1, createdAt: now() });
		await testDb.insert(members).values({ id: otherParentId, displayName: 'Other Parent', avatarEmoji: '🧑', email: `other-${otherFamilyId}@example.com`, passwordHash: null, pin: null, isActive: true, createdAt: now() });
		await testDb.insert(familyMembers).values({ memberId: otherParentId, familyId: otherFamilyId, role: 'admin', joinedAt: now() });
		await testDb.insert(members).values({ id: otherMemberId, displayName: 'Other Kid', avatarEmoji: '👦', email: null, passwordHash: null, pin: null, isActive: true, createdAt: now() });
		await testDb.insert(familyMembers).values({ memberId: otherMemberId, familyId: otherFamilyId, role: 'member', joinedAt: now() });
		await testDb.insert(prizes).values({ id: otherPrizeId, familyId: otherFamilyId, title: 'Other Prize', description: '', emoji: '🎁', coinCost: 30, isActive: true, createdAt: now() });

		await seedRedemption(familyId, memberId, prizeId, 'pending');
		await seedRedemption(familyId, memberId, prizeId, 'fulfilled'); // should NOT appear
		await seedRedemption(familyId, memberId, prizeId, 'available'); // should NOT appear
		await seedRedemption(otherFamilyId, otherMemberId, otherPrizeId, 'pending'); // different family

		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await load(mockLoadEvent(adminSession(familyId, parentId))) as any;

		expect(result.items).toHaveLength(1);
		expect(result.items[0].prizeName).toBe('Weekend Treat');
		expect(result.items[0].memberName).toBe('Alice');
		expect(result.totalCount).toBe(1);
	});

	it('returns empty items when no pending redemptions', async () => {
		const { familyId, parentId } = await seedFamily();
		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await load(mockLoadEvent(adminSession(familyId, parentId))) as any;
		expect(result.items).toHaveLength(0);
		expect(result.totalCount).toBe(0);
	});

	it('defaults to page 1, sort requestedAt asc', async () => {
		const { familyId, parentId } = await seedFamily();
		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await load(mockLoadEvent(adminSession(familyId, parentId))) as any;
		expect(result.page).toBe(1);
		expect(result.sort).toBe('requestedAt');
		expect(result.dir).toBe('asc');
	});

	it('respects allowed sort columns and rejects unknown sort', async () => {
		const { familyId, parentId } = await seedFamily();
		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await load(mockLoadEvent(adminSession(familyId, parentId), { sort: 'EVIL; DROP TABLE--', dir: 'desc' })) as any;
		expect(result.sort).toBe('requestedAt'); // falls back to default
	});

	it('sorts by oldest-first by default (requestedAt asc)', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Alice');
		const prizeId = await seedPrize(familyId, 'Prize');

		// older first
		await seedRedemption(familyId, memberId, prizeId, 'pending', 10_000);
		await seedRedemption(familyId, memberId, prizeId, 'pending', 1_000);

		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await load(mockLoadEvent(adminSession(familyId, parentId))) as any;

		expect(result.items).toHaveLength(2);
		// Older redemption should come first (asc sort)
		const t0 = new Date(result.items[0].requestedAt).getTime();
		const t1 = new Date(result.items[1].requestedAt).getTime();
		expect(t0).toBeLessThan(t1);
	});

	it('row anatomy: includes redemptionId, prizeId, prizeName, prizeEmoji, memberId, memberName, requestedAt, coinCost', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Bob');
		const prizeId = await seedPrize(familyId, 'Cool Reward', 75);
		await seedRedemption(familyId, memberId, prizeId, 'pending', 0, 75);

		const load = await getLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await load(mockLoadEvent(adminSession(familyId, parentId))) as any;

		const row = result.items[0];
		expect(row).toHaveProperty('redemptionId');
		expect(row).toHaveProperty('prizeId', prizeId);
		expect(row).toHaveProperty('prizeName', 'Cool Reward');
		expect(row).toHaveProperty('prizeEmoji', '🎁');
		expect(row).toHaveProperty('memberId', memberId);
		expect(row).toHaveProperty('memberName', 'Bob');
		expect(row).toHaveProperty('requestedAt');
		expect(row).toHaveProperty('coinCost', 75);
	});
});

// ---------------------------------------------------------------------------
// T029 — Badge accuracy: /admin pending count matches DB
// ---------------------------------------------------------------------------
describe('admin — badge accuracy (T029)', () => {
	it('pendingApprovalsCount on admin page matches DB count across mixed statuses', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Charlie');
		const prizeId = await seedPrize(familyId, 'Badge Prize');

		// Insert 3 pending + 2 non-pending
		await seedRedemption(familyId, memberId, prizeId, 'pending');
		await seedRedemption(familyId, memberId, prizeId, 'pending');
		await seedRedemption(familyId, memberId, prizeId, 'pending');
		await seedRedemption(familyId, memberId, prizeId, 'fulfilled');
		await seedRedemption(familyId, memberId, prizeId, 'available');

		const adminLoad = await getAdminLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await adminLoad({ locals: { session: adminSession(familyId, parentId) } } as any) as any;
		expect(result.pendingApprovalsCount).toBe(3);
	});

	it('pendingApprovalsCount is 0 when no pending items exist', async () => {
		const { familyId, parentId } = await seedFamily();
		const adminLoad = await getAdminLoad();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const result = await adminLoad({ locals: { session: adminSession(familyId, parentId) } } as any) as any;
		expect(result.pendingApprovalsCount).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// T015 — US2: Fulfill action
// ---------------------------------------------------------------------------
describe('admin/approvals — fulfill action (US2)', () => {
	it('fulfills a pending redemption: status becomes fulfilled', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Diana');
		const prizeId = await seedPrize(familyId, 'Movie Night');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId, 'pending');

		const actions = await getActions();
		const result = await actions.fulfill(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId })
		);

		expect(result).toMatchObject({ success: true });

		const [row] = await testDb
			.select({ status: prizeRedemptions.status })
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.id, redemptionId));
		expect(row.status).toBe('fulfilled');
	});

	it('fulfills: inserts prize_fulfilled activity event with correct metadata', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Eve');
		const prizeId = await seedPrize(familyId, 'Cinema Trip');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId, 'pending');

		const actions = await getActions();
		await actions.fulfill(mockActionEvent(adminSession(familyId, parentId), { redemptionId }));

		const events = await testDb
			.select()
			.from(activityEvents)
			.where(and(eq(activityEvents.entityId, redemptionId), eq(activityEvents.eventType, 'prize_fulfilled')));

		expect(events).toHaveLength(1);
		const event = events[0];
		expect(event.eventType).toBe('prize_fulfilled');
		expect(event.entityType).toBe('prize_redemption');
		expect(event.entityId).toBe(redemptionId);
		expect(event.actorMemberId).toBe(parentId);
		expect(event.subjectMemberId).toBe(memberId);
		expect(event.deltaCoins).toBe(0);
		const metadata = JSON.parse(event.metadata);
		expect(metadata.fromStatus).toBe('pending');
		expect(metadata.toStatus).toBe('fulfilled');
		expect(metadata.source).toBe('admin_approvals_fulfill');
	});

	it('fulfills: returns already_processed conflict when row is no longer pending', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Frank');
		const prizeId = await seedPrize(familyId, 'Ice Cream');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId, 'fulfilled'); // already fulfilled

		const actions = await getActions();
		const result = await actions.fulfill(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId })
		);

		expect(result).toMatchObject({ success: false, conflict: 'already_processed' });
	});

	it('fulfills: returns fail(400) when redemptionId is missing', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();
		const result = await actions.fulfill(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId: '' })
		);
		expect((result as { status: number }).status).toBe(400);
	});

	it('fulfills: cannot fulfill a redemption from another family', async () => {
		const { familyId, parentId } = await seedFamily();
		const otherFamilyId = ulid();
		const otherPrizeId = ulid();
		const otherMemberId = ulid();
		await testDb.insert(families).values({ id: otherFamilyId, name: 'Other Family', leaderboardResetDay: 1, createdAt: now() });
		await testDb.insert(members).values({ id: otherMemberId, displayName: 'Other Kid', avatarEmoji: '👦', email: null, passwordHash: null, pin: null, isActive: true, createdAt: now() });
		await testDb.insert(familyMembers).values({ memberId: otherMemberId, familyId: otherFamilyId, role: 'member', joinedAt: now() });
		await testDb.insert(prizes).values({ id: otherPrizeId, familyId: otherFamilyId, title: 'Other Prize', description: '', emoji: '🎁', coinCost: 30, isActive: true, createdAt: now() });
		const otherRedemptionId = await seedRedemption(otherFamilyId, otherMemberId, otherPrizeId, 'pending');

		const actions = await getActions();
		const result = await actions.fulfill(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId: otherRedemptionId })
		);

		expect(result).toMatchObject({ success: false, conflict: 'already_processed' });
	});
});

// ---------------------------------------------------------------------------
// T021 — US3: Dismiss action
// ---------------------------------------------------------------------------
describe('admin/approvals — dismiss action (US3)', () => {
	it('dismisses a pending redemption: row is deleted', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Grace');
		const prizeId = await seedPrize(familyId, 'Video Game');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId, 'pending');

		const actions = await getActions();
		const result = await actions.dismiss(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId })
		);

		expect(result).toMatchObject({ success: true });

		const rows = await testDb
			.select()
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.id, redemptionId));
		expect(rows).toHaveLength(0);
	});

	it('dismiss: does NOT insert any activity event (no refund side effect)', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Henry');
		const prizeId = await seedPrize(familyId, 'Toy');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId, 'pending');

		const actions = await getActions();
		await actions.dismiss(mockActionEvent(adminSession(familyId, parentId), { redemptionId }));

		const events = await testDb.select().from(activityEvents);
		expect(events).toHaveLength(0);
	});

	it('dismiss: returns already_processed conflict when row is no longer pending', async () => {
		const { familyId, parentId } = await seedFamily();
		const memberId = await seedMember(familyId, 'Iris');
		const prizeId = await seedPrize(familyId, 'Book');
		const redemptionId = await seedRedemption(familyId, memberId, prizeId, 'fulfilled'); // already processed

		const actions = await getActions();
		const result = await actions.dismiss(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId })
		);

		expect(result).toMatchObject({ success: false, conflict: 'already_processed' });
	});

	it('dismiss: returns fail(400) when redemptionId is missing', async () => {
		const { familyId, parentId } = await seedFamily();
		const actions = await getActions();
		const result = await actions.dismiss(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId: '' })
		);
		expect((result as { status: number }).status).toBe(400);
	});

	it('dismiss: cannot dismiss a redemption from another family', async () => {
		const { familyId, parentId } = await seedFamily();
		const otherFamilyId = ulid();
		const otherMemberId = ulid();
		const otherPrizeId = ulid();
		await testDb.insert(families).values({ id: otherFamilyId, name: 'Other Family', leaderboardResetDay: 1, createdAt: now() });
		await testDb.insert(members).values({ id: otherMemberId, displayName: 'Other Kid', avatarEmoji: '👦', email: null, passwordHash: null, pin: null, isActive: true, createdAt: now() });
		await testDb.insert(familyMembers).values({ memberId: otherMemberId, familyId: otherFamilyId, role: 'member', joinedAt: now() });
		await testDb.insert(prizes).values({ id: otherPrizeId, familyId: otherFamilyId, title: 'Other Prize', description: '', emoji: '🎁', coinCost: 30, isActive: true, createdAt: now() });
		const otherRedemptionId = await seedRedemption(otherFamilyId, otherMemberId, otherPrizeId, 'pending');

		const actions = await getActions();
		const result = await actions.dismiss(
			mockActionEvent(adminSession(familyId, parentId), { redemptionId: otherRedemptionId })
		);

		expect(result).toMatchObject({ success: false, conflict: 'already_processed' });
	});
});
