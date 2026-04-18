/**
 * PIN authentication plugin for better-auth.
 *
 * Adds a POST /sign-in/pin endpoint that validates a family member's
 * displayName + familyCode + PIN against the authUser/families tables
 * and creates a better-auth session on success.
 *
 * PIN credentials are stored in the `account` table (providerId: 'pin-auth').
 */

import type { BetterAuthPlugin } from 'better-auth';
import { APIError } from '@better-auth/core/error';
import { createAuthEndpoint } from 'better-auth/api';
import { setSessionCookie } from 'better-auth/cookies';
import { parseUserOutput } from 'better-auth/db';
import * as z from 'zod';
import {
	getMemberByDisplayNameInFamily,
	getMemberFamilyId,
	verifyPin
} from '$lib/server/auth.js';
import { db } from '$lib/server/db/index.js';
import { authAccount } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '$lib/server/logger.js';

const PIN_PROVIDER_ID = 'pin-auth';

const signInPinBodySchema = z.object({
	displayName: z.string().min(1),
	familyCode: z.string().min(1),
	pin: z.string().min(4).max(6)
});

export const pinAuth = (): BetterAuthPlugin => ({
	id: 'pin-auth',

	endpoints: {
		signInPin: createAuthEndpoint(
			'/sign-in/pin',
			{
				method: 'POST',
				body: signInPinBodySchema,
				metadata: {
					openapi: {
						summary: 'Sign in with PIN',
						description:
							'Authenticate a family member using their display name, family code, and PIN.',
						responses: {
							200: {
								description: 'Success',
								content: {
									'application/json': {
										schema: {
											type: 'object',
											properties: {
												token: { type: 'string' },
												user: { $ref: '#/components/schemas/User' }
											}
										}
									}
								}
							},
							401: { description: 'Invalid credentials' }
						}
					}
				}
			},
			async (ctx) => {
				const { displayName, familyCode, pin } = ctx.body;

				// 1. Look up the user by displayName + familyCode
				const member = await getMemberByDisplayNameInFamily(
					displayName,
					familyCode.trim().toUpperCase()
				);

				if (!member) {
					logger.warn({ displayName, familyCode }, 'pin_login_member_not_found');
					throw new APIError('UNAUTHORIZED', { message: 'Invalid family code, name, or PIN.' });
				}

				// 2. Ensure the user record is active
				if (!member.isActive) {
					logger.warn({ memberId: member.id }, 'pin_login_inactive_member');
					throw new APIError('UNAUTHORIZED', { message: 'Invalid family code, name, or PIN.' });
				}

				const authUserId = member.id;

				// 3. Look up PIN account row (providerId='pin-auth')
				const [pinAccount] = await db
					.select()
					.from(authAccount)
					.where(
						and(eq(authAccount.userId, authUserId), eq(authAccount.providerId, PIN_PROVIDER_ID))
					)
					.limit(1);

				if (pinAccount) {
					// Verify against stored account password
					if (!pinAccount.password) {
						logger.warn({ memberId: member.id }, 'pin_login_no_pin_configured');
						throw new APIError('UNAUTHORIZED', { message: 'No PIN configured for this member.' });
					}
					const valid = await verifyPin(pin, pinAccount.password);
					if (!valid) {
						logger.warn({ memberId: member.id }, 'pin_login_invalid_pin');
						throw new APIError('UNAUTHORIZED', { message: 'Invalid family code, name, or PIN.' });
					}
				} else {
					// No PIN account row — member has no PIN configured
					logger.warn({ memberId: member.id }, 'pin_login_no_pin_configured');
					throw new APIError('UNAUTHORIZED', { message: 'No PIN configured for this member.' });
				}

				// 4. Ensure the member belongs to a family (sanity check)
				const familyId = await getMemberFamilyId(member.id);
				if (!familyId) {
					logger.error({ memberId: member.id }, 'pin_login_no_family');
					throw new APIError('UNAUTHORIZED', { message: 'Unable to resolve family membership.' });
				}

				// 5. Create better-auth session
				const session = await ctx.context.internalAdapter.createSession(authUserId);
				if (!session) {
					logger.error({ memberId: member.id }, 'pin_login_session_creation_failed');
					throw new APIError('INTERNAL_SERVER_ERROR', { message: 'Failed to create session.' });
				}

				// 6. Set session cookie
				// Cast required: better-auth internal type expects email:string but our schema allows null
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const userForCookie = member as any;

				await setSessionCookie(ctx, { session, user: userForCookie });

				logger.info({ memberId: member.id }, 'member_pin_login');

				return ctx.json({
					token: session.token,
					user: parseUserOutput(ctx.context.options, userForCookie)
				});
			}
		)
	}
});
