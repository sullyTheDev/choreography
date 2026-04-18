import 'dotenv/config'; // Load .env into process.env before any module reads it
import type { Handle } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import { auth } from '$lib/auth.js';
import { db } from '$lib/server/db/index.js';
import { authUser, familyMembers } from '$lib/server/db/schema.js';
import { logger } from '$lib/server/logger.js';

const handle: Handle = async ({ event, resolve }) => {
	const start = Date.now();

	event.locals.session = null;

	// Resolve session via Better Auth (covers both email/OIDC and PIN logins)
	try {
		const baSession = await auth.api.getSession({ headers: event.request.headers });
		if (baSession) {
			const { user, session } = baSession;
			// user.id equals authUser.id — look up family membership
			const [row] = await db
				.select({
					memberId: authUser.id,
					displayName: authUser.name,
					avatarEmoji: authUser.avatarEmoji,
					familyId: familyMembers.familyId,
					memberRole: familyMembers.role
				})
				.from(authUser)
				.innerJoin(familyMembers, eq(familyMembers.memberId, authUser.id))
				.where(and(eq(authUser.id, user.id), eq(authUser.isActive, true)))
				.limit(1);

			if (row) {
				event.locals.session = {
					memberId: row.memberId,
					familyId: row.familyId,
					memberRole: row.memberRole,
					displayName: row.displayName,
					avatarEmoji: row.avatarEmoji ?? '👤',
					expiresAt: session.expiresAt.toISOString()
				};
			}
		}
	} catch (err) {
		logger.warn({ err }, 'better-auth session validation failed');
	}

	const response = await resolve(event);

	logger.debug(
		{
			method: event.request.method,
			path: event.url.pathname,
			status: response.status,
			ms: Date.now() - start
		},
		'request'
	);

	return response;
};

export { handle };
