import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import * as schema from './schema.js';

function createDb(url: string) {
	// Ensure the data directory exists for local file databases
	if (url.startsWith('file:')) {
		const filePath = resolve(url.slice(5));
		mkdirSync(dirname(filePath), { recursive: true });
	}
	const client = createClient({ url });
	return drizzle(client, { schema });
}

const dbUrl = process.env.DATABASE_URL ?? 'file:./data/choreography.db';
export const db = createDb(dbUrl);

export type Db = typeof db;
