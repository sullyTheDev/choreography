import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	families,
	parents,
	kids,
	chores,
	choreCompletions,
	prizes,
	prizeRedemptions
} from '$lib/server/db/schema.js';

export const GET: RequestHandler = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.userRole !== 'parent') error(403, 'Forbidden');

	const familyId = session.familyId;

	const [
		familyData,
		parentsData,
		kidsData,
		choresData,
		prizeData,
		completionsData,
		redemptionsData
	] = await Promise.all([
		db.select().from(families).where(eq(families.id, familyId)),
		db.select().from(parents).where(eq(parents.familyId, familyId)),
		db.select().from(kids).where(eq(kids.familyId, familyId)),
		db.select().from(chores).where(eq(chores.familyId, familyId)),
		db.select().from(prizes).where(eq(prizes.familyId, familyId)),
		db.select().from(choreCompletions).where(eq(choreCompletions.familyId, familyId)),
		db.select().from(prizeRedemptions).where(eq(prizeRedemptions.familyId, familyId))
	]);

	const payload = {
		family: familyData[0] ?? null,
		parents: parentsData.map(({ passwordHash: _, ...rest }) => rest), // omit hashed passwords
		kids: kidsData.map(({ pin: _, ...rest }) => rest), // omit hashed PINs
		chores: choresData,
		choreCompletions: completionsData,
		prizes: prizeData,
		prizeRedemptions: redemptionsData,
		exportedAt: new Date().toISOString()
	};

	const json = JSON.stringify(payload, null, 2);

	return new Response(json, {
		headers: {
			'Content-Type': 'application/json',
			'Content-Disposition': `attachment; filename="choreography-export-${familyId}.json"`
		}
	});
};
