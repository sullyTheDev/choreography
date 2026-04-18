import { describe, it, expect } from 'vitest';
import { testDb } from './setup.js';
import { families, authUser, familyMembers } from '../../src/lib/server/db/schema.js';
import { now, ulid } from '../../src/lib/server/db/utils.js';

const getMembersHandler = async () => await import('../../src/routes/api/v1/members/+server.js');
const getReactivateHandler = async () => await import('../../src/routes/api/v1/members/reactivate/+server.js');

async function seedFamilyWithMember(isActive: boolean) {
	const familyId = ulid();
	const memberId = ulid();

	await testDb.insert(families).values({
		id: familyId,
		name: 'API Test Family',
		leaderboardResetDay: 1,
		createdAt: now()
	});

	await testDb.insert(authUser).values({
		id: memberId,
		name: 'API Member',
		avatarEmoji: '👤',
		email: null,
		emailVerified: false,
		isActive,
		createdAt: new Date(),
		updatedAt: new Date()
	});

	await testDb.insert(familyMembers).values({
		memberId,
		familyId,
		role: 'member',
		joinedAt: now()
	});

	return { familyId, memberId };
}

describe('api/v1/members', () => {
	it('includes inactive users and exposes user.isActive', async () => {
		const { familyId } = await seedFamilyWithMember(false);
		const { GET } = await getMembersHandler();
		const response = await GET({
			locals: { apiKey: { familyId } },
			request: new Request('https://localhost/api/v1/members')
		} as Parameters<typeof GET>[0]);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data).toHaveLength(1);
		expect(payload.data[0].user.isActive).toBe(false);
	});
});

describe('api/v1/members/reactivate', () => {
	it('reactivates an inactive member in the same family', async () => {
		const { familyId, memberId } = await seedFamilyWithMember(false);
		const { POST } = await getReactivateHandler();
		const response = await POST({
			locals: { apiKey: { familyId } },
			request: new Request('https://localhost/api/v1/members/reactivate', {
				method: 'POST',
				body: JSON.stringify({ memberId }),
				headers: { 'content-type': 'application/json' }
			})
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(200);
		const payload = await response.json();
		expect(payload.success).toBe(true);
		expect(payload.data.memberId).toBe(memberId);
		expect(payload.data.user.isActive).toBe(true);
	});
});
