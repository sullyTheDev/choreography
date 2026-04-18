import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { familyMembers, authUser } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey } from '$lib/server/api-utils.js';

export const GET: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const memberId = searchParams.get('id');

		if (memberId) {
			// Get specific member
			const [member] = await db
				.select()
				.from(familyMembers)
				.where(eq(familyMembers.memberId, memberId))
				.limit(1);

			if (!member || member.familyId !== apiKey.familyId) {
				return apiError(404, 'Member not found', 'NOT_FOUND');
			}

			// Get user details if available
			const [user] = await db.select().from(authUser).where(eq(authUser.id, memberId)).limit(1);

			return apiOk({
				...member,
				user: user ? { id: user.id, email: user.email, displayName: user.displayName } : null
			});
		}

		// List all members for family
		const members = await db
			.select()
			.from(familyMembers)
			.where(eq(familyMembers.familyId, apiKey.familyId));

		// Get user details for each member
		const membersWithUsers = await Promise.all(
			members.map(async (member) => {
				const [user] = await db.select().from(authUser).where(eq(authUser.id, member.memberId)).limit(1);
				return {
					...member,
					user: user ? { id: user.id, email: user.email, displayName: user.displayName } : null
				};
			})
		);

		return apiOk(membersWithUsers);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Members API GET error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
