import { db } from '$lib/server/db/index.js';
import { families, familyMembers, authUser } from '$lib/server/db/schema.js';
import { issueFamilyApiKey } from '$lib/server/api-keys.js';
import { ulid } from 'ulid';

async function setupTestData() {
	console.log('Setting up test data...');

	// Create a test family
	const familyId = ulid();
	const family = {
		id: familyId,
		name: 'Test Family',
		leaderboardResetDay: 1,
		createdAt: new Date()
	};

	await db.insert(families).values(family);
	console.log('✓ Created family:', familyId);

	// Create a test member
	const userId = ulid();
	const user = {
		id: userId,
		email: 'test@example.com',
		emailVerified: true,
		displayName: 'Test User',
		hasPassword: false,
		twoFactorEnabled: false,
		image: null,
		createdAt: new Date(),
		updatedAt: new Date()
	};

	await db.insert(authUser).values(user);
	console.log('✓ Created user:', userId);

	// Create family member
	const member = {
		memberId: userId,
		familyId,
		displayName: 'Test Member',
		memberRole: 'admin',
		createdAt: new Date()
	};

	await db.insert(familyMembers).values(member);
	console.log('✓ Created family member');

	// Generate API key
	const apiKey = await issueFamilyApiKey({
		familyId,
		actorMemberId: userId
	});

	console.log('\n✓ API Key Generated:');
	console.log('  Family ID:', familyId);
	console.log('  User ID:', userId);
	console.log('  API Key:', apiKey.rawKey);
	console.log('  Prefix:', apiKey.keyPrefix);
	console.log('  Last 4:', apiKey.keyLast4);

	console.log('\nTest Data Setup Complete!');
	process.exit(0);
}

setupTestData().catch((err) => {
	console.error('Error:', err);
	process.exit(1);
});
