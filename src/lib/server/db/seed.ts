/**
 * Dev seed script — populates a test family with members, chores, and prizes.
 * Run via: npm run db:seed
 *
 * Requires migrations to have been applied first (npm run db:migrate).
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import bcrypt from 'bcrypt';
import { ulid as generateUlid } from 'ulid';
import * as schema from './schema.js';

const dbUrl = process.env.DATABASE_URL ?? 'file:./data/choreography.db';
const client = createClient({ url: dbUrl });
const db = drizzle(client, { schema });

const now = () => new Date().toISOString();
const ulid = () => generateUlid();
const hashPassword = (p: string) => bcrypt.hash(p, 12);
const hashPin = (p: string) => bcrypt.hash(p, 10);

async function seed() {
	// Clear existing data (for repeatable dev seeds)
	await db.delete(schema.prizeRedemptions);
	await db.delete(schema.choreCompletions);
	await db.delete(schema.prizes);
	await db.delete(schema.chores);
	await db.delete(schema.authSession);
	await db.delete(schema.authAccount);
	await db.delete(schema.familyMembers);
	await db.delete(schema.authUser);
	await db.delete(schema.families);

	// Family
	const familyId = ulid();
	await db.insert(schema.families).values({ id: familyId, name: 'The Smiths', createdAt: now() });

	const ts = new Date();

	// Admin member
	const parentId = ulid();
	await db.insert(schema.authUser).values({
		id: parentId,
		name: 'Parent',
		email: 'parent@example.com',
		emailVerified: false,
		avatarEmoji: '👤',
		isActive: true,
		createdAt: ts,
		updatedAt: ts
	});
	await db.insert(schema.authAccount).values({
		id: `cred_${parentId}`,
		accountId: 'parent@example.com',
		providerId: 'credential',
		userId: parentId,
		password: await hashPassword('password123'),
		createdAt: ts,
		updatedAt: ts
	});
	await db.insert(schema.familyMembers).values({
		memberId: parentId,
		familyId,
		role: 'admin',
		joinedAt: now()
	});

	// Member accounts
	const emmaId = ulid();
	const jakeId = ulid();
	await db.insert(schema.authUser).values([
		{ id: emmaId, name: 'Emma', email: null, emailVerified: false, avatarEmoji: '👧', isActive: true, createdAt: ts, updatedAt: ts },
		{ id: jakeId, name: 'Jake', email: null, emailVerified: false, avatarEmoji: '👦', isActive: true, createdAt: ts, updatedAt: ts }
	]);
	await db.insert(schema.authAccount).values([
		{ id: `pin_${emmaId}`, accountId: emmaId, providerId: 'pin-auth', userId: emmaId, password: await hashPin('1234'), createdAt: ts, updatedAt: ts },
		{ id: `pin_${jakeId}`, accountId: jakeId, providerId: 'pin-auth', userId: jakeId, password: await hashPin('5678'), createdAt: ts, updatedAt: ts }
	]);
	await db.insert(schema.familyMembers).values([
		{ memberId: emmaId, familyId, role: 'member', joinedAt: now() },
		{ memberId: jakeId, familyId, role: 'member', joinedAt: now() }
	]);

	// Chores
	const choreIds = [ulid(), ulid(), ulid(), ulid()];
	await db.insert(schema.chores).values([
		{ id: choreIds[0], familyId, title: 'Make your bed', description: 'Neatly make your bed every morning', emoji: '🛏️', frequency: 'daily', coinValue: 5, isActive: true, createdAt: now() },
		{ id: choreIds[1], familyId, title: 'Do the dishes', description: 'Wash and put away the dishes', emoji: '🍽️', frequency: 'daily', coinValue: 10, isActive: true, createdAt: now() },
		{ id: choreIds[2], familyId, title: 'Take out trash', description: 'Empty all bins and take trash to the curb', emoji: '🗑️', frequency: 'weekly', coinValue: 15, isActive: true, createdAt: now() },
		{ id: choreIds[3], familyId, title: 'Clean room', description: 'Tidy up and vacuum your room', emoji: '🧹', frequency: 'weekly', coinValue: 20, isActive: true, createdAt: now() }
	]);
	// Seed assignments for the two assigned chores (using choreAssignments join table)
	await db.insert(schema.choreAssignments).values([
		{ choreId: choreIds[2], memberId: emmaId },
		{ choreId: choreIds[3], memberId: jakeId }
	]);

	// Prizes
	await db.insert(schema.prizes).values([
		{ id: ulid(), familyId, title: 'Extra screen time', description: '30 minutes of extra screen time', emoji: 'noto:video-game', coinCost: 30, isActive: true, createdAt: now() },
		{ id: ulid(), familyId, title: 'Pick dinner', description: 'You choose what we have for dinner!', emoji: 'noto:fork-and-knife-with-plate', coinCost: 50, isActive: true, createdAt: now() },
		{ id: ulid(), familyId, title: 'Stay up late', description: '30 minutes extra bedtime tonight', emoji: 'noto:party-popper', coinCost: 40, isActive: true, createdAt: now() }
	]);

	console.log('✅ Seed complete!');
	console.log('   Admin login: parent@example.com / password123');
	console.log('   Member login: Emma / 1234');
	console.log('   Member login: Jake / 5678');
}

seed().catch(console.error);
