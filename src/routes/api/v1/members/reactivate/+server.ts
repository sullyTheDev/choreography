import type { RequestHandler } from './$types.js';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { familyMembers, authUser } from '$lib/server/db/schema.js';
import { apiError, apiOk, parseJsonBody, requireApiKey } from '$lib/server/api-utils.js';

export const POST: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);
		const body = await parseJsonBody<{ memberId?: string }>(event);
		const memberId = body.memberId?.trim();

		if (!memberId) {
			return apiError(400, 'memberId is required', 'INVALID_INPUT');
		}

		const [member] = await db
			.select({ memberId: familyMembers.memberId, isActive: authUser.isActive })
			.from(familyMembers)
			.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(and(eq(familyMembers.familyId, apiKey.familyId), eq(familyMembers.memberId, memberId)))
			.limit(1);

		if (!member) {
			return apiError(404, 'Member not found', 'NOT_FOUND');
		}

		if (!member.isActive) {
			await db.update(authUser).set({ isActive: true, updatedAt: new Date() }).where(eq(authUser.id, member.memberId));
		}

		const [updatedUser] = await db.select().from(authUser).where(eq(authUser.id, member.memberId)).limit(1);

		return apiOk({
			memberId: member.memberId,
			reactivated: true,
			user: updatedUser ? { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, isActive: updatedUser.isActive } : null
		});
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Members Reactivate API POST error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
