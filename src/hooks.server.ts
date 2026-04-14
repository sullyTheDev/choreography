import type { Handle } from '@sveltejs/kit';
import { validateSession, SESSION_COOKIE_NAME, getParentById, getKidById } from '$lib/server/auth.js';
import { logger } from '$lib/server/logger.js';

export const handle: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	const sessionToken = event.cookies.get(SESSION_COOKIE_NAME);

	event.locals.session = null;

	if (sessionToken) {
		try {
			const session = await validateSession(sessionToken);
			if (session) {
				const user =
					session.userRole === 'parent'
						? await getParentById(session.userId)
						: await getKidById(session.userId);

				if (user) {
					event.locals.session = {
						...session,
						user: {
							id: user.id,
							displayName: user.displayName,
							avatarEmoji: 'avatarEmoji' in user ? user.avatarEmoji : undefined,
							familyId: user.familyId
						}
					};
				}
			}
		} catch (err) {
			logger.warn({ err }, 'session validation failed');
		}
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
