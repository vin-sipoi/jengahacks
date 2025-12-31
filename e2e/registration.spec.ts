import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Disable CAPTCHA for testing via the runtime override I added to Registration.tsx
    await page.addInitScript(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).VITE_RECAPTCHA_SITE_KEY = '';
    });
    // Navigate to the homepage
    await page.goto('/');
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    // Scroll to registration section
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

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.locator('#whatsapp')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    await expect(page.getByText(/Full name is required/i)).toBeVisible();
    await expect(page.getByText(/Email address is required/i)).toBeVisible();
    await expect(page.getByText(/WhatsApp number is required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/Email Address/i);
    await emailInput.fill('invalid-email');
    await emailInput.blur();
    await expect(page.getByText(/Please enter a valid email/i)).toBeVisible();
  });

  test('should validate LinkedIn URL format', async ({ page }) => {
    const linkedInInput = page.getByLabel(/LinkedIn Profile/i);
    await linkedInInput.fill('not-a-url');
    await linkedInInput.blur();
    await expect(page.getByText(/Please enter a valid LinkedIn URL/i)).toBeVisible();
  });

  test('should require either LinkedIn or resume', async ({ page }) => {
    await page.getByLabel(/Full Name/i).fill('John Doe');
    await page.getByLabel(/Email Address/i).fill('john.doe@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');

    // Ensure LinkedIn is empty
    await page.locator('#linkedIn').fill('');

    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    await expect(page.getByText(/provide either your LinkedIn profile or upload your resume/i)).toBeVisible();
  });

  test('should show success message after successful registration', async ({ page }) => {
    // Mock successful registration
    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByLabel(/Full Name/i).fill('John Doe');
    await page.getByLabel(/Email Address/i).fill('john.doe@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/johndoe');

    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/thank-you/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /Registration Confirmed/i })).toBeVisible();
  });

  test('should reset form after successful submission', async ({ page }) => {
    await page.route('**/functions/v1/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    await page.getByLabel(/Full Name/i).fill('John Doe');
    await page.getByLabel(/Email Address/i).fill('john.doe@example.com');
    await page.locator('#whatsapp').fill('+254 712345678');
    await page.locator('#linkedIn').fill('linkedin.com/in/johndoe');

    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    await expect(page).toHaveURL(/\/thank-you/, { timeout: 15000 });

    // Reload to check reset state
    await page.goto('/#register', { waitUntil: 'networkidle' });

    await expect(page.getByLabel(/Full Name/i)).toHaveValue('');
    await expect(page.getByLabel(/Email Address/i)).toHaveValue('');
    await expect(page.locator('#whatsapp')).toHaveValue('');
  });
});
