/**
 * T042 — Playwright accessibility test for prize shop page using axe-core.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — Prize Shop', () => {
	test.beforeEach(async ({ page }) => {
		const unique = Date.now();
		await page.goto('/signup');
		await page.fill('input[name="email"]', `a11y-prizes-${unique}@test.com`);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'A11y Parent');
		await page.fill('input[name="familyName"]', `A11y Prize Family ${unique}`);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/admin\/kids/);
	});

	test('prize shop page has no detectable WCAG 2.1 Level A violations', async ({ page }) => {
		await page.goto('/prizes');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('admin prizes page has no detectable WCAG 2.1 Level A violations', async ({ page }) => {
		await page.goto('/admin/prizes');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();

		expect(results.violations).toEqual([]);
	});
});
