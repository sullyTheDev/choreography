import type { Actions, PageServerLoad } from './$types.js';
import { fail, error } from '@sveltejs/kit';
import { eq, and, asc, desc, count } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import {
	prizeRedemptions,
	prizes,
	authUser,
	familyMembers,
	activityEvents
} from '$lib/server/db/schema.js';
import { ulid, now } from '$lib/server/db/utils.js';
import { logger } from '$lib/server/logger.js';

const PAGE_SIZE = 10;

const ALLOWED_SORT = ['requestedAt', 'memberName', 'prizeName', 'coinCost'] as const;
type SortCol = (typeof ALLOWED_SORT)[number];
const ALLOWED_DIR = ['asc', 'desc'] as const;
type SortDir = (typeof ALLOWED_DIR)[number];

function isSortCol(s: string): s is SortCol {
	return (ALLOWED_SORT as readonly string[]).includes(s);
}
function isSortDir(s: string): s is SortDir {
	return (ALLOWED_DIR as readonly string[]).includes(s);
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const rawSort = url.searchParams.get('sort') ?? 'requestedAt';
	const rawDir = url.searchParams.get('dir') ?? 'asc';
	const sort: SortCol = isSortCol(rawSort) ? rawSort : 'requestedAt';
	const dir: SortDir = isSortDir(rawDir) ? rawDir : 'asc';
	const offset = (page - 1) * PAGE_SIZE;

	const familyId = session.familyId;

	// Build sort expression
	function sortExpr(col: SortCol) {
		const d = dir === 'asc' ? asc : desc;
		if (col === 'requestedAt') return d(prizeRedemptions.redeemedAt);
		if (col === 'memberName') return d(authUser.name);
		if (col === 'prizeName') return d(prizes.title);
		if (col === 'coinCost') return d(prizeRedemptions.coinCost);
		return d(prizeRedemptions.redeemedAt);
	}

	const baseWhere = and(
		eq(prizeRedemptions.familyId, familyId),
		eq(prizeRedemptions.status, 'pending')
	);

	const [rows, [{ total }]] = await Promise.all([
		db
			.select({
				redemptionId: prizeRedemptions.id,
				prizeId: prizes.id,
				prizeName: prizes.title,
				prizeEmoji: prizes.emoji,
				memberId: authUser.id,
				memberName: authUser.name,
				requestedAt: prizeRedemptions.redeemedAt,
				coinCost: prizeRedemptions.coinCost
			})
			.from(prizeRedemptions)
			.innerJoin(prizes, eq(prizeRedemptions.prizeId, prizes.id))
			.innerJoin(
				familyMembers,
				and(
					eq(familyMembers.memberId, prizeRedemptions.memberId),
					eq(familyMembers.familyId, familyId)
				)
			)
			.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(baseWhere)
			.orderBy(sortExpr(sort))
			.limit(PAGE_SIZE)
			.offset(offset),
		db
			.select({ total: count() })
			.from(prizeRedemptions)
			.where(baseWhere)
	]);

	return {
		items: rows,
		totalCount: total,
		page,
		pageSize: PAGE_SIZE,
		sort,
		dir
	};
};

export const actions: Actions = {
	fulfill: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const fd = await request.formData();
		const redemptionId = String(fd.get('redemptionId') ?? '').trim();
		if (!redemptionId) return fail(400, { error: 'Redemption ID required' });

		const familyId = session.familyId;

		// Fetch current pending row for this family
		const [existing] = await db
			.select({
				id: prizeRedemptions.id,
				prizeId: prizeRedemptions.prizeId,
				memberId: prizeRedemptions.memberId,
				status: prizeRedemptions.status
			})
			.from(prizeRedemptions)
			.where(
				and(
					eq(prizeRedemptions.id, redemptionId),
					eq(prizeRedemptions.familyId, familyId),
					eq(prizeRedemptions.status, 'pending')
				)
			)
			.limit(1);

		if (!existing) {
			return { success: false, conflict: 'already_processed' };
		}

		const [prize] = await db
			.select({ title: prizes.title })
			.from(prizes)
			.where(and(eq(prizes.id, existing.prizeId), eq(prizes.familyId, familyId)))
			.limit(1);

		const occurredAt = now();
		await db.transaction(async (tx) => {
			await tx
				.update(prizeRedemptions)
				.set({ status: 'fulfilled' })
				.where(
					and(eq(prizeRedemptions.id, redemptionId), eq(prizeRedemptions.familyId, familyId))
				);

			await tx.insert(activityEvents).values({
				id: ulid(),
				familyId,
				actorMemberId: session.memberId,
				subjectMemberId: existing.memberId,
				eventType: 'prize_fulfilled',
				entityType: 'prize_redemption',
				entityId: redemptionId,
				deltaCoins: 0,
				metadata: JSON.stringify({
					prizeId: existing.prizeId,
					prizeTitle: prize?.title ?? 'Unknown prize',
					fromStatus: 'pending',
					toStatus: 'fulfilled',
					source: 'admin_approvals_fulfill'
				}),
				occurredAt,
				createdAt: occurredAt
			});
		});

		logger.info(
			{ redemptionId, adminId: session.memberId, familyId },
			'Prize redemption fulfilled (pending → fulfilled)'
		);
		return { success: true };
	},

	dismiss: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const fd = await request.formData();
		const redemptionId = String(fd.get('redemptionId') ?? '').trim();
		if (!redemptionId) return fail(400, { error: 'Redemption ID required' });

		const familyId = session.familyId;

		// Verify the row is still pending and belongs to this family
		const [existing] = await db
			.select({ id: prizeRedemptions.id })
			.from(prizeRedemptions)
			.where(
				and(
					eq(prizeRedemptions.id, redemptionId),
					eq(prizeRedemptions.familyId, familyId),
					eq(prizeRedemptions.status, 'pending')
				)
			)
			.limit(1);

		if (!existing) {
			return { success: false, conflict: 'already_processed' };
		}

		await db
			.delete(prizeRedemptions)
			.where(
				and(eq(prizeRedemptions.id, redemptionId), eq(prizeRedemptions.familyId, familyId))
			);

		logger.info(
			{ redemptionId, adminId: session.memberId, familyId },
			'Prize redemption dismissed (pending → deleted)'
		);
		return { success: true };
	}
};
