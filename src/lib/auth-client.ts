/**
 * Better Auth client helper for Svelte components.
 * Import `authClient` wherever reactive session state or sign-in/sign-out
 * actions are needed on the client side.
 */

import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : ''
});

export type { Session } from 'better-auth';
