import type { RequestHandler } from './$types.js';
import { db } from '$lib/server/db/index.js';
import { chores, choreAssignments } from '$lib/server/db/schema.js';
import { eq } from 'drizzle-orm';
import { apiError, apiOk, requireApiKey, validateRequestMethod, parseJsonBody } from '$lib/server/api-utils.js';
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

			// Get assignments for this chore
			const assignments = await db
				.select()
				.from(choreAssignments)
				.where(eq(choreAssignments.choreId, choreId));

			return apiOk({
				...chore,
				assignments
			});
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

		const body = await parseJsonBody<{ name: string; description?: string; emoji?: string }>(event);

		if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
			return apiError(400, 'Chore name is required', 'INVALID_INPUT');
		}

		const chore = {
			id: ulid(),
			familyId: apiKey.familyId,
			name: body.name.trim(),
			description: body.description?.trim() ?? null,
			emoji: body.emoji ?? 'πŸŽ―',
			createdAt: new Date(),
			updatedAt: new Date()
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

		const body = await parseJsonBody<{ name?: string; description?: string; emoji?: string }>(event);

		const [existing] = await db.select().from(chores).where(eq(chores.id, choreId)).limit(1);

		if (!existing || existing.familyId !== apiKey.familyId) {
			return apiError(404, 'Chore not found', 'NOT_FOUND');
		}

		const updated = {
			...existing,
			name: body.name?.trim() ?? existing.name,
			description: body.description !== undefined ? body.description?.trim() ?? null : existing.description,
			emoji: body.emoji ?? existing.emoji,
			updatedAt: new Date()
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
