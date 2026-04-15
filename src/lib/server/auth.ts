import bcrypt from 'bcrypt';
import { eq, lt, and, sql } from 'drizzle-orm';
import { db } from './db/index.js';
import { sessions, members, familyMembers, families } from './db/schema.js';
import { now } from './db/utils.js';

const PASSWORD_ROUNDS = 12;
const PIN_ROUNDS = 10;
const SESSION_DURATION_DAYS = 30;

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

// ── Session management ─────────────────────────────────────────────────────

export interface SessionPayload {
	familyId: string;
	memberId: string;
	memberRole: 'admin' | 'member';
}

export async function createSession(payload: SessionPayload): Promise<string> {
	const sessionId = crypto.randomUUID();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

	await db.insert(sessions).values({
		id: sessionId,
		familyId: payload.familyId,
		memberId: payload.memberId,
		memberRole: payload.memberRole,
		expiresAt: expiresAt.toISOString(),
		createdAt: now()
	});

	return sessionId;
}

export async function validateSession(token: string) {
	const currentTime = now();
	const [session] = await db.select().from(sessions).where(eq(sessions.id, token)).limit(1);

	if (!session) return null;

	if (session.expiresAt < currentTime) {
		await db.delete(sessions).where(eq(sessions.id, token));
		return null;
	}

	return session;
}

export async function deleteSession(token: string): Promise<void> {
	await db.delete(sessions).where(eq(sessions.id, token));
}

export async function deleteSessionsByFamily(familyId: string): Promise<void> {
	const { familyId: col } = sessions;
	await db.delete(sessions).where(eq(col, familyId));
}

export async function pruneExpiredSessions(): Promise<void> {
	await db.delete(sessions).where(lt(sessions.expiresAt, now()));
}

// ── User lookup helpers ────────────────────────────────────────────────────

export async function getMemberById(id: string) {
	const [member] = await db.select().from(members).where(eq(members.id, id)).limit(1);
	return member ?? null;
}

export async function getMemberByEmail(email: string) {
	const [member] = await db.select().from(members).where(eq(members.email, email)).limit(1);
	return member ?? null;
}

/** @deprecated display names are only unique within a family — use getMemberByDisplayNameInFamily */
export async function getMemberByDisplayName(displayName: string) {
	const [member] = await db.select().from(members).where(eq(members.displayName, displayName)).limit(1);
	return member ?? null;
}

export async function getMemberByDisplayNameInFamily(displayName: string, familyCode: string) {
	const [row] = await db
		.select({ member: members })
		.from(familyMembers)
		.innerJoin(members, eq(familyMembers.memberId, members.id))
		.innerJoin(families, eq(familyMembers.familyId, families.id))
		.where(and(
			eq(members.displayName, displayName),
			sql`substr(${families.id}, -8) = ${familyCode}`
		))
		.limit(1);
	return row?.member ?? null;
}

export async function getMemberFamilyId(memberId: string) {
	const [link] = await db
		.select({ familyId: familyMembers.familyId })
		.from(familyMembers)
		.where(eq(familyMembers.memberId, memberId))
		.limit(1);
	return link?.familyId ?? null;
}

// Cookie helper — returns the attributes to pass to event.cookies.set()
export function sessionCookieOptions() {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		maxAge: SESSION_DURATION_DAYS * 24 * 60 * 60
	};
}
