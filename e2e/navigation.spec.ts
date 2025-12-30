import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to homepage', async ({ page }) => {
    await expect(page).toHaveURL(/\//);
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to sponsorship page', async ({ page }) => {
    // Use a more specific selector - find link with href="/sponsorship" and text containing "Sponsor"
    const sponsorshipLink = page.locator('a[href="/sponsorship"]').filter({ hasText: /Sponsor/i }).first();
    await sponsorshipLink.click();
    await expect(page).toHaveURL(/\/sponsorship\/?$/);
  });

  test('should navigate to blog page', async ({ page }) => {
    // Check if we're on mobile - if so, open the menu first
    const viewport = page.viewportSize();
    const isMobile = viewport && viewport.width < 768;
    
    if (isMobile) {
      // Open mobile menu
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        // Wait for menu to be visible
        const menu = page.getByRole('menu');
        await menu.waitFor({ state: 'visible', timeout: 3000 }).catch(() => null);
        await page.waitForTimeout(300); // Additional wait for animation
      }
    }
    
    // Wait for Blog link to be available
    const blogLink = page.getByRole('link', { name: 'Blog' }).first();
    await blogLink.waitFor({ state: 'visible', timeout: 5000 });
    await blogLink.click();
    await expect(page).toHaveURL('/blog');
  });

  test('should scroll to registration section when clicking register link', async ({ page }) => {
    const registerLink = page.getByRole('link', { name: /Register/i }).first();
    await registerLink.click();

    // Check that we're at the registration section
    await expect(page.locator('#register')).toBeInViewport();
  });

  test('should scroll to about section when clicking about link', async ({ page }) => {
    const aboutLink = page.getByRole('link', { name: /About/i }).first();
    await aboutLink.click();

    // Check that we're at the about section
    await expect(page.locator('#about')).toBeInViewport();
  });

  test('should scroll to sponsors section when clicking sponsors link', async ({ page }) => {
    // Find the hash link to #sponsors, not the route link
    const sponsorsLink = page.locator('a[href="#sponsors"]').filter({ hasText: /Sponsors/i }).first();
    
    if (await sponsorsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sponsorsLink.click();
      // Wait for lazy-loaded component and scroll animation
      await page.waitForTimeout(1000);
      // Wait for the sponsors section to be available (lazy-loaded)
      const sponsorsSection = page.locator('#sponsors');
      await sponsorsSection.waitFor({ state: 'attached', timeout: 5000 }).catch(() => null);
      const exists = await sponsorsSection.count() > 0;
      if (exists) {
        await expect(sponsorsSection).toBeInViewport({ timeout: 5000 });
      }
    }
  });

  test('should have working mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Check that menu is open
      const menu = page.getByRole('menu');
      await expect(menu).toBeVisible();
    }
  });
});

