import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.describe('Homepage', () => {
    test('homepage should match visual baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Take full page screenshot
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
      });
    });

    test('homepage hero section should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const heroSection = page.locator('section').first();
      await expect(heroSection).toHaveScreenshot('homepage-hero.png');
    });

    test('homepage about section should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#about').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // Wait for animations
      
      const aboutSection = page.locator('#about');
      await expect(aboutSection).toHaveScreenshot('homepage-about.png');
    });

    test('homepage sponsors section should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#sponsors').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const sponsorsSection = page.locator('#sponsors');
      await expect(sponsorsSection).toHaveScreenshot('homepage-sponsors.png');
    });

    test('homepage registration section should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const registrationSection = page.locator('#register');
      await expect(registrationSection).toHaveScreenshot('homepage-registration.png');
    });

    test('homepage footer should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      
      const footer = page.locator('footer');
      await expect(footer).toHaveScreenshot('homepage-footer.png');
    });
  });

  test.describe('Registration Form', () => {
    test('registration form should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-empty.png');
    });

    test('registration form with filled fields should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Fill form fields
      await page.getByLabel(/Full Name/i).fill('John Doe');
      await page.getByLabel(/Email Address/i).fill('john@example.com');
      await page.getByLabel(/WhatsApp Number/i).fill('+254712345678');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/johndoe');
      
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-filled.png');
    });

    test('registration form with validation errors should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Trigger validation errors
      await page.getByLabel(/Full Name/i).fill('A');
      await page.getByLabel(/Full Name/i).blur();
      await page.getByLabel(/Email Address/i).fill('invalid-email');
      await page.getByLabel(/Email Address/i).blur();
      
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-errors.png');
    });

    test('registration form with file selected should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Fill form
      await page.getByLabel(/Full Name/i).fill('Test User');
      await page.getByLabel(/Email Address/i).fill('test@example.com');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/test');
      
      // Note: File upload visual testing is limited, but we can test the form state
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-with-linkedin.png');
    });
  });

  test.describe('Navigation', () => {
    test('navbar should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const navbar = page.locator('nav');
      await expect(navbar).toHaveScreenshot('navbar-desktop.png');
    });

    test('mobile menu should match baseline', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const navbar = page.locator('nav');
      
      // Check if mobile menu button exists
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]').first();
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
      }
      
      await expect(navbar).toHaveScreenshot('navbar-mobile.png');
    });
  });

  test.describe('Responsive Design', () => {
    test('homepage should match baseline on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-tablet.png', {
        fullPage: true,
      });
    });

    test('homepage should match baseline on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('homepage-mobile.png', {
        fullPage: true,
      });
    });

    test('registration form should match baseline on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('registration-form-mobile.png');
    });
  });

  test.describe('Other Pages', () => {
    test('sponsorship page should match baseline', async ({ page }) => {
      await page.goto('/sponsorship');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('sponsorship-page.png', {
        fullPage: true,
      });
    });

    test('blog page should match baseline', async ({ page }) => {
      await page.goto('/blog');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('blog-page.png', {
        fullPage: true,
      });
    });

    test('404 page should match baseline', async ({ page }) => {
      await page.goto('/non-existent-page');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('404-page.png', {
        fullPage: true,
      });
    });
  });

  test.describe('Interactive States', () => {
    test('button hover state should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const submitButton = page.getByRole('button', { name: /Complete Registration/i });
      await submitButton.hover();
      await page.waitForTimeout(200);
      
      await expect(submitButton).toHaveScreenshot('button-hover.png');
    });

    test('input focus state should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const nameInput = page.getByLabel(/Full Name/i);
      await nameInput.focus();
      await page.waitForTimeout(200);
      
      await expect(nameInput).toHaveScreenshot('input-focus.png');
    });

    test('link hover state should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const registerLink = page.getByRole('link', { name: /Register/i }).first();
      await registerLink.hover();
      await page.waitForTimeout(200);
      
      await expect(registerLink).toHaveScreenshot('link-hover.png');
    });
  });

  test.describe('Loading States', () => {
    test('form submission loading state should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
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
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/test');
      
      // Skip CAPTCHA
      const captcha = page.locator('[data-testid="recaptcha"]');
      if (await captcha.isVisible().catch(() => false)) {
        await page.locator('[data-testid="recaptcha-trigger"]').click();
        await page.waitForTimeout(500);
      }
      
      const submitButton = page.getByRole('button', { name: /Complete Registration/i });
      await submitButton.click();
      
      // Wait for loading state
      await page.waitForTimeout(300);
      
      // Capture loading state
      await expect(submitButton).toHaveScreenshot('button-loading.png');
    });
  });

  test.describe('Dark Mode Support', () => {
    test('homepage should match baseline in dark mode (if supported)', async ({ page }) => {
      // Set dark mode preference
      await page.emulateMedia({ colorScheme: 'dark' });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Check if dark mode is applied
      const bodyClasses = await page.locator('body').getAttribute('class');
      const hasDarkMode = bodyClasses?.includes('dark') || 
                         (await page.evaluate(() => 
                           window.getComputedStyle(document.body).colorScheme === 'dark'
                         ));
      
      if (hasDarkMode) {
        await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
          fullPage: true,
        });
      } else {
        test.skip();
      }
    });
  });

  test.describe('Accessibility Visual Indicators', () => {
    test('form validation visual indicators should match baseline', async ({ page }) => {
      await page.goto('/');
      await page.locator('#register').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      // Fill valid data
      await page.getByLabel(/Full Name/i).fill('John Doe');
      await page.getByLabel(/Email Address/i).fill('john@example.com');
      await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/johndoe');
      
      // Wait for validation indicators
      await page.waitForTimeout(500);
      
      const form = page.locator('form');
      await expect(form).toHaveScreenshot('form-validation-indicators.png');
    });
  });
});

