import { test, expect } from '@playwright/test';

test.describe('CAPTCHA Integration', () => {
  // We manually test the CAPTCHA override here to verify it works

  test('should not render CAPTCHA when site key is overridden to empty', async ({ page }) => {
    // Disable CAPTCHA for testing via the runtime override
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).VITE_RECAPTCHA_SITE_KEY = '';
    });

    await page.goto('/');
    await page.locator('#register').scrollIntoViewIfNeeded();

    // CAPTCHA container should either be absent or non-visible
    const captcha = page.locator('[data-testid="recaptcha"]');
    await expect(captcha).not.toBeVisible();
  });

  test('should handle missing CAPTCHA site key gracefully', async ({ page }) => {
    // Force site key to be empty
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).VITE_RECAPTCHA_SITE_KEY = '';
    });

    await page.goto('/');
    await page.locator('#register').scrollIntoViewIfNeeded();

    // Mock successful registration
    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Fill and submit form
    await page.getByLabel(/Full Name/i).fill('Test User Ten');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    // Should succeed even without CAPTCHA if site key is overridden to empty
    await expect(page).toHaveURL(/\/thank-you/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Registration Confirmed/i })).toBeVisible();
  });

  test('should require CAPTCHA when site key is present', async ({ page }) => {
    // Note: We don't override here, so it uses the real site key from env
    // This test might be skipped if no real site key is provided in the environment
    const realSiteKey = process.env.VITE_RECAPTCHA_SITE_KEY;
    if (!realSiteKey) {
      test.skip();
      return;
    }

    await page.goto('/');
    await page.locator('#register').scrollIntoViewIfNeeded();

    const captcha = page.locator('[data-testid="recaptcha"]');
    await expect(captcha).toBeVisible();

    // Fill form
    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/test');

    // Submit
    await page.getByRole('button', { name: /Complete Registration/i }).click();

    // Should show CAPTCHA required error
    await expect(page.getByText(/Please complete the CAPTCHA/i)).toBeVisible();
  });
});
