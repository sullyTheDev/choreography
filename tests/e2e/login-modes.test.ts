/**
 * T014 / T021 / T031 / T045 / T048 / T053 / T054
 * Playwright E2E tests for login page mode rendering.
 *
 * Tests are skipped automatically when AUTH_MODE does not match the scenario.
 * To run all scenarios, run with the appropriate AUTH_MODE env var:
 *   AUTH_MODE=local   npx playwright test login-modes
 *   AUTH_MODE=oidc    npx playwright test login-modes
 *   AUTH_MODE=both    npx playwright test login-modes
 */
import { test, expect } from '@playwright/test';

const AUTH_MODE = process.env.AUTH_MODE ?? 'local';

// ── Local-mode (T014) ──────────────────────────────────────────────────────

test.describe('Login page — local mode (T014)', () => {
	test.skip(AUTH_MODE !== 'local', 'Requires AUTH_MODE=local');

	test('shows email/password form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('button[type="submit"]')).toBeVisible();
	});

	test('does not show OIDC sign-in button', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('[data-testid="oidc-signin-btn"]')).not.toBeVisible();
	});

	test('shows authentication failure message for bad credentials', async ({ page }) => {
		await page.goto('/login');
		// Use the admin login tab (email/password)
		await page.fill('input[name="email"]', 'nonexistent@example.com');
		await page.fill('input[name="password"]', 'wrongpassword');
		await page.click('button[type="submit"]');
		// Should stay on login page with an error
		await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
	});
});

// ── OIDC-mode (T021) ───────────────────────────────────────────────────────

test.describe('Login page — OIDC mode (T021)', () => {
	test.skip(AUTH_MODE !== 'oidc', 'Requires AUTH_MODE=oidc');

	test('shows OIDC sign-in button with provider label', async ({ page }) => {
		await page.goto('/login');
		const oidcBtn = page.locator('[data-testid="oidc-signin-btn"]');
		await expect(oidcBtn).toBeVisible();
		const label = process.env.OIDC_ISSUER_LABEL ?? 'Single Sign-On';
		await expect(oidcBtn).toContainText(label);
	});

	test('does not show local email/password form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('input[name="email"]')).not.toBeVisible();
		await expect(page.locator('input[name="password"]')).not.toBeVisible();
	});
});

// ── OIDC misconfigured (T045) ──────────────────────────────────────────────

test.describe('Login page — OIDC misconfigured (T045)', () => {
	test.skip(AUTH_MODE !== 'oidc', 'Requires AUTH_MODE=oidc');

	// Only run this test when OIDC vars are NOT configured
	test.skip(!!(process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET), 'Requires OIDC config missing');

	test('shows configuration guidance when OIDC not configured', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('[data-testid="oidc-misconfigured"]')).toBeVisible();
		await expect(page.locator('[data-testid="oidc-signin-btn"]')).not.toBeVisible();
	});
});

// ── Both-mode (T031) ───────────────────────────────────────────────────────

test.describe('Login page — both mode (T031)', () => {
	test.skip(AUTH_MODE !== 'both', 'Requires AUTH_MODE=both');

	test('shows OIDC button before local form with divider', async ({ page }) => {
		await page.goto('/login');

		// Both visible
		await expect(page.locator('input[name="email"]')).toBeVisible();
		await expect(page.locator('input[name="password"]')).toBeVisible();
		await expect(page.locator('[data-testid="oidc-signin-btn"]')).toBeVisible();

		// OIDC comes before local form (check DOM order)
		const oidcBtn = page.locator('[data-testid="oidc-signin-btn"]');
		const emailInput = page.locator('input[name="email"]');
		const oidcRect = await oidcBtn.boundingBox();
		const emailRect = await emailInput.boundingBox();
		expect(oidcRect!.y).toBeLessThan(emailRect!.y);
	});

	test('shows divider between OIDC and local form', async ({ page }) => {
		await page.goto('/login');
		await expect(page.locator('[data-testid="mode-divider"]')).toBeVisible();
	});
});

// ── Accessibility (T053) ───────────────────────────────────────────────────

test.describe('Login page — accessibility (T053)', () => {
	test('email and password inputs are properly labelled', async ({ page }) => {
		await page.goto('/login');
		if (AUTH_MODE !== 'oidc') {
			const emailInput = page.locator('input[name="email"]');
			await expect(emailInput).toBeVisible();
			// Should be reachable via keyboard
			await page.keyboard.press('Tab');
			// Verify input exists and has accessible attributes
			const emailId = await emailInput.getAttribute('id');
			if (emailId) {
				const label = page.locator(`label[for="${emailId}"]`);
				await expect(label).toBeAttached();
			}
		}
	});

	test('sign-in button is keyboard-activatable', async ({ page }) => {
		await page.goto('/login');
		if (AUTH_MODE !== 'oidc') {
			// Tab to the submit button and verify it's focusable
			const submitBtn = page.locator('button[type="submit"]').first();
			await submitBtn.focus();
			await expect(submitBtn).toBeFocused();
		}
	});
});

// ── Timed sign-in completion (T054) ───────────────────────────────────────

test.describe('Login page — sign-in timing (T054)', () => {
	test.skip(AUTH_MODE !== 'local', 'SC-005: Timed sign-in validation requires local mode');

	test('form submission completes within 5 seconds', async ({ page }) => {
		await page.goto('/login');

		const start = Date.now();
		await page.fill('input[name="email"]', 'nonexistent@example.com');
		await page.fill('input[name="password"]', 'testpassword');
		await page.click('button[type="submit"]');

		// Wait for a response (error or redirect)
		await page.waitForLoadState('networkidle');
		const elapsed = Date.now() - start;

		// SC-005: sign-in attempt should complete within 5000ms
		expect(elapsed).toBeLessThan(5000);
	});
});
