import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { prizes, prizeAssignments } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey, parseJsonBody } from '$lib/server/api-utils.js';
import { ulid } from 'ulid';

export const GET: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const prizeId = searchParams.get('id');

		if (prizeId) {
			// Get specific prize
			const [prize] = await db
				.select()
				.from(prizes)
				.where(eq(prizes.id, prizeId))
				.limit(1);

			if (!prize || prize.familyId !== apiKey.familyId) {
				return apiError(404, 'Prize not found', 'NOT_FOUND');
			}

			return apiOk(prize);
		}

		// List all prizes for family
		const familyPrizes = await db.select().from(prizes).where(eq(prizes.familyId, apiKey.familyId));

		return apiOk(familyPrizes);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Prizes API GET error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const POST: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const body = await parseJsonBody<{
			title: string;
			description?: string;
			emoji?: string;
			coinCost: number;
		}>(event);

		if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
			return apiError(400, 'Prize title is required', 'INVALID_INPUT');
		}

		if (typeof body.coinCost !== 'number' || body.coinCost <= 0) {
			return apiError(400, 'Coin cost must be a positive number', 'INVALID_INPUT');
		}

		const prize = {
			id: ulid(),
			familyId: apiKey.familyId,
			title: body.title.trim(),
			description: body.description?.trim() ?? '',
			emoji: body.emoji ?? 'πŸŽ',
			coinCost: body.coinCost,
			isActive: true,
			createdAt: new Date().toISOString()
		};

		await db.insert(prizes).values(prize);

		return apiOk(prize, 201);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Prizes API POST error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const PUT: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const prizeId = searchParams.get('id');

		if (!prizeId) {
			return apiError(400, 'Prize ID is required', 'INVALID_INPUT');
		}

		const body = await parseJsonBody<{
			title?: string;
			description?: string;
			emoji?: string;
			coinCost?: number;
			isActive?: boolean;
		}>(event);

		const [existing] = await db.select().from(prizes).where(eq(prizes.id, prizeId)).limit(1);

		if (!existing || existing.familyId !== apiKey.familyId) {
			return apiError(404, 'Prize not found', 'NOT_FOUND');
		}

		const updated = {
			...existing,
			title: body.title?.trim() ?? existing.title,
			description: body.description !== undefined ? body.description?.trim() ?? '' : existing.description,
			emoji: body.emoji ?? existing.emoji,
			coinCost: body.coinCost ?? existing.coinCost,
			isActive: body.isActive !== undefined ? body.isActive : existing.isActive
		};

		await db.update(prizes).set(updated).where(eq(prizes.id, prizeId));

		return apiOk(updated);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Prizes API PUT error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const prizeId = searchParams.get('id');

		if (!prizeId) {
			return apiError(400, 'Prize ID is required', 'INVALID_INPUT');
		}

		const [existing] = await db.select().from(prizes).where(eq(prizes.id, prizeId)).limit(1);

		if (!existing || existing.familyId !== apiKey.familyId) {
			return apiError(404, 'Prize not found', 'NOT_FOUND');
		}

		// Delete assignments first (FK constraint)
		await db.delete(prizeAssignments).where(eq(prizeAssignments.prizeId, prizeId));
		await db.delete(prizes).where(eq(prizes.id, prizeId));

		return apiOk({ success: true, deletedId: prizeId });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Prizes API DELETE error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
