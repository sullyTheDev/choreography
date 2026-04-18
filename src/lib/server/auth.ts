/**
 * Auth helpers: password/PIN hashing utilities and user lookup functions.
 *
 * Session management is handled by better-auth (`$lib/auth.ts`).
 * Lookups now query the `authUser` table (which replaced the legacy `members` table).
 */

import bcrypt from 'bcrypt';
import { eq, and, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { authUser, familyMembers, families } from './db/schema.js';

const PASSWORD_ROUNDS = 12;
const PIN_ROUNDS = 10;

/**
 * Cookie name used by the legacy PIN session.
 * Retained so the logout action can clear any lingering legacy cookies.
 * @deprecated Remove once the 30-day legacy session TTL has fully expired.
 */
export const SESSION_COOKIE_NAME = 'session';

// ── Password / PIN hashing ─────────────────────────────────────────────────

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, PASSWORD_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function hashPin(pin: string): Promise<string> {
	return bcrypt.hash(pin, PIN_ROUNDS);
}

export function verifyPin(pin: string, hash: string): Promise<boolean> {
	return bcrypt.compare(pin, hash);
}

// ── User lookup helpers ────────────────────────────────────────────────────

export async function getMemberById(id: string) {
	const [user] = await db.select().from(authUser).where(eq(authUser.id, id)).limit(1);
	return user ?? null;
}

export async function getMemberByEmail(email: string) {
	const [user] = await db.select().from(authUser).where(eq(authUser.email, email)).limit(1);
	return user ?? null;
}

export async function getMemberByDisplayNameInFamily(displayName: string, familyCode: string) {
	const [row] = await db
		.select({ user: authUser })
		.from(familyMembers)
		.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
		.innerJoin(families, eq(familyMembers.familyId, families.id))
		.where(and(
			eq(authUser.name, displayName),
			sql`substr(${families.id}, -8) = ${familyCode}`
		))
		.limit(1);
	return row?.user ?? null;
}

export async function getMemberFamilyId(memberId: string) {
	const [link] = await db
		.select({ familyId: familyMembers.familyId })
		.from(familyMembers)
		.where(eq(familyMembers.memberId, memberId))
		.limit(1);
	return link?.familyId ?? null;
}

