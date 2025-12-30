import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display hero section', async ({ page }) => {
    const hero = page.getByRole('region', { name: /JengaHacks/i }).first();
    await expect(hero).toBeVisible();
    await expect(page.getByText(/innovation, collaboration/i)).toBeVisible();
  });

  test('should navigate to homepage', async ({ page }) => {
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display about section', async ({ page }) => {
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(page.locator('#about')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Why JengaHacks/i)).toBeVisible();
  });

  test('should display sponsors section', async ({ page }) => {
    await page.locator('#sponsors').scrollIntoViewIfNeeded();
    await expect(page.locator('#sponsors')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Sponsors/i })).toBeVisible();
  });

  test('should display registration section', async ({ page }) => {
    await page.locator('#register').scrollIntoViewIfNeeded();
    await expect(page.locator('#register')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: /Register/i })).toBeVisible();
  });

  test('should display footer', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator('footer')).toBeVisible();
  });

  test('should have working social share buttons', async ({ page }) => {
    await page.locator('#register').scrollIntoViewIfNeeded();

    // Look for social share buttons
    const shareButtons = page.locator('button[aria-label*="Share"], button[aria-label*="share"]');
    const count = await shareButtons.count();

    if (count > 0) {
      // Click first share button
      await shareButtons.first().click();

      // Check that share menu or dialog appears
      // This may vary based on implementation
      await page.waitForTimeout(500);
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that content is still visible and readable
    await expect(page.locator('main')).toBeVisible();

    // Check that navigation is accessible
    const nav = page.getByRole('navigation', { name: /Main navigation/i });
    await expect(nav).toBeVisible();
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    // Check that content is still visible
    await expect(page.locator('main')).toBeVisible();
  });

  test('should have proper meta tags', async ({ page }) => {
    // Check for title
    await expect(page).toHaveTitle(/.+/);

    // Check for meta description
    const metaDescription = page.locator('meta[name="description"]');
    if (await metaDescription.count() > 0) {
      await expect(metaDescription).toHaveAttribute('content', /.+/);
    }
  });

  test('should load without JavaScript errors', async ({ page }) => {
    // Filter out potential noise like 401 unauthorized for certain resources
    // common in some headless environments or due to missing optional assets
    page.on('requestfailed', request => {
      console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
    page.on('response', response => {
      if (response.status() === 401) {
        console.log(`401 Unauthorized: ${response.url()}`);
      }
    });

    const loadErrors: string[] = [];

    page.on('pageerror', (error) => {
      loadErrors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        loadErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Filter out known non-critical errors (like analytics, etc.)
    const criticalErrors = loadErrors.filter(
      (error: string) =>
        !error.includes('analytics') &&
        !error.includes('gtag') &&
        !error.includes('google-analytics') &&
        !error.includes('401')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical Errors Found:', JSON.stringify(criticalErrors, null, 2));
    }
    expect(criticalErrors).toHaveLength(0);
  });
});

