# E2E Tests with Playwright

This directory contains end-to-end (E2E) tests using Playwright.

## Running Tests

### Run all E2E tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Debug tests
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run performance tests
```bash
npm run test:e2e:performance
# or
npm run test:performance
```

### Run visual regression tests
```bash
# Run visual regression tests
npm run test:e2e:visual
# or
npm run test:visual

# Update baseline screenshots (when UI changes are intentional)
npm run test:e2e:visual:update
```

## Test Files

- `registration.spec.ts` - Tests for the registration form and flow
- `navigation.spec.ts` - Tests for navigation and routing
- `homepage.spec.ts` - Tests for homepage content and responsiveness
- `blog.spec.ts` - Tests for the blog page
- `rate-limiting.spec.ts` - Tests for rate limiting functionality (client-side and server-side)
- `captcha.spec.ts` - Tests for CAPTCHA integration and verification flow
- `performance.spec.ts` - Performance tests for page load, rendering, and Core Web Vitals
- `visual-regression.spec.ts` - Visual regression tests for UI consistency

## Configuration

The Playwright configuration is in `playwright.config.ts` at the root of the project.

## Environment Variables

Set `PLAYWRIGHT_TEST_BASE_URL` to override the default test URL (defaults to `http://localhost:8080`).

## CI/CD

In CI environments, tests will:
- Retry failed tests 2 times
- Run with 1 worker (sequential)
- Generate HTML reports
- Capture screenshots and videos on failure

## Notes

- Tests automatically start the dev server before running
- CAPTCHA tests may need special handling or mocking
- Some tests may need adjustment based on actual API responses
- Rate limiting tests simulate production-like scenarios with localStorage and API mocking
- Rate limit tests verify both client-side (localStorage) and server-side rate limiting behavior
- CAPTCHA tests verify the complete CAPTCHA verification flow including expiration and error handling
- CAPTCHA tests may skip if CAPTCHA is not configured in the test environment
- Performance tests measure page load times, Core Web Vitals, network performance, and rendering metrics
- Performance tests help ensure the application meets performance benchmarks and provides a good user experience
- Visual regression tests capture screenshots and compare them to baselines to detect unintended UI changes
- Visual regression tests cover homepage, forms, navigation, responsive designs, and interactive states
- Use `--update-snapshots` to update baseline images when UI changes are intentional

