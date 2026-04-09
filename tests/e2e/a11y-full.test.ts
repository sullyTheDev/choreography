/**
 * T060 — Full Playwright accessibility audit across all pages.
 * WCAG 2.1 Level A using axe-core.
 */
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function signUpParent(page: import('@playwright/test').Page, unique: string | number) {
	await page.goto('/signup');
	await page.fill('input[name="email"]', `a11y-full-${unique}@test.com`);
	await page.fill('input[name="password"]', 'Password1!');
	await page.fill('input[name="displayName"]', 'A11y Full Parent');
	await page.fill('input[name="familyName"]', `A11y Full Family ${unique}`);
	await page.click('button[type="submit"]');
	await page.waitForURL(/\/admin\/kids/);
}

test.describe('Full WCAG 2.1 Level A Accessibility Audit', () => {
	let uniqueId: number;

	test.beforeEach(async ({ page }) => {
		uniqueId = Date.now();
		await signUpParent(page, uniqueId);
	});

	test('signup page has no violations', async ({ page }) => {
		await page.goto('/signup');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('login page has no violations', async ({ page }) => {
		await page.goto('/login');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('admin/kids page has no violations', async ({ page }) => {
		await page.goto('/admin/kids');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('admin/chores page has no violations', async ({ page }) => {
		await page.goto('/admin/chores');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('admin/prizes page has no violations', async ({ page }) => {
		await page.goto('/admin/prizes');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('admin/activity page has no violations', async ({ page }) => {
		await page.goto('/admin/activity');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('admin/settings page has no violations', async ({ page }) => {
		await page.goto('/admin/settings');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('chores page has no violations', async ({ page }) => {
		await page.goto('/chores');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('prizes page has no violations', async ({ page }) => {
		await page.goto('/prizes');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});

	test('leaderboard page has no violations', async ({ page }) => {
		await page.goto('/leaderboard');
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag21a'])
			.analyze();
		expect(results.violations).toEqual([]);
	});
});
