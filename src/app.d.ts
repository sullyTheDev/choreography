// See https://svelte.dev/docs/kit/types#app.d.ts

declare global {
	namespace App {
		interface Locals {
			session: {
				id: string;
				familyId: string;
				userId: string;
				userRole: 'parent' | 'kid';
				expiresAt: string;
				createdAt: string;
				user: {
					id: string;
					displayName: string;
					avatarEmoji?: string;
					familyId: string;
				};
			} | null;
		}
	}
}

export {};
