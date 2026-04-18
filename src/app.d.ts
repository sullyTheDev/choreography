// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		interface Locals {
			/**
			 * Active session resolved from better-auth. Null when no valid session exists.
			 */
			session: {
				/** Stable app-domain member ID (maps to the `members` table). */
				memberId: string;
				familyId: string;
				memberRole: 'admin' | 'member';
				/** User-facing display name. */
				displayName: string;
				avatarEmoji: string;
				/** ISO-8601 expiry timestamp. */
				expiresAt: string;
			} | null;
		}
	}
}

export {};
