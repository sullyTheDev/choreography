/**
 * Dev seed script — populates a test family with two kids, chores, and prizes.
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
	await db.delete(schema.sessions);
	await db.delete(schema.kids);
	await db.delete(schema.parents);
	await db.delete(schema.families);

	// Family
	const familyId = ulid();
	await db.insert(schema.families).values({ id: familyId, name: 'The Smiths', createdAt: now() });

	// Parent
	const parentId = ulid();
	await db.insert(schema.parents).values({
		id: parentId,
		familyId,
		email: 'parent@example.com',
		passwordHash: await hashPassword('password123'),
		displayName: 'Parent',
		createdAt: now()
	});

	// Kids
	const emmaId = ulid();
	const jakeId = ulid();
	await db.insert(schema.kids).values([
		{ id: emmaId, familyId, displayName: 'Emma', avatarEmoji: '👧', pin: await hashPin('1234'), isActive: true, createdAt: now() },
		{ id: jakeId, familyId, displayName: 'Jake', avatarEmoji: '👦', pin: await hashPin('5678'), isActive: true, createdAt: now() }
	]);

	// Chores
	const choreIds = [ulid(), ulid(), ulid(), ulid()];
	await db.insert(schema.chores).values([
		{ id: choreIds[0], familyId, title: 'Make your bed', description: 'Neatly make your bed every morning', emoji: '🛏️', frequency: 'daily', coinValue: 5, isActive: true, createdAt: now() },
		{ id: choreIds[1], familyId, title: 'Do the dishes', description: 'Wash and put away the dishes', emoji: '🍽️', frequency: 'daily', coinValue: 10, isActive: true, createdAt: now() },
		{ id: choreIds[2], familyId, title: 'Take out trash', description: 'Empty all bins and take trash to the curb', emoji: '🗑️', frequency: 'weekly', coinValue: 15, assignedKidId: emmaId, isActive: true, createdAt: now() },
		{ id: choreIds[3], familyId, title: 'Clean room', description: 'Tidy up and vacuum your room', emoji: '🧹', frequency: 'weekly', coinValue: 20, assignedKidId: jakeId, isActive: true, createdAt: now() }
	]);

	// Prizes
	await db.insert(schema.prizes).values([
		{ id: ulid(), familyId, title: 'Extra screen time', description: '30 minutes of extra screen time', coinCost: 30, isActive: true, createdAt: now() },
		{ id: ulid(), familyId, title: 'Pick dinner', description: 'You choose what we have for dinner!', coinCost: 50, isActive: true, createdAt: now() },
		{ id: ulid(), familyId, title: 'Stay up late', description: '30 minutes extra bedtime tonight', coinCost: 40, isActive: true, createdAt: now() }
	]);

	console.log('✅ Seed complete!');
	console.log(`   Family code: ${familyId.slice(-8)}`);
	console.log('   Parent login: parent@example.com / password123');
	console.log('   Emma PIN: 1234');
	console.log('   Jake PIN: 5678');
}

seed().catch(console.error);
