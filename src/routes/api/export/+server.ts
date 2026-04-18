import type { RequestHandler } from './$types.js';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	families,
	authUser,
	familyMembers,
	chores,
	choreCompletions,
	prizes,
	prizeRedemptions
} from '$lib/server/db/schema.js';

export const GET: RequestHandler = async ({ locals }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const familyId = session.familyId;

	const [
		familyData,
		membersData,
		choresData,
		prizeData,
		completionsData,
		redemptionsData
	] = await Promise.all([
		db.select().from(families).where(eq(families.id, familyId)),
		db
			.select({
					id: authUser.id,
					displayName: authUser.name,
					avatarEmoji: authUser.avatarEmoji,
					email: authUser.email,
					isActive: authUser.isActive,
					createdAt: authUser.createdAt,
					role: familyMembers.role
				})
				.from(familyMembers)
				.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(eq(familyMembers.familyId, familyId)),
		db.select().from(chores).where(eq(chores.familyId, familyId)),
		db.select().from(prizes).where(eq(prizes.familyId, familyId)),
		db.select().from(choreCompletions).where(eq(choreCompletions.familyId, familyId)),
		db.select().from(prizeRedemptions).where(eq(prizeRedemptions.familyId, familyId))
	]);

	const payload = {
		family: familyData[0] ?? null,
		members: membersData,
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
