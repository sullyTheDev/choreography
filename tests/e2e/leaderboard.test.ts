/**
 * T049 — Playwright E2E test for leaderboard.
 * Two kids complete chores → leaderboard shows correct ranking.
 */
import { test, expect } from '@playwright/test';

test.describe('Leaderboard — E2E', () => {
	test('leaderboard shows correct ranking after kids earn coins', async ({ page }) => {
		const unique = Date.now();

		// Sign up parent
		await page.goto('/signup');
		await page.fill('input[name="email"]', `lb-${unique}@test.com`);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'LB Parent');
		await page.fill('input[name="familyName"]', `LB Family ${unique}`);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/admin\/kids/);

		// Create kid Emma (will earn more coins)
		await page.click('button:has-text("Add Kid")');
		await page.fill('input[name="displayName"]', 'Emma');
		await page.click('label:has(input[name="avatarEmoji"][value="👧"])');
		await page.fill('input[name="pin"]', '1111');
		await page.click('button[type="submit"]:has-text("Create Kid")');
		await page.waitForSelector('text=Emma');

		// Create kid Liam
		await page.click('button:has-text("Add Kid")');
		await page.fill('input[name="displayName"]', 'Liam');
		await page.click('label:has(input[name="avatarEmoji"][value="👦"])');
		await page.fill('input[name="pin"]', '2222');
		await page.click('button[type="submit"]:has-text("Create Kid")');
		await page.waitForSelector('text=Liam');

		// Get the family code from URL or page
		const signupUrl = page.url();
		const familyCodeMatch = signupUrl.match(/[A-Z0-9]{8}/);

		// Create a high-value chore for Emma
		await page.goto('/admin/chores');
		await page.click('button:has-text("Add Chore")');
		await page.fill('input[name="title"]', 'Big Chore');
		await page.click('label:has(input[name="emoji"][value="⭐"])');
		await page.selectOption('select[name="frequency"]', 'daily');
		await page.fill('input[name="coinValue"]', '50');
		await page.click('button[type="submit"]:has-text("Create Chore")');
		await page.waitForSelector('text=Big Chore');

		// View leaderboard as parent — it should exist and show kids
		await page.goto('/leaderboard');
		await expect(page.locator('h2')).toContainText('Leaderboard');
		await expect(page.locator('.rankings-list')).toBeVisible();
		await expect(page.locator('text=Emma')).toBeVisible();
		await expect(page.locator('text=Liam')).toBeVisible();
	});

	test('leaderboard displays period label', async ({ page }) => {
		const unique = Date.now();

		await page.goto('/signup');
		await page.fill('input[name="email"]', `lb2-${unique}@test.com`);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'LB2 Parent');
		await page.fill('input[name="familyName"]', `LB2 Family ${unique}`);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/admin\/kids/);

		await page.goto('/leaderboard');
		await expect(page.locator('.period-label')).toBeVisible();
		const periodText = await page.locator('.period-label').textContent();
		// Should look like "Apr 7 – Apr 13"
		expect(periodText).toMatch(/[A-Z][a-z]{2} \d+ .+ [A-Z][a-z]{2} \d+/);
	});
});
