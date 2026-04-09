import bcrypt from 'bcrypt';
import { eq, lt } from 'drizzle-orm';
import { db } from './db/index.js';
import { sessions, parents, kids } from './db/schema.js';
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
	userId: string;
	userRole: 'parent' | 'kid';
}

export async function createSession(payload: SessionPayload): Promise<string> {
	const sessionId = crypto.randomUUID();
	const expiresAt = new Date();
	expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

	await db.insert(sessions).values({
		id: sessionId,
		familyId: payload.familyId,
		userId: payload.userId,
		userRole: payload.userRole,
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

export async function getParentById(id: string) {
	const [parent] = await db.select().from(parents).where(eq(parents.id, id)).limit(1);
	return parent ?? null;
}

export async function getKidById(id: string) {
	const [kid] = await db.select().from(kids).where(eq(kids.id, id)).limit(1);
	return kid ?? null;
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
