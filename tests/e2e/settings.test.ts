/**
 * T058 — Playwright E2E test for settings page.
 * Covers: update family name, delete family → redirect to login.
 */
import { test, expect } from '@playwright/test';

async function signUpParent(page: import('@playwright/test').Page, unique: number) {
	await page.goto('/signup');
	await page.fill('input[name="email"]', `settings-${unique}@test.com`);
	await page.fill('input[name="password"]', 'Password1!');
	await page.fill('input[name="displayName"]', 'Settings Parent');
	await page.fill('input[name="familyName"]', `Settings Family ${unique}`);
	await page.click('button[type="submit"]');
	await page.waitForURL(/\/admin\/kids/);
}

test.describe('Settings — E2E', () => {
	test('can update family name', async ({ page }) => {
		const unique = Date.now();
		await signUpParent(page, unique);

		await page.goto('/admin/settings');
		await expect(page.locator('h2')).toContainText('Family Settings');

		await page.fill('input[name="familyName"]', 'Renamed Family');
		await page.click('button[type="submit"]:has-text("Save Changes")');

		await expect(page.locator('[role="status"]')).toContainText('saved successfully');
	});

	test('delete family redirects to login', async ({ page }) => {
		const unique = Date.now() + 1;
		await signUpParent(page, unique);

		await page.goto('/admin/settings');
		await page.fill('input[name="confirm"]', 'DELETE');
		await page.click('button[type="submit"]:has-text("Delete Family")');

		await page.waitForURL(/\/login/);
		await expect(page.locator('text=login')).toBeVisible({ timeout: 5000 });
	});

	test('delete family requires correct confirmation word', async ({ page }) => {
		const unique = Date.now() + 2;
		await signUpParent(page, unique);

		await page.goto('/admin/settings');
		await page.fill('input[name="confirm"]', 'delete'); // wrong case
		await page.click('button[type="submit"]:has-text("Delete Family")');

		// Should stay on settings page with error
		await expect(page.locator('[role="alert"]')).toBeVisible();
		await expect(page.url()).toContain('/admin/settings');
	});
});
