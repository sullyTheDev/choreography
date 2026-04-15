import type { Actions, PageServerLoad } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { and, eq, sum, ne } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { members, familyMembers, choreCompletions, prizeRedemptions } from '$lib/server/db/schema.js';
import { hashPassword, hashPin, verifyPin } from '$lib/server/auth.js';
import { now, ulid } from '$lib/server/db/utils.js';

function validEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function activeAdminCount(familyId: string): Promise<number> {
	const admins = await db
		.select({ id: members.id })
		.from(familyMembers)
		.innerJoin(members, eq(familyMembers.memberId, members.id))
		.where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.role, 'admin'), eq(members.isActive, true)));
	return admins.length;
}

async function ensurePinUniqueInFamily(familyId: string, pin: string, excludeMemberId?: string) {
	let query = db
		.select({ id: members.id, pin: members.pin })
		.from(familyMembers)
		.innerJoin(members, eq(familyMembers.memberId, members.id))
		.where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.role, 'member'), eq(members.isActive, true)));

	if (excludeMemberId) {
		query = db
			.select({ id: members.id, pin: members.pin })
			.from(familyMembers)
			.innerJoin(members, eq(familyMembers.memberId, members.id))
			.where(
				and(
					eq(familyMembers.familyId, familyId),
					eq(familyMembers.role, 'member'),
					eq(members.isActive, true),
					ne(members.id, excludeMemberId)
				)
			);
	}

	const existing = await query;

	for (const row of existing) {
		if (row.pin && (await verifyPin(pin, row.pin))) {
			return false;
		}
	}

	return true;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const newFamily = url.searchParams.has('new');

	const rawMembers = await db
		.select({
			id: members.id,
			displayName: members.displayName,
			avatarEmoji: members.avatarEmoji,
			email: members.email,
			isActive: members.isActive,
			role: familyMembers.role
		})
		.from(familyMembers)
		.innerJoin(members, eq(familyMembers.memberId, members.id))
		.where(and(eq(familyMembers.familyId, session.familyId), eq(members.isActive, true)));

	const rows = await Promise.all(
		rawMembers.map(async (member) => {
			const [earned] = await db
				.select({ total: sum(choreCompletions.coinsAwarded) })
				.from(choreCompletions)
				.where(eq(choreCompletions.memberId, member.id));
			const [spent] = await db
				.select({ total: sum(prizeRedemptions.coinCost) })
				.from(prizeRedemptions)
				.where(eq(prizeRedemptions.memberId, member.id));

			return {
				...member,
				coinBalance: Number(earned?.total ?? 0) - Number(spent?.total ?? 0)
			};
		})
	);

	return { members: rows, newFamily };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const displayName = String(data.get('displayName') ?? '').trim();
		const avatarEmoji = String(data.get('avatarEmoji') ?? '').trim() || '👤';
		const role = String(data.get('role') ?? '').trim() as 'admin' | 'member';
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');
		const pin = String(data.get('pin') ?? '').trim();

		if (!displayName) return fail(400, { error: 'Display name is required.' });
		if (role !== 'admin' && role !== 'member') return fail(400, { error: 'Role is required.' });

		const [existingName] = await db.select({ id: members.id }).from(members).where(eq(members.displayName, displayName)).limit(1);
		if (existingName) return fail(409, { error: 'Display name must be unique.' });

		let passwordHash: string | null = null;
		let pinHash: string | null = null;

		if (role === 'admin') {
			if (!validEmail(email)) return fail(400, { error: 'Valid email is required for admins.' });
			if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });

			const [existingEmail] = await db.select({ id: members.id }).from(members).where(eq(members.email, email)).limit(1);
			if (existingEmail) return fail(409, { error: 'Email already exists.' });

			passwordHash = await hashPassword(password);
		} else {
			if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4-6 digits.' });
			const unique = await ensurePinUniqueInFamily(session.familyId, pin);
			if (!unique) return fail(400, { error: 'PIN is already used by another member in this family.' });
			pinHash = await hashPin(pin);
		}

		const memberId = ulid();
		await db.insert(members).values({
			id: memberId,
			displayName,
			avatarEmoji,
			email: role === 'admin' ? email : null,
			passwordHash,
			pin: pinHash,
			isActive: true,
			createdAt: now()
		});

		await db.insert(familyMembers).values({
			memberId,
			familyId: session.familyId,
			role,
			joinedAt: now()
		});

		return { success: true };
	},

	update: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const id = String(data.get('id') ?? '').trim();
		const displayName = String(data.get('displayName') ?? '').trim();
		const avatarEmoji = String(data.get('avatarEmoji') ?? '').trim() || '👤';
		const role = String(data.get('role') ?? '').trim() as 'admin' | 'member';
		const email = String(data.get('email') ?? '').trim().toLowerCase();
		const password = String(data.get('password') ?? '');
		const pin = String(data.get('pin') ?? '').trim();

		if (!id) return fail(400, { error: 'Member id is required.' });
		if (!displayName) return fail(400, { error: 'Display name is required.' });
		if (role !== 'admin' && role !== 'member') return fail(400, { error: 'Role is required.' });

		const [existing] = await db
			.select({ id: members.id, isActive: members.isActive, currentRole: familyMembers.role })
			.from(familyMembers)
			.innerJoin(members, eq(familyMembers.memberId, members.id))
			.where(and(eq(familyMembers.familyId, session.familyId), eq(members.id, id)))
			.limit(1);
		if (!existing) return fail(404, { error: 'Member not found.' });

		const [nameConflict] = await db
			.select({ id: members.id })
			.from(members)
			.where(and(eq(members.displayName, displayName), ne(members.id, id)))
			.limit(1);
		if (nameConflict) return fail(409, { error: 'Display name must be unique.' });

		if (existing.currentRole === 'admin' && role === 'member' && existing.isActive) {
			const admins = await activeAdminCount(session.familyId);
			if (admins <= 1) return fail(400, { error: 'Cannot demote the last admin.' });
		}

		let passwordHashUpdate: string | null | undefined = undefined;
		let pinHashUpdate: string | null | undefined = undefined;

		if (role === 'admin') {
			if (!validEmail(email)) return fail(400, { error: 'Valid email is required for admins.' });
			const [emailConflict] = await db
				.select({ id: members.id })
				.from(members)
				.where(and(eq(members.email, email), ne(members.id, id)))
				.limit(1);
			if (emailConflict) return fail(409, { error: 'Email already exists.' });

			if (password) {
				if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });
				passwordHashUpdate = await hashPassword(password);
			}
			pinHashUpdate = null;
		} else {
			if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4-6 digits.' });
			const unique = await ensurePinUniqueInFamily(session.familyId, pin, id);
			if (!unique) return fail(400, { error: 'PIN is already used by another member in this family.' });
			pinHashUpdate = await hashPin(pin);
			passwordHashUpdate = null;
		}

		await db
			.update(members)
			.set({
				displayName,
				avatarEmoji,
				email: role === 'admin' ? email : null,
				passwordHash: passwordHashUpdate === undefined ? undefined : passwordHashUpdate,
				pin: pinHashUpdate === undefined ? undefined : pinHashUpdate
			})
			.where(eq(members.id, id));

		await db
			.update(familyMembers)
			.set({ role })
			.where(and(eq(familyMembers.memberId, id), eq(familyMembers.familyId, session.familyId)));

		return { success: true };
	},

	deactivate: async ({ request, locals }) => {
		const { session } = locals;
		if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

		const data = await request.formData();
		const id = String(data.get('id') ?? '').trim();
		if (!id) return fail(400, { error: 'Member id is required.' });

		const [target] = await db
			.select({ role: familyMembers.role, isActive: members.isActive })
			.from(familyMembers)
			.innerJoin(members, eq(familyMembers.memberId, members.id))
			.where(and(eq(familyMembers.familyId, session.familyId), eq(familyMembers.memberId, id)))
			.limit(1);
		if (!target) return fail(404, { error: 'Member not found.' });

		if (target.role === 'admin' && target.isActive) {
			const admins = await activeAdminCount(session.familyId);
			if (admins <= 1) return fail(400, { error: 'Cannot deactivate the last admin.' });
		}

		await db.update(members).set({ isActive: false }).where(eq(members.id, id));
		return { success: true };
	}
};
