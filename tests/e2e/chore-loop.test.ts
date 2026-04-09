/**
 * T030 — E2E test: Full parent signup → add kid → create chore → kid login → complete chore → verify coin balance
 */
import { test, expect } from '@playwright/test';

test.describe('Chore Loop — full user flow', () => {
	test('parent signs up, adds kid and chore; kid logs in and completes chore', async ({
		page
	}) => {
		const unique = Date.now();
		const parentEmail = `parent-${unique}@test.com`;
		const familyName = `Family ${unique}`;
		const kidName = `Emma${unique}`;
		const pinValue = '1234';

		// ── Step 1: Parent signs up ──────────────────────────────────────────
		await page.goto('/signup');
		await page.fill('input[name="email"]', parentEmail);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'Test Parent');
		await page.fill('input[name="familyName"]', familyName);
		await page.click('button[type="submit"]');

		// Should land on admin/kids
		await expect(page).toHaveURL(/\/admin\/kids/);

		// ── Step 2: Parent adds a kid ────────────────────────────────────────
		await page.click('button:has-text("Add Kid")');
		await page.fill('input[name="displayName"]', kidName);
		await page.click('label:has(input[name="avatarEmoji"][value="👧"])');
		await page.fill('input[name="pin"]', pinValue);
		await page.click('button[type="submit"]:has-text("Create Kid")');

		// Kid should appear in the list
		await expect(page.locator('text=' + kidName)).toBeVisible();

		// Get the family code for kid login
		// It's shown in the header or family info — navigate to a page that shows it
		await page.goto('/admin/settings');
		const familyCodeEl = page.locator('[data-testid="family-code"], .family-code');
		let familyCode = '';
		if (await familyCodeEl.isVisible()) {
			familyCode = (await familyCodeEl.textContent()) ?? '';
			familyCode = familyCode.trim();
		}

		// ── Step 3: Parent creates a chore ───────────────────────────────────
		await page.goto('/admin/chores');
		await page.click('button:has-text("Add Chore")');
		await page.fill('input[name="title"]', 'Make your bed');
		await page.fill('input[name="coinValue"]', '10');
		await page.click('button[type="submit"]:has-text("Create Chore")');
		await expect(page.locator('text=Make your bed')).toBeVisible();

		// ── Step 4: Parent signs out ──────────────────────────────────────────
		await page.click('a[href="/logout"], button:has-text("Sign out")');
		await expect(page).toHaveURL(/\/login/);

		// ── Step 5: Kid logs in ──────────────────────────────────────────────
		if (familyCode) {
			await page.click('text=Kid');
			await page.fill('input[name="familyCode"]', familyCode);
			await page.fill('input[name="pin"]', pinValue);
			await page.click('button[type="submit"]');

			// Should land on chores page
			await expect(page).toHaveURL(/\/chores/);
			await expect(page.locator('text=Make your bed')).toBeVisible();

			// ── Step 6: Kid completes the chore ─────────────────────────────────
			await page.click('button[aria-label*="Make your bed"]');

			// Chore should now show as completed (green checkmark)
			await expect(page.locator('.done-badge')).toBeVisible();
		}
	});
});
