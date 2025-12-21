# Visual Regression Testing Guide

This document describes the visual regression testing strategy for the JengaHacks Hub application.

## Overview

Visual regression tests capture screenshots of pages and components and compare them to baseline images to detect unintended visual changes. This helps ensure UI consistency across updates and prevents visual bugs.

## Running Visual Regression Tests

### Run Tests

```bash
# Run all visual regression tests
npm run test:visual

# Or specifically
npm run test:e2e:visual
```

### Update Baselines

When you make intentional UI changes, update the baseline screenshots:

```bash
npm run test:e2e:visual:update
```

This will update all baseline images with the current screenshots.

### Run in UI Mode

```bash
npm run test:e2e:ui e2e/visual-regression.spec.ts
```

This opens an interactive UI where you can:
- View screenshot comparisons
- Accept or reject changes
- See side-by-side diffs

## Test Coverage

Visual regression tests cover:

### Homepage Sections
- Full homepage
- Hero section
- About section
- Sponsors section
- Registration section
- Footer

### Registration Form States
- Empty form
- Filled form
- Form with validation errors
- Form with file selected

### Navigation
- Desktop navbar
- Mobile menu

### Responsive Design
- Tablet viewport (768x1024)
- Mobile viewport (375x667)
- Form on mobile

### Other Pages
- Sponsorship page
- Blog page
- 404 error page

### Interactive States
- Button hover
- Input focus
- Link hover
- Form submission loading

### Additional
- Dark mode (if supported)
- Validation visual indicators

## How It Works

1. **Baseline Creation**: On first run, screenshots are saved as baseline images
2. **Comparison**: Subsequent runs compare new screenshots to baselines
3. **Diff Detection**: Differences are highlighted and reported
4. **Threshold**: Small differences (< 20% or < 1000 pixels) are ignored

## Configuration

Visual comparison settings are configured in `playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    threshold: 0.2,        // 20% pixel difference tolerance
    maxDiffPixels: 1000,   // Maximum pixels that can differ
  },
}
```

## Screenshot Storage

Screenshots are stored in:
- **Baselines**: `test-results/` directory (gitignored)
- **Diffs**: Generated when tests fail
- **Actual**: Current screenshots for comparison

## Best Practices

### 1. Update Baselines After Intentional Changes

When you intentionally change the UI:

```bash
npm run test:e2e:visual:update
```

### 2. Review Diffs Carefully

When tests fail:
- Review the diff images
- Verify changes are intentional
- Update baselines if needed

### 3. Keep Baselines in Version Control

Consider committing baseline images to track UI evolution over time.

### 4. Test Across Viewports

Visual regression tests cover multiple viewports to ensure responsive design consistency.

### 5. Test Interactive States

Tests cover hover, focus, and loading states to catch CSS issues.

## CI/CD Integration

In CI environments:

```yaml
# Example GitHub Actions
- name: Run Visual Regression Tests
  run: npm run test:visual
```

**Note**: In CI, you may want to:
- Use `--update-snapshots` only on specific branches
- Store baseline images as artifacts
- Fail builds on visual regressions

## Troubleshooting

### Tests Fail After Intentional UI Changes

Update baselines:
```bash
npm run test:e2e:visual:update
```

### Flaky Tests Due to Animations

Tests include `waitForTimeout()` calls to wait for animations. If tests are still flaky:
- Increase timeout values
- Disable animations in test environment
- Use `waitForLoadState('networkidle')`

### Screenshots Differ Slightly Between Runs

This can happen due to:
- Font rendering differences
- Anti-aliasing variations
- Timing differences

Adjust the `threshold` in `playwright.config.ts` if needed.

### Mobile Tests Fail

Ensure viewport size is set correctly:
```typescript
await page.setViewportSize({ width: 375, height: 667 });
```

## Maintenance

### Regular Tasks

1. **Review Failing Tests**: Check if failures are intentional
2. **Update Baselines**: After UI changes
3. **Clean Old Screenshots**: Remove outdated baseline images
4. **Add New Tests**: When adding new pages/components

### When to Add New Visual Tests

Add visual regression tests for:
- New pages
- New components
- Major UI redesigns
- Responsive breakpoints
- Interactive states

## Limitations

- **Dynamic Content**: Tests may need adjustment for content that changes frequently
- **External Resources**: Images/fonts from CDNs may vary
- **Browser Differences**: Screenshots may differ slightly between browsers
- **Animations**: May require additional waits or disabling animations

## Related Documentation

- [E2E Testing Guide](./e2e/README.md)
- [Performance Testing Guide](./PERFORMANCE.md)
- [Playwright Documentation](https://playwright.dev/docs/test-screenshots)

