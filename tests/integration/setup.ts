/**
 * Integration test setup — creates an in-memory libsql database,
 * applies migrations, and mocks the production db singleton.
 *
 * All integration tests share this setup via vitest's setupFiles config.
 */
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { vi, afterEach } from 'vitest';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as schema from '../../src/lib/server/db/schema.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// In-memory libsql database for tests
const client = createClient({ url: ':memory:' });
export const testDb = drizzle(client, { schema });

// Apply migrations before any tests run
await migrate(testDb, { migrationsFolder: join(__dirname, '../../drizzle') });

// Mock the db module so all server code uses testDb
vi.mock('$lib/server/db/index.js', () => ({
	db: testDb
}));

// Reset all tables between test files
afterEach(async () => {
	await testDb.delete(schema.prizeRedemptions);
	await testDb.delete(schema.choreCompletions);
	await testDb.delete(schema.choreAssignments);
	await testDb.delete(schema.prizeAssignments);
	await testDb.delete(schema.sessions);
	await testDb.delete(schema.chores);
	await testDb.delete(schema.prizes);
	await testDb.delete(schema.familyMembers);
	await testDb.delete(schema.members);
	await testDb.delete(schema.families);
});
