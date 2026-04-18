import type { Actions, PageServerLoad } from './$types.js';
import { error, fail } from '@sveltejs/kit';
import { and, eq, sum, ne } from 'drizzle-orm';
import { db } from '$lib/server/db/index.js';
import { authUser, authAccount, familyMembers, choreCompletions, prizeRedemptions } from '$lib/server/db/schema.js';
import { hashPassword, hashPin } from '$lib/server/auth.js';
import { now, ulid } from '$lib/server/db/utils.js';

function validEmail(email: string): boolean {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function activeAdminCount(familyId: string): Promise<number> {
	const admins = await db
		.select({ id: authUser.id })
		.from(familyMembers)
		.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
		.where(and(eq(familyMembers.familyId, familyId), eq(familyMembers.role, 'admin'), eq(authUser.isActive, true)));
	return admins.length;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const { session } = locals;
	if (!session || session.memberRole !== 'admin') error(403, 'Forbidden');

	const newFamily = url.searchParams.has('new');

	const rawMembers = await db
		.select({
			id: authUser.id,
			displayName: authUser.name,
			avatarEmoji: authUser.avatarEmoji,
			email: authUser.email,
			isActive: authUser.isActive,
			role: familyMembers.role
		})
		.from(familyMembers)
		.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
		.where(and(eq(familyMembers.familyId, session.familyId), eq(authUser.isActive, true)));

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

		const [existingName] = await db.select({ id: authUser.id }).from(authUser).where(eq(authUser.name, displayName)).limit(1);
		if (existingName) return fail(409, { error: 'Display name must be unique.' });

		let passwordHash: string | null = null;
		let pinHash: string | null = null;

		if (role === 'admin') {
			if (!validEmail(email)) return fail(400, { error: 'Valid email is required for admins.' });
			if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });

			const [existingEmail] = await db.select({ id: authUser.id }).from(authUser).where(eq(authUser.email, email)).limit(1);
			if (existingEmail) return fail(409, { error: 'Email already exists.' });

			passwordHash = await hashPassword(password);

			if (pin) {
				if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4-6 digits.' });
				pinHash = await hashPin(pin);
			}
		} else {
			if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4-6 digits.' });
			pinHash = await hashPin(pin);
		}

		const memberId = ulid();
		const ts = new Date();

		await db.insert(authUser).values({
			id: memberId,
			name: displayName,
			email: role === 'admin' ? email : null,
			emailVerified: false,
			avatarEmoji,
			isActive: true,
			createdAt: ts,
			updatedAt: ts
		});

		await db.insert(familyMembers).values({
			memberId,
			familyId: session.familyId,
			role,
			joinedAt: now()
		});

		if (passwordHash) {
			await db.insert(authAccount).values({
				id: `cred_${memberId}`,
				accountId: email,
				providerId: 'credential',
				userId: memberId,
				password: passwordHash,
				createdAt: ts,
				updatedAt: ts
			});
		}

		if (pinHash) {
			await db.insert(authAccount).values({
				id: `pin_${memberId}`,
				accountId: memberId,
				providerId: 'pin-auth',
				userId: memberId,
				password: pinHash,
				createdAt: ts,
				updatedAt: ts
			});
		}

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
			.select({ id: authUser.id, isActive: authUser.isActive, currentRole: familyMembers.role })
			.from(familyMembers)
			.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(and(eq(familyMembers.familyId, session.familyId), eq(authUser.id, id)))
			.limit(1);
		if (!existing) return fail(404, { error: 'Member not found.' });

		const [nameConflict] = await db
			.select({ id: authUser.id })
			.from(authUser)
			.where(and(eq(authUser.name, displayName), ne(authUser.id, id)))
			.limit(1);
		if (nameConflict) return fail(409, { error: 'Display name must be unique.' });

		if (existing.currentRole === 'admin' && role === 'member' && existing.isActive) {
			const admins = await activeAdminCount(session.familyId);
			if (admins <= 1) return fail(400, { error: 'Cannot demote the last admin.' });
		}

		const userUpdate: Record<string, unknown> = { name: displayName, avatarEmoji, updatedAt: new Date() };

		if (role === 'admin') {
			if (!validEmail(email)) return fail(400, { error: 'Valid email is required for admins.' });
			const [emailConflict] = await db
				.select({ id: authUser.id })
				.from(authUser)
				.where(and(eq(authUser.email, email), ne(authUser.id, id)))
				.limit(1);
			if (emailConflict) return fail(409, { error: 'Email already exists.' });
			userUpdate.email = email;

			if (password) {
				if (password.length < 8) return fail(400, { error: 'Password must be at least 8 characters.' });
				const newHash = await hashPassword(password);
				// Upsert credential account
				const [credAccount] = await db
					.select({ id: authAccount.id })
					.from(authAccount)
					.where(and(eq(authAccount.userId, id), eq(authAccount.providerId, 'credential')))
					.limit(1);
				if (credAccount) {
					await db.update(authAccount).set({ password: newHash, updatedAt: new Date() }).where(eq(authAccount.id, credAccount.id));
				} else {
					await db.insert(authAccount).values({
						id: `cred_${id}`,
						accountId: email,
						providerId: 'credential',
						userId: id,
						password: newHash,
						createdAt: new Date(),
						updatedAt: new Date()
					});
				}
			}
		} else {
			userUpdate.email = null;
		}

		if (pin) {
			if (!/^\d{4,6}$/.test(pin)) return fail(400, { error: 'PIN must be 4-6 digits.' });
			const newHash = await hashPin(pin);
			const [pinAccount] = await db
				.select({ id: authAccount.id })
				.from(authAccount)
				.where(and(eq(authAccount.userId, id), eq(authAccount.providerId, 'pin-auth')))
				.limit(1);
			if (pinAccount) {
				await db.update(authAccount).set({ password: newHash, updatedAt: new Date() }).where(eq(authAccount.id, pinAccount.id));
			} else {
				await db.insert(authAccount).values({
					id: `pin_${id}`,
					accountId: id,
					providerId: 'pin-auth',
					userId: id,
					password: newHash,
					createdAt: new Date(),
					updatedAt: new Date()
				});
			}
		}

		await db.update(authUser).set(userUpdate).where(eq(authUser.id, id));

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
			.select({ role: familyMembers.role, isActive: authUser.isActive })
			.from(familyMembers)
			.innerJoin(authUser, eq(familyMembers.memberId, authUser.id))
			.where(and(eq(familyMembers.familyId, session.familyId), eq(familyMembers.memberId, id)))
			.limit(1);
		if (!target) return fail(404, { error: 'Member not found.' });

		if (target.role === 'admin' && target.isActive) {
			const admins = await activeAdminCount(session.familyId);
			if (admins <= 1) return fail(400, { error: 'Cannot deactivate the last admin.' });
		}

		await db.update(authUser).set({ isActive: false, updatedAt: new Date() }).where(eq(authUser.id, id));
		return { success: true };
	}
};
