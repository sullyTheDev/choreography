import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { familyApiKeys } from '$lib/server/db/schema.js';
import { now, ulid } from '$lib/server/db/utils.js';

const API_KEY_PREFIX = 'choreo_';

function hashApiKey(rawKey: string): string {
	return createHash('sha256').update(rawKey).digest('hex');
}

function constantTimeEqualHex(aHex: string, bHex: string): boolean {
	const a = Buffer.from(aHex, 'hex');
	const b = Buffer.from(bHex, 'hex');
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

export function createApiKeySecret(): string {
	return `${API_KEY_PREFIX}${randomBytes(32).toString('base64url')}`;
}

export function parseBearerToken(authorization: string | null): string | null {
	if (!authorization) return null;
	const [scheme, token] = authorization.trim().split(/\s+/, 2);
	if (!scheme || !token) return null;
	if (scheme.toLowerCase() !== 'bearer') return null;
	return token;
}

export async function issueFamilyApiKey(params: { familyId: string; actorMemberId: string }) {
	const rawKey = createApiKeySecret();
	const keyHash = hashApiKey(rawKey);
	const keyPrefix = rawKey.slice(0, Math.min(rawKey.length, 14));
	const keyLast4 = rawKey.slice(-4);
	const ts = now();

	const [existing] = await db
		.select({ id: familyApiKeys.id, keyHash: familyApiKeys.keyHash })
		.from(familyApiKeys)
		.where(eq(familyApiKeys.familyId, params.familyId))
		.limit(1);

	if (existing) {
		await db
			.update(familyApiKeys)
			.set({
				keyHash,
				keyPrefix,
				keyLast4,
				createdByMemberId: params.actorMemberId,
				rotatedAt: existing.keyHash ? ts : null,
				revokedAt: null,
				lastUsedAt: null
			})
			.where(eq(familyApiKeys.id, existing.id));
	} else {
		await db.insert(familyApiKeys).values({
			id: ulid(),
			familyId: params.familyId,
			keyHash,
			keyPrefix,
			keyLast4,
			createdByMemberId: params.actorMemberId,
			createdAt: ts,
			rotatedAt: null,
			revokedAt: null,
			lastUsedAt: null
		});
	}

	return { rawKey, keyPrefix, keyLast4 };
}

export async function revokeFamilyApiKey(familyId: string) {
	const ts = now();
	await db
		.update(familyApiKeys)
		.set({
			keyHash: null,
			keyPrefix: null,
			keyLast4: null,
			revokedAt: ts,
			lastUsedAt: null
		})
		.where(eq(familyApiKeys.familyId, familyId));
}

export async function getFamilyApiKeyMetadata(familyId: string) {
	const [row] = await db
		.select({
			id: familyApiKeys.id,
			keyPrefix: familyApiKeys.keyPrefix,
			keyLast4: familyApiKeys.keyLast4,
			createdAt: familyApiKeys.createdAt,
			rotatedAt: familyApiKeys.rotatedAt,
			revokedAt: familyApiKeys.revokedAt,
			lastUsedAt: familyApiKeys.lastUsedAt
		})
		.from(familyApiKeys)
		.where(eq(familyApiKeys.familyId, familyId))
		.limit(1);

	if (!row) return null;

	return {
		...row,
		hasActiveKey: !!(row.keyPrefix && row.keyLast4 && !row.revokedAt)
	};
}

export async function authenticateApiKey(rawKey: string) {
	const keyHash = hashApiKey(rawKey);
	const [row] = await db
		.select({
			id: familyApiKeys.id,
			familyId: familyApiKeys.familyId,
			keyHash: familyApiKeys.keyHash,
			keyPrefix: familyApiKeys.keyPrefix,
			keyLast4: familyApiKeys.keyLast4
		})
		.from(familyApiKeys)
		.where(and(eq(familyApiKeys.keyHash, keyHash), isNull(familyApiKeys.revokedAt)))
		.limit(1);

	if (!row?.keyHash || !row.keyPrefix || !row.keyLast4) return null;
	if (!constantTimeEqualHex(row.keyHash, keyHash)) return null;

	await db
		.update(familyApiKeys)
		.set({ lastUsedAt: now() })
		.where(eq(familyApiKeys.id, row.id));

	return {
		id: row.id,
		familyId: row.familyId,
		keyPrefix: row.keyPrefix,
		keyLast4: row.keyLast4
	};
}
