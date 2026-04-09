/**
 * T050 — Playwright accessibility test for leaderboard page using axe-core.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — Leaderboard', () => {
	test.beforeEach(async ({ page }) => {
		const unique = Date.now();
		await page.goto('/signup');
		await page.fill('input[name="email"]', `a11y-lb-${unique}@test.com`);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'A11y LB Parent');
		await page.fill('input[name="familyName"]', `A11y LB Family ${unique}`);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/admin\/kids/);
	});

	test('leaderboard page has no detectable WCAG 2.1 Level A violations', async ({ page }) => {
		await page.goto('/leaderboard');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();

		expect(results.violations).toEqual([]);
	});
});
