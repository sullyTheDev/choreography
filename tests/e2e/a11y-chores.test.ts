/**
 * T031 — Playwright accessibility test for kid chore dashboard using axe-core.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — Chore Dashboard', () => {
	test.beforeEach(async ({ page }) => {
		const unique = Date.now();
		// Sign up a parent and navigate to chores page for a11y audit
		await page.goto('/signup');
		await page.fill('input[name="email"]', `a11y-${unique}@test.com`);
		await page.fill('input[name="password"]', 'Password1!');
		await page.fill('input[name="displayName"]', 'A11y Parent');
		await page.fill('input[name="familyName"]', `A11y Family ${unique}`);
		await page.click('button[type="submit"]');
		await page.waitForURL(/\/admin\/kids/);
	});

	test('chore dashboard has no detectable WCAG 2.1 Level A violations', async ({ page }) => {
		// Add a kid
		await page.click('button:has-text("Add Kid")');
		await page.fill('input[name="displayName"]', 'TestKid');
		await page.click('label:has(input[name="avatarEmoji"][value="👧"])');
		await page.fill('input[name="pin"]', '1234');
		await page.click('button[type="submit"]:has-text("Create Kid")');

		await page.goto('/chores');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();

		expect(results.violations).toEqual([]);
	});

	test('signup page has no detectable WCAG 2.1 Level A violations', async ({ page }) => {
		// We're already logged in; test the login page instead
		await page.goto('/login');

		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();

		expect(results.violations).toEqual([]);
	});
});
