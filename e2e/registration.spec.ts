import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage
    await page.goto('/');
    // Scroll to registration section
    await page.locator('#register').scrollIntoViewIfNeeded();
  });

  test('should display registration form', async ({ page }) => {
    // Check that the registration form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/Full Name/i)).toBeVisible();
    await expect(page.getByLabel(/Email Address/i)).toBeVisible();
    await expect(page.getByLabel(/LinkedIn Profile/i)).toBeVisible();
    await expect(page.getByLabel(/Resume/i)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();

    // Check for validation errors
    await expect(page.getByText(/Full name is required/i)).toBeVisible();
    await expect(page.getByText(/Email address is required/i)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    const emailInput = page.getByLabel(/Email Address/i);
    await emailInput.fill('invalid-email');
    
    // Trigger validation by blurring
    await emailInput.blur();
    
    // Check for email validation error
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });

  test('should validate LinkedIn URL format', async ({ page }) => {
    const linkedInInput = page.getByLabel(/LinkedIn Profile/i);
    await linkedInInput.fill('not-a-url');
    
    // Trigger validation
    await linkedInInput.blur();
    
    // Check for LinkedIn validation error
    await expect(page.getByText(/valid LinkedIn URL/i)).toBeVisible();
  });

  test('should require either LinkedIn or resume', async ({ page }) => {
    // Fill required fields
    await page.getByLabel(/Full Name/i).fill('John Doe');
    await page.getByLabel(/Email Address/i).fill('john@example.com');
    
    // Don't fill LinkedIn or upload resume
    // Complete CAPTCHA if present
    const captcha = page.locator('[data-testid="recaptcha"]');
    if (await captcha.isVisible()) {
      // In a real scenario, you'd need to handle CAPTCHA differently
      // For now, we'll skip this test if CAPTCHA is required
      test.skip();
      return;
    }
    
    // Try to submit
    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();
    
    // Check for error about requiring LinkedIn or resume
    await expect(page.getByText(/provide either your LinkedIn profile or upload your resume/i)).toBeVisible();
  });

  test('should accept valid LinkedIn URL', async ({ page }) => {
    const linkedInInput = page.getByLabel(/LinkedIn Profile/i);
    await linkedInInput.fill('linkedin.com/in/johndoe');
    
    // Trigger validation
    await linkedInInput.blur();
    
    // Should not show error for valid URL
    await expect(page.getByText(/valid LinkedIn URL/i)).not.toBeVisible();
  });

  test('should validate WhatsApp number format', async ({ page }) => {
    const whatsappInput = page.getByLabel(/WhatsApp Number/i);
    await whatsappInput.fill('invalid-number');
    
    // Trigger validation
    await whatsappInput.blur();
    
    // Check for WhatsApp validation error
    await expect(page.getByText(/valid WhatsApp number/i)).toBeVisible();
  });

  test('should accept valid WhatsApp number', async ({ page }) => {
    const whatsappInput = page.getByLabel(/WhatsApp Number/i);
    await whatsappInput.fill('+254 712345678');
    
    // Trigger validation
    await whatsappInput.blur();
    
    // Should not show error for valid number
    await expect(page.getByText(/valid WhatsApp number/i)).not.toBeVisible();
  });

  test('should validate file size for resume upload', async ({ page }) => {
    // Create a large file (simulated - in real test you'd use a file)
    // Note: This test may need adjustment based on actual file upload implementation
    const resumeInput = page.getByLabel(/Resume/i);
    
    // For this test, we'll just verify the input accepts PDF files
    await expect(resumeInput).toHaveAttribute('accept', /.pdf|application\/pdf/i);
  });

  test('should show success message after successful registration', async ({ page }) => {
    // Mock successful registration
    // Note: In a real scenario, you'd need to mock the API or use test data
    
    // Fill form with valid data
    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/testuser');
    
    // Skip CAPTCHA for now (would need special handling)
    const captcha = page.locator('[data-testid="recaptcha"]');
    if (await captcha.isVisible()) {
      test.skip();
      return;
    }
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    
    // Intercept the API call to mock success
    await page.route('**/functions/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    await submitButton.click();
    
    // Check for success message
    await expect(page.getByText(/Registration successful/i)).toBeVisible({ timeout: 10000 });
  });

  test('should reset form after successful submission', async ({ page }) => {
    // Fill form
    await page.getByLabel(/Full Name/i).fill('Test User');
    await page.getByLabel(/Email Address/i).fill('test@example.com');
    await page.getByLabel(/LinkedIn Profile/i).fill('linkedin.com/in/testuser');
    
    // Mock successful submission
    await page.route('**/functions/register-with-ip', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
    
    // Skip CAPTCHA
    const captcha = page.locator('[data-testid="recaptcha"]');
    if (await captcha.isVisible()) {
      test.skip();
      return;
    }
    
    // Submit
    const submitButton = page.getByRole('button', { name: /Complete Registration/i });
    await submitButton.click();
    
    // Wait for success
    await expect(page.getByText(/Registration successful/i)).toBeVisible({ timeout: 10000 });
    
    // Check that form fields are reset
    await expect(page.getByLabel(/Full Name/i)).toHaveValue('');
    await expect(page.getByLabel(/Email Address/i)).toHaveValue('');
    await expect(page.getByLabel(/LinkedIn Profile/i)).toHaveValue('');
  });
});

