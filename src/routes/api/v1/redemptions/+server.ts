import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { prizeRedemptions, prizeAssignments } from '$lib/server/db/schema.js';
import { eq, and } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey, parseJsonBody } from '$lib/server/api-utils.js';
import { ulid } from 'ulid';

type RedemptionStatus = 'available' | 'pending' | 'fulfilled' | 'dismissed';

export const GET: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const redemptionId = searchParams.get('id');
		const status = searchParams.get('status') as RedemptionStatus | null;

		if (redemptionId) {
			// Get specific redemption
			const [redemption] = await db
				.select()
				.from(prizeRedemptions)
				.where(eq(prizeRedemptions.id, redemptionId))
				.limit(1);

			if (!redemption || redemption.familyId !== apiKey.familyId) {
				return apiError(404, 'Redemption not found', 'NOT_FOUND');
			}

			return apiOk(redemption);
		}

		// List redemptions for family, optionally filtered by status
		let query = db.select().from(prizeRedemptions).where(eq(prizeRedemptions.familyId, apiKey.familyId));

		if (status) {
			query = db
				.select()
				.from(prizeRedemptions)
				.where(and(eq(prizeRedemptions.familyId, apiKey.familyId), eq(prizeRedemptions.status, status)));
		}

		const redemptions = await query;

		return apiOk(redemptions);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Redemptions API GET error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const POST: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const body = await parseJsonBody<{
			memberId: string;
			prizeId: string;
		}>(event);

		if (!body.memberId || typeof body.memberId !== 'string') {
			return apiError(400, 'memberId is required', 'INVALID_INPUT');
		}

		if (!body.prizeId || typeof body.prizeId !== 'string') {
			return apiError(400, 'prizeId is required', 'INVALID_INPUT');
		}

		// Verify prize exists and belongs to family
		const [prize] = await db.select().from(prizeAssignments).where(eq(prizeAssignments.prizeId, body.prizeId)).limit(1);

		if (!prize) {
			return apiError(404, 'Prize not found', 'NOT_FOUND');
		}

		const redemption = {
			id: ulid(),
			familyId: apiKey.familyId,
			memberId: body.memberId,
			prizeId: body.prizeId,
			status: 'available' as const,
			createdAt: new Date(),
			updatedAt: new Date(),
			fulfilledAt: null,
			dismissedAt: null
		};

		await db.insert(prizeRedemptions).values(redemption);

		return apiOk(redemption, 201);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Redemptions API POST error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const PUT: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const redemptionId = searchParams.get('id');

		if (!redemptionId) {
			return apiError(400, 'Redemption ID is required', 'INVALID_INPUT');
		}

		const body = await parseJsonBody<{
			status?: RedemptionStatus;
		}>(event);

		const [existing] = await db
			.select()
			.from(prizeRedemptions)
			.where(eq(prizeRedemptions.id, redemptionId))
			.limit(1);

		if (!existing || existing.familyId !== apiKey.familyId) {
			return apiError(404, 'Redemption not found', 'NOT_FOUND');
		}

		if (!body.status) {
			return apiError(400, 'status is required', 'INVALID_INPUT');
		}

		const validStatuses: RedemptionStatus[] = ['available', 'pending', 'fulfilled', 'dismissed'];
		if (!validStatuses.includes(body.status)) {
			return apiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 'INVALID_INPUT');
		}

		const now = new Date();
		const updated = {
			...existing,
			status: body.status,
			updatedAt: now,
			fulfilledAt: body.status === 'fulfilled' ? now : existing.fulfilledAt,
			dismissedAt: body.status === 'dismissed' ? now : existing.dismissedAt
		};

		await db.update(prizeRedemptions).set(updated).where(eq(prizeRedemptions.id, redemptionId));

		return apiOk(updated);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Redemptions API PUT error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
