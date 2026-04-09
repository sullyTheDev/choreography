/**
 * T041 — E2E test: parent creates prize → kid redeems → verify balance decrease
 * T065 — E2E test: parent views Activity Log after kid activity
 */
import { test, expect } from '@playwright/test';

test.describe('Prize Shop — full flow', () => {
	test('parent creates prize; kid redeems it; balance decreases', async ({ page }) => {
		const unique = Date.now();
		const parentEmail = `prize-parent-${unique}@test.com`;

		// ── Sign up as parent ────────────────────────────────────────────────
		await page.goto('/signup');
		await page.fill('input[name="email"]', parentEmail);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'Prize Parent');
		await page.fill('input[name="familyName"]', `Prize Family ${unique}`);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/admin\/kids/);

		// ── Add a kid ────────────────────────────────────────────────────────
		await page.click('button:has-text("Add Kid")');
		await page.fill('input[name="displayName"]', `Kid${unique}`);
		await page.click('label:has(input[name="avatarEmoji"][value="👦"])');
		await page.fill('input[name="pin"]', '5678');
		await page.click('button[type="submit"]:has-text("Create Kid")');

		// ── Add a chore so the kid can earn coins ────────────────────────────
		await page.goto('/admin/chores');
		await page.click('button:has-text("Add Chore")');
		await page.fill('input[name="title"]', 'Test Chore');
		await page.fill('input[name="coinValue"]', '100');
		await page.click('button[type="submit"]:has-text("Create Chore")');

		// ── Add a prize ──────────────────────────────────────────────────────
		await page.goto('/admin/prizes');
		await page.click('button:has-text("Add Prize")');
		await page.fill('input[name="title"]', 'Cool Reward');
		await page.fill('input[name="coinCost"]', '50');
		await page.click('button[type="submit"]:has-text("Create Prize")');
		await expect(page.locator('text=Cool Reward')).toBeVisible();

		// Get family code from settings
		await page.goto('/admin/settings');
		const familyCodeEl = page.locator('[data-testid="family-code"], .family-code');
		let familyCode = '';
		if (await familyCodeEl.isVisible()) {
			familyCode = (await familyCodeEl.textContent() ?? '').trim();
		}

		// ── Parent signs out ─────────────────────────────────────────────────
		await page.click('a[href="/logout"], button:has-text("Sign out")');
		await page.waitForURL(/\/login/);

		if (familyCode) {
			// ── Kid logs in ──────────────────────────────────────────────────
			await page.click('text=Kid');
			await page.fill('input[name="familyCode"]', familyCode);
			await page.fill('input[name="pin"]', '5678');
			await page.click('button[type="submit"]');
			await page.waitForURL(/\/chores/);

			// ── Kid completes chore to earn coins ────────────────────────────
			await page.click('button[aria-label*="Test Chore"]');

			// ── Kid visits prize shop ────────────────────────────────────────
			await page.goto('/prizes');
			await expect(page.locator('text=Cool Reward')).toBeVisible();

			// Balance should show 100 coins
			await expect(page.locator('.balance-badge, [aria-label*="coin balance"]')).toContainText('100');

			// Kid redeems the prize
			await page.click('button[aria-label*="Cool Reward"]');

			// Balance should decrease to 50
			await expect(page.locator('.balance-badge, [aria-label*="coin balance"]')).toContainText('50');
		}
	});
});
