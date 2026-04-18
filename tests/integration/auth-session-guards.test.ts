/**
 * T039 — Session-guard regression tests
 *
 * Verifies that route-level session guards continue to work after the
 * better-auth refactor:
 *  - Unauthenticated requests to the (app) layout redirect to /login
 *  - Admin-only routes return 403 Forbidden for member-role sessions
 *  - Authenticated admin sessions pass the guard and load data
 */

import { describe, it, expect, vi } from 'vitest';
import { testDb } from './setup.js';
import { families, authUser, familyMembers } from '../../src/lib/server/db/schema.js';
import { ulid, now } from '../../src/lib/server/db/utils.js';

// ── Mock better-auth so the layout import succeeds in test env ────────────
vi.mock('$lib/auth.js', () => ({
	AUTH_MODE: 'local',
	oidcConfigValid: false,
	OIDC_ISSUER_LABEL: 'SSO',
	auth: { api: { getSession: vi.fn().mockResolvedValue(null) } }
}));

// ── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mockEvent(session: any): any {
	return {
		locals: { session },
		url: new URL('http://localhost/admin/chores'),
		request: { headers: new Headers() }
	};
}

const adminSession = (familyId: string, memberId: string) => ({
	memberId,
	familyId,
	memberRole: 'admin' as const,
	displayName: 'Test Admin',
	avatarEmoji: '🧑',
	expiresAt: new Date(Date.now() + 86_400_000).toISOString()
});

const memberSession = (familyId: string, memberId: string) => ({
	memberId,
	familyId,
	memberRole: 'member' as const,
	displayName: 'Test Kid',
	avatarEmoji: '👦',
	expiresAt: new Date(Date.now() + 86_400_000).toISOString()
});

// Seed a minimal family + admin member so layout DB queries succeed
async function seedFamily() {
	const familyId = ulid();
	const memberId = ulid();
	await testDb.insert(families).values({
		id: familyId,
		name: 'Guard Test Family',
		leaderboardResetDay: 1,
		createdAt: now()
	});
	await testDb.insert(authUser).values({
		id: memberId,
		name: 'Guard Admin',
		avatarEmoji: '🧑',
		email: `guard-${familyId.toLowerCase()}@example.com`,
		emailVerified: false,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date()
	});
	await testDb.insert(familyMembers).values({
		memberId,
		familyId,
		role: 'admin',
		joinedAt: now()
	});
	return { familyId, memberId };
}

// ── (app) layout guard ───────────────────────────────────────────────────────

describe('(app) layout — session guard (T039)', () => {
	it('redirects unauthenticated requests to /login', async () => {
		const { load } = await import('../../src/routes/(app)/+layout.server.js');
		const event = mockEvent(null);
		await expect(async () => load(event as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 302,
			location: '/login'
		});
	});

	it('allows authenticated admin sessions to proceed', async () => {
		const { familyId, memberId } = await seedFamily();
		const { load } = await import('../../src/routes/(app)/+layout.server.js');
		const event = mockEvent(adminSession(familyId, memberId));
		const result = await load(event as Parameters<typeof load>[0]);
		// Load function returns family and member data
		expect(result).toHaveProperty('family');
		expect(result).toHaveProperty('members');
	});
});

// ── Admin-only route guard ───────────────────────────────────────────────────

describe('admin/chores load — role guard (T039)', () => {
	it('returns 403 Forbidden for member-role sessions', async () => {
		const { familyId, memberId } = await seedFamily();
		const { load } = await import('../../src/routes/(app)/admin/chores/+page.server.js');
		const event = mockEvent(memberSession(familyId, memberId));
		await expect(async () => load(event as Parameters<typeof load>[0])).rejects.toMatchObject({
			status: 403
		});
	});

	it('allows admin-role sessions to access the page', async () => {
		const { familyId, memberId } = await seedFamily();
		const { load } = await import('../../src/routes/(app)/admin/chores/+page.server.js');
		const event = mockEvent(adminSession(familyId, memberId));
		const result = await load(event as Parameters<typeof load>[0]);
		expect(result).toHaveProperty('chores');
	});
});

// ── Root page guard ───────────────────────────────────────────────────────────

describe('root page — redirect guard (T039)', () => {
	it('redirects unauthenticated users to /login', async () => {
		const { load } = await import('../../src/routes/+page.server.js');
		const event = { locals: { session: null } };
		await expect(async () =>
			load(event as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 302, location: '/login' });
	});

	it('redirects authenticated admin to /member/chores', async () => {
		const { familyId, memberId } = await seedFamily();
		const event = {
			locals: { session: adminSession(familyId, memberId) }
		};
		const { load } = await import('../../src/routes/+page.server.js');
		await expect(async () =>
			load(event as Parameters<typeof load>[0])
		).rejects.toMatchObject({ status: 302, location: '/member/chores' });
	});
});
