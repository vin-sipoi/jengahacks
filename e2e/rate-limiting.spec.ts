import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test.beforeEach(async ({ page }) => {
    // Disable CAPTCHA for testing via the runtime override
    await page.addInitScript(() => {
      (window as any).VITE_RECAPTCHA_SITE_KEY = '';
    });

    // Clear any existing rate limit data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('jengahacks_rate_limit');
    });

    // Navigate to registration section
    await page.locator('#register').scrollIntoViewIfNeeded();

    // Mock RPC calls
    await page.route('**/rest/v1/rpc/should_add_to_waitlist', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(false),
      });
    });

    await page.route('**/rest/v1/rpc/generate_access_token', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('mock-token'),
      });
    });
  });

  test('should allow multiple submissions within rate limit', async ({ page }) => {
    // Mock successful registration
    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { id: 'test-reg-id' } }),
      });
    });

    const submitForm = async (name: string, email: string) => {
      await page.getByLabel(/Full Name/i).fill(name);
      await page.getByLabel(/Email Address/i).fill(email);
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.locator('#linkedIn').fill('linkedin.com/in/test');

      await page.getByRole('button', { name: /Complete Registration/i }).click();
    };

    // First submission
    await submitForm('User One', 'user1@example.com');
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 30000 });

    // Second submission
    await page.waitForTimeout(1000);
    await page.goto('/#register', { waitUntil: 'networkidle' });
    await submitForm('User Two', 'user2@example.com');
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Third submission
    await page.waitForTimeout(1000);
    await page.goto('/#register', { waitUntil: 'networkidle' });
    await submitForm('User Three', 'user3@example.com');
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 30000 });
  });

  test('should block submission after exceeding client-side rate limit', async ({ page }) => {
    // Set up rate limit in localStorage to simulate exceeded limit
    await page.evaluate(() => {
      const rateLimitData = {
        attempts: 10,
        windowStart: Date.now() - 1000,
      };
      localStorage.setItem('jengahacks_rate_limit', JSON.stringify(rateLimitData));
    });

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    // Should show rate limit error
    await expect(page.getByText(/Too many registration attempts|rate limit/i)).toBeVisible({ timeout: 5000 });
  });

  test('should show retry after time in rate limit error', async ({ page }) => {
    await page.evaluate(() => {
      const rateLimitData = {
        attempts: 10,
        windowStart: Date.now() - (30 * 60 * 1000), // 30 mins ago
      };
      localStorage.setItem('jengahacks_rate_limit', JSON.stringify(rateLimitData));
    });

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    await page.getByRole('button', { name: /Complete Registration/i }).click();

    const errorMessage = page.getByText(/Too many|rate limit|try again/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    const errorText = await errorMessage.textContent();
    expect(errorText).toMatch(/\d+\s*(minute|second|hour)/i);
  });

  test('should reset rate limit after time window expires', async ({ page }) => {
    await page.evaluate(() => {
      const rateLimitData = {
        attempts: 10,
        windowStart: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
      };
      localStorage.setItem('jengahacks_rate_limit', JSON.stringify(rateLimitData));
    });

    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    await page.getByRole('button', { name: /Complete Registration/i }).click();
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 15000 });
  });

  test('should handle server-side rate limit errors', async ({ page }) => {
    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      });
    });

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    await page.getByRole('button', { name: /Complete Registration/i }).click();
    await expect(page.getByText(/Rate limit|too many|try again/i)).toBeVisible({ timeout: 10000 });
  });

  test('should handle duplicate email error', async ({ page }) => {
    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'This email is already registered',
          code: 'DUPLICATE_EMAIL',
        }),
      });
    });

    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('existing@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    await page.getByRole('button', { name: /Complete Registration/i }).click();
    await expect(page.getByText(/already registered|duplicate/i)).toBeVisible({ timeout: 10000 });
  });
});
