import { test, expect } from '@playwright/test';

test.describe('REST API', () => {
	let apiKey: string;
	let familyId: string;
	let baseUrl: string;

	test.beforeAll(async () => {
		baseUrl = 'https://localhost:5173';
	});

	test('should generate and authenticate with API key', async ({ page }) => {
		// Navigate to signup
		await page.goto(`${baseUrl}/auth/signup`);

		// Create account
		const email = `test-${Date.now()}@example.com`;
		const password = 'TestPassword123!';

		await page.fill('input[name="email"]', email);
		await page.fill('input[name="password"]', password);
		await page.fill('input[name="confirmPassword"]', password);
		await page.click('button[type="submit"]');

		// Wait for redirect to app
		await page.waitForURL(/\/(app|admin)\//);

		// Navigate to settings
		await page.goto(`${baseUrl}/app/admin/settings`);
		await page.waitForLoadState('networkidle');

		// Click "Generate API Key" button
		const generateButton = page.locator('button:has-text("Generate API Key")');
		await generateButton.click();

		// Wait for success message and extract the key
		await page.waitForSelector('input[readonly]:has-text("choreo_")');
		const keyInput = page.locator('input[readonly]').first();
		apiKey = await keyInput.inputValue();

		// Extract family ID from URL or page state
		const url = new URL(page.url());
		familyId = url.pathname.split('/')[3]; // /app/familyId/admin/settings

		console.log('✓ API Key generated:', apiKey.substring(0, 20) + '...');
		console.log('✓ Family ID:', familyId);
	});

	test('should list chores with API key', async ({ request }) => {
		const response = await request.get(`${baseUrl}/api/v1/chores`, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		expect(response.status()).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(Array.isArray(data.data)).toBe(true);
	});

	test('should create a chore via API', async ({ request }) => {
		const response = await request.post(`${baseUrl}/api/v1/chores`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				name: 'Wash Dishes',
				description: 'Wash all dishes in the sink',
				emoji: 'πŸ›'
			}
		});

		expect(response.status()).toBe(201);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.data.name).toBe('Wash Dishes');
		expect(data.data.familyId).toBe(familyId);
	});

	test('should list prizes with API key', async ({ request }) => {
		const response = await request.get(`${baseUrl}/api/v1/prizes`, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		expect(response.status()).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(Array.isArray(data.data)).toBe(true);
	});

	test('should create a prize via API', async ({ request }) => {
		const response = await request.post(`${baseUrl}/api/v1/prizes`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				name: 'Ice Cream',
				description: 'Get a free scoop of ice cream',
				emoji: 'πŸ¨',
				costPoints: 100
			}
		});

		expect(response.status()).toBe(201);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(data.data.name).toBe('Ice Cream');
		expect(data.data.costPoints).toBe(100);
	});

	test('should list members with API key', async ({ request }) => {
		const response = await request.get(`${baseUrl}/api/v1/members`, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		expect(response.status()).toBe(200);
		const data = await response.json();
		expect(data.success).toBe(true);
		expect(Array.isArray(data.data)).toBe(true);
	});

	test('should deny request without API key', async ({ request }) => {
		const response = await request.get(`${baseUrl}/api/v1/chores`);

		expect(response.status()).toBe(401);
		const data = await response.json();
		expect(data.success).toBe(false);
		expect(data.error).toContain('API key');
	});

	test('should deny request with invalid API key', async ({ request }) => {
		const response = await request.get(`${baseUrl}/api/v1/chores`, {
			headers: {
				Authorization: 'Bearer invalid_key_xyz'
			}
		});

		expect(response.status()).toBe(401);
		const data = await response.json();
		expect(data.success).toBe(false);
	});

	test('should manage redemption status', async ({ request }) => {
		// First, create a prize (we'll use the one from earlier tests if available)
		const prizeRes = await request.post(`${baseUrl}/api/v1/prizes`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				name: 'Pizza Night',
				costPoints: 250
			}
		});

		const prizeData = await prizeRes.json();
		const prizeId = prizeData.data.id;

		// Get a member ID (from members endpoint)
		const membersRes = await request.get(`${baseUrl}/api/v1/members`, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		const membersData = await membersRes.json();
		const memberId = membersData.data[0].memberId;

		// Create a redemption
		const redemptionRes = await request.post(`${baseUrl}/api/v1/redemptions`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				memberId,
				prizeId
			}
		});

		expect(redemptionRes.status()).toBe(201);
		const redemptionData = await redemptionRes.json();
		const redemptionId = redemptionData.data.id;
		expect(redemptionData.data.status).toBe('available');

		// Update status to pending
		const updateRes = await request.put(`${baseUrl}/api/v1/redemptions?id=${redemptionId}`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				status: 'pending'
			}
		});

		expect(updateRes.status()).toBe(200);
		const updateData = await updateRes.json();
		expect(updateData.data.status).toBe('pending');

		// Update status to fulfilled
		const fulfillRes = await request.put(`${baseUrl}/api/v1/redemptions?id=${redemptionId}`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				status: 'fulfilled'
			}
		});

		expect(fulfillRes.status()).toBe(200);
		const fulfillData = await fulfillRes.json();
		expect(fulfillData.data.status).toBe('fulfilled');
		expect(fulfillData.data.fulfilledAt).toBeTruthy();
	});

	test('should handle dismissed redemptions as status update', async ({ request }) => {
		// Create prize
		const prizeRes = await request.post(`${baseUrl}/api/v1/prizes`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				name: 'Movie Tickets',
				costPoints: 200
			}
		});

		const prizeData = await prizeRes.json();
		const prizeId = prizeData.data.id;

		// Get member
		const membersRes = await request.get(`${baseUrl}/api/v1/members`, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		const membersData = await membersRes.json();
		const memberId = membersData.data[0].memberId;

		// Create redemption
		const redemptionRes = await request.post(`${baseUrl}/api/v1/redemptions`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				memberId,
				prizeId
			}
		});

		const redemptionData = await redemptionRes.json();
		const redemptionId = redemptionData.data.id;

		// Dismiss the redemption (status-based, not delete)
		const dismissRes = await request.put(`${baseUrl}/api/v1/redemptions?id=${redemptionId}`, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			},
			data: {
				status: 'dismissed'
			}
		});

		expect(dismissRes.status()).toBe(200);
		const dismissData = await dismissRes.json();
		expect(dismissData.data.status).toBe('dismissed');
		expect(dismissData.data.dismissedAt).toBeTruthy();

		// Verify the redemption still exists (not deleted)
		const getRes = await request.get(`${baseUrl}/api/v1/redemptions?id=${redemptionId}`, {
			headers: {
				Authorization: `Bearer ${apiKey}`
			}
		});

		expect(getRes.status()).toBe(200);
		const getData = await getRes.json();
		expect(getData.data.status).toBe('dismissed');
	});
});
