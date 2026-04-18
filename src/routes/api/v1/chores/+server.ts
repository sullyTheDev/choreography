import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { chores, choreAssignments } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey, parseJsonBody } from '$lib/server/api-utils.js';
import { ulid } from 'ulid';

export const GET: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const choreId = searchParams.get('id');

		if (choreId) {
			// Get specific chore
			const [chore] = await db
				.select()
				.from(chores)
				.where(eq(chores.id, choreId))
				.limit(1);

			if (!chore || chore.familyId !== apiKey.familyId) {
				return apiError(404, 'Chore not found', 'NOT_FOUND');
			}

			return apiOk(chore);
		}

		// List all chores for family
		const familyChores = await db.select().from(chores).where(eq(chores.familyId, apiKey.familyId));

		return apiOk(familyChores);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Chores API GET error:', err);
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
			frequency: 'daily' | 'weekly';
			coinValue: number;
		}>(event);

		if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
			return apiError(400, 'Chore title is required', 'INVALID_INPUT');
		}

		if (!body.frequency || !['daily', 'weekly'].includes(body.frequency)) {
			return apiError(400, 'Frequency must be "daily" or "weekly"', 'INVALID_INPUT');
		}

		if (typeof body.coinValue !== 'number' || body.coinValue <= 0) {
			return apiError(400, 'Coin value must be a positive number', 'INVALID_INPUT');
		}

		const chore = {
			id: ulid(),
			familyId: apiKey.familyId,
			title: body.title.trim(),
			description: body.description?.trim() ?? '',
			emoji: body.emoji ?? '🧹',
			frequency: body.frequency,
			coinValue: body.coinValue,
			isActive: true,
			createdAt: new Date().toISOString()
		};

		await db.insert(chores).values(chore);

		return apiOk(chore, 201);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Chores API POST error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const PUT: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const choreId = searchParams.get('id');

		if (!choreId) {
			return apiError(400, 'Chore ID is required', 'INVALID_INPUT');
		}

		const body = await parseJsonBody<{
			title?: string;
			description?: string;
			emoji?: string;
			frequency?: 'daily' | 'weekly';
			coinValue?: number;
			isActive?: boolean;
		}>(event);

		const [existing] = await db.select().from(chores).where(eq(chores.id, choreId)).limit(1);

		if (!existing || existing.familyId !== apiKey.familyId) {
			return apiError(404, 'Chore not found', 'NOT_FOUND');
		}

		const updated = {
			...existing,
			title: body.title?.trim() ?? existing.title,
			description: body.description !== undefined ? body.description?.trim() ?? '' : existing.description,
			emoji: body.emoji ?? existing.emoji,
			frequency: body.frequency ?? existing.frequency,
			coinValue: body.coinValue ?? existing.coinValue,
			isActive: body.isActive !== undefined ? body.isActive : existing.isActive
		};

		await db.update(chores).set(updated).where(eq(chores.id, choreId));

		return apiOk(updated);
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Chores API PUT error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const apiKey = requireApiKey(event);

		const { searchParams } = new URL(event.request.url);
		const choreId = searchParams.get('id');

		if (!choreId) {
			return apiError(400, 'Chore ID is required', 'INVALID_INPUT');
		}

		const [existing] = await db.select().from(chores).where(eq(chores.id, choreId)).limit(1);

		if (!existing || existing.familyId !== apiKey.familyId) {
			return apiError(404, 'Chore not found', 'NOT_FOUND');
		}

		// Delete assignments first (FK constraint)
		await db.delete(choreAssignments).where(eq(choreAssignments.choreId, choreId));
		await db.delete(chores).where(eq(chores.id, choreId));

		return apiOk({ success: true, deletedId: choreId });
	} catch (err) {
		if (err instanceof Response) return err;
		console.error('Chores API DELETE error:', err);
		return apiError(500, 'Internal server error', 'INTERNAL_ERROR');
	}
};
