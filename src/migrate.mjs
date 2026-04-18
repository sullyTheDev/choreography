/**
 * Standalone migration script — run before starting the app server.
 * Usage: node src/migrate.mjs
 *   or via: npm run db:migrate:prod
 */
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dbUrl = process.env.DATABASE_URL ?? 'file:./data/choreography.db';

if (dbUrl.startsWith('file:')) {
	const filePath = resolve(dbUrl.slice(5));
	mkdirSync(dirname(filePath), { recursive: true });
}

const client = createClient({ url: dbUrl });
const db = drizzle(client);

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '..', 'drizzle');

console.log(`Running migrations from ${migrationsFolder} against ${dbUrl}...`);
await migrate(db, { migrationsFolder });
console.log('Migrations complete.');
client.close();