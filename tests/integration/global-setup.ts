import { readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

async function removeIntegrationDbArtifacts() {
	const cwd = process.cwd();
	const entries = await readdir(cwd, { withFileTypes: true });
	const targets = entries
		.filter(
			(entry) =>
				entry.isFile() &&
				/^integration-tests(?:-\d+)?\.db(?:-wal|-shm|-journal)?$/.test(entry.name)
		)
		.map((entry) => join(cwd, entry.name));

	for (const filePath of targets) {
		await rm(filePath, { force: true });
	}
}

export default async function globalSetup() {
	// Clean stale files before tests start.
	await removeIntegrationDbArtifacts();

	return async () => {
		// Final cleanup after all workers exit.
		await removeIntegrationDbArtifacts();
	};
}
