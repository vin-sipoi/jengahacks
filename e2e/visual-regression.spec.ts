import { test, expect, Page, TestInfo } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  // Helper function to wait for fonts and content to be stable
  const waitForStableContent = async (page: Page) => {
    await page.waitForLoadState('networkidle');
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000); // Additional wait for animations
  };

  // Helper function to check if we're on a mobile browser
  const isMobileBrowser = (testInfo: TestInfo): boolean => {
    const projectName = testInfo.project?.name || '';
    return projectName.includes('Mobile');
  };

  test.describe('Homepage', () => {
    test('homepage should match visual baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers - use responsive design tests instead
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Disable CAPTCHA for testing
      await page.addInitScript(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).VITE_RECAPTCHA_SITE_KEY = '';
      });
      await page.goto('/');
      await waitForStableContent(page);

      // Take full page screenshot
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('homepage hero section should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);

      const heroSection = page.locator('main section').first();
      await expect(heroSection).toHaveScreenshot('homepage-hero.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage about section should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000); // Wait for animations

      const aboutSection = page.locator('#about');
      await expect(aboutSection).toHaveScreenshot('homepage-about.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage sponsors section should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#sponsors').scrollIntoViewIfNeeded();
      await page.waitForTimeout(3000); // Wait for lazy-loaded content

      const sponsorsSection = page.locator('#sponsors');
      await expect(sponsorsSection).toHaveScreenshot('homepage-sponsors.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage registration section should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000); // Wait for animations

      const registrationSection = page.locator('#register');
      await expect(registrationSection).toHaveScreenshot('homepage-registration.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage footer should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      const footer = page.locator('footer');
      await expect(footer).toHaveScreenshot('homepage-footer.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });
  });

  test.describe('Registration Form', () => {
    test('registration form should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-empty.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form with filled fields should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Fill form fields
      await page.getByLabel(/Full Name/i).fill('John Doe');
      await page.getByLabel(/Email Address/i).fill('john@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/johndoe');
      await page.waitForTimeout(500); // Wait for form state updates

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-filled.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form with validation errors should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Trigger validation errors
      await page.getByLabel(/Full Name/i).fill('A');
      await page.getByLabel(/Full Name/i).blur();
      await page.getByLabel(/Email Address/i).fill('invalid-email');
      await page.getByLabel(/Email Address/i).blur();
      await page.waitForTimeout(500); // Wait for validation messages

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-errors.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form with file selected should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Fill form
      await page.getByLabel(/Full Name/i).fill('Test User');
      await page.getByLabel(/Email Address/i).fill('test@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/test');
      await page.waitForTimeout(500); // Wait for form state updates

      // Note: File upload visual testing is limited, but we can test the form state
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-with-linkedin.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });
  });

  test.describe('Navigation', () => {
    test('navbar should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers - use mobile menu test instead
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);

      const navbar = page.getByRole('navigation', { name: /Main navigation/i });
      await expect(navbar).toHaveScreenshot('navbar-desktop.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('mobile menu should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await waitForStableContent(page);

      const navbar = page.getByRole('navigation', { name: /Main navigation/i });

      // Check if mobile menu button exists
      const menuButton = page.locator('button[aria-label*="Toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first();
      if (await menuButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await menuButton.click();
        await page.locator('#mobile-menu').waitFor({ state: 'visible', timeout: 3000 });
        await page.waitForTimeout(500); // Wait for animation
      }

      await expect(navbar).toHaveScreenshot('navbar-mobile.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });
  });

  test.describe('Responsive Design', () => {
    test('homepage should match baseline on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('homepage-tablet.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('homepage should match baseline on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('homepage hero section should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);

      const heroSection = page.locator('main section').first();
      await expect(heroSection).toHaveScreenshot('homepage-hero-mobile.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage about section should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);

      const aboutSection = page.locator('#about');
      await expect(aboutSection).toHaveScreenshot('homepage-about-mobile.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage sponsors section should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#sponsors').scrollIntoViewIfNeeded();
      await page.waitForTimeout(3000);

      const sponsorsSection = page.locator('#sponsors');
      await expect(sponsorsSection).toHaveScreenshot('homepage-sponsors-mobile.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage registration section should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const registrationSection = page.locator('#register');
      await expect(registrationSection).toHaveScreenshot('homepage-registration-mobile.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('homepage footer should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);

      const footer = page.locator('footer');
      await expect(footer).toHaveScreenshot('homepage-footer-mobile.png', { maxDiffPixelRatio: 0.05, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-mobile.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form with filled fields should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Fill form fields
      await page.getByLabel(/Full Name/i).fill('John Doe');
      await page.getByLabel(/Email Address/i).fill('john@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/johndoe');
      await page.waitForTimeout(500);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-filled-mobile.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form with validation errors should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Trigger validation errors
      await page.getByLabel(/Full Name/i).fill('A');
      await page.getByLabel(/Full Name/i).blur();
      await page.getByLabel(/Email Address/i).fill('invalid-email');
      await page.getByLabel(/Email Address/i).blur();
      await page.waitForTimeout(500);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-errors-mobile.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('registration form with file selected should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Fill form
      await page.getByLabel(/Full Name/i).fill('Test User');
      await page.getByLabel(/Email Address/i).fill('test@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/test');
      await page.waitForTimeout(500);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-with-linkedin-mobile.png', { maxDiffPixelRatio: 0.15, animations: 'disabled', scale: 'css', timeout: 30000 });
    });

    test('sponsorship page should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/sponsorship');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('sponsorship-page-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('blog page should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/blog');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('blog-page-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('404 page should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/non-existent-page');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('404-page-mobile.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('input focus state should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const nameInput = page.getByLabel(/Full Name/i);
      await nameInput.focus();
      await page.waitForTimeout(300);

      await expect(nameInput).toHaveScreenshot('input-focus-mobile.png', { timeout: 30000 });
    });

    test('form validation visual indicators should match baseline on mobile', async ({ page }, testInfo) => {
      // Only run on mobile browsers
      if (!isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Fill valid data
      await page.getByLabel(/Full Name/i).fill('John Doe');
      await page.getByLabel(/Email Address/i).fill('john@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/johndoe');

      // Wait for validation indicators
      await page.waitForTimeout(1000);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('form-validation-indicators-mobile.png', { maxDiffPixelRatio: 0.20, animations: 'disabled', scale: 'css', timeout: 30000 });
    });
  });

  test.describe('Other Pages', () => {
    test('sponsorship page should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/sponsorship');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('sponsorship-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('blog page should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/blog');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('blog-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });

    test('404 page should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/non-existent-page');
      await waitForStableContent(page);

      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.05,
        animations: 'disabled',
        scale: 'css',
        timeout: 30000,
      });
    });
  });

  test.describe('Interactive States', () => {
    test('button hover state should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers (hover doesn't work on mobile)
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const submitButton = page.getByRole('button', { name: /Complete Registration/i });
      await submitButton.hover();
      await page.waitForTimeout(300);

      await expect(submitButton).toHaveScreenshot('button-hover.png', { timeout: 30000 });
    });

    test('input focus state should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      const nameInput = page.getByLabel(/Full Name/i);
      await nameInput.focus();
      await page.waitForTimeout(300);

      await expect(nameInput).toHaveScreenshot('input-focus.png', { timeout: 30000 });
    });

    test('link hover state should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers (hover doesn't work on mobile)
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);

      const registerLink = page.getByRole('link', { name: /Register/i }).first();
      await registerLink.hover();
      await page.waitForTimeout(300);

      await expect(registerLink).toHaveScreenshot('link-hover.png', { timeout: 30000 });
    });
  });

  test.describe('Loading States', () => {
    test('form submission loading state should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Mock slow API response
      await page.route('**/functions/register-with-ip', async route => {
        await page.waitForTimeout(1000); // Simulate delay
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      });

      // Fill form
      await page.getByLabel(/Full Name/i).fill('Test User');
      await page.getByLabel(/Email Address/i).fill('test@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/test');

      // Skip CAPTCHA if visible
      const captcha = page.locator('[data-testid="recaptcha"]');
      if (await captcha.isVisible().catch(() => false)) {
        test.skip();
        return;
      }

      const submitButton = page.getByRole('button', { name: /Complete Registration/i });
      await submitButton.click();

      // Wait for loading state
      await page.waitForTimeout(500);

      // Capture loading state
      await expect(submitButton).toHaveScreenshot('button-loading.png', { timeout: 30000 });
    });
  });

  test.describe('Dark Mode Support', () => {
    test('homepage should match baseline in dark mode (if supported)', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      // Set dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });

      await page.goto('/');
      await waitForStableContent(page);

      // Check if dark mode is applied
      const bodyClasses = await page.locator('body').getAttribute('class');
      const hasDarkMode = bodyClasses?.includes('dark') ||
        (await page.evaluate(() =>
          window.getComputedStyle(document.body).colorScheme === 'dark'
        ));

      if (hasDarkMode) {
        await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
          fullPage: true,
          maxDiffPixelRatio: 0.05,
          animations: 'disabled',
          scale: 'css',
          timeout: 30000,
        });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Accessibility Visual Indicators', () => {
    test('form validation visual indicators should match baseline', async ({ page }, testInfo) => {
      // Skip on mobile browsers
      if (isMobileBrowser(testInfo)) {
        test.skip();
        return;
      }
      // Set desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/');
      await waitForStableContent(page);
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(2000);

      // Fill valid data
      await page.getByLabel(/Full Name/i).fill('John Doe');
      await page.getByLabel(/Email Address/i).fill('john@example.com');
      await page.locator('#whatsapp').fill('+254 712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/johndoe');

      // Wait for validation indicators
      await page.waitForTimeout(1000);

      const form = page.locator('form');
      await expect(form).toHaveScreenshot('form-validation-indicators.png', { maxDiffPixelRatio: 0.20, animations: 'disabled', scale: 'css', timeout: 30000 });
    });
  });
});

