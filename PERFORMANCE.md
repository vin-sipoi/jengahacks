# Performance Testing Guide

This document describes the performance testing strategy and benchmarks for the JengaHacks Hub application.

## Overview

Performance tests are implemented using Playwright and measure various aspects of application performance including:

- Page load times
- Network performance
- Rendering performance
- JavaScript execution
- Core Web Vitals
- Mobile performance

## Running Performance Tests

```bash
# Run all performance tests
npm run test:performance

# Or specifically
npm run test:e2e:performance

# Run in UI mode for detailed analysis
npm run test:e2e:ui e2e/performance.spec.ts

# Run with visible browser
npm run test:e2e:headed e2e/performance.spec.ts
```

## Performance Benchmarks

### Page Load Performance

- **Homepage Load Time**: < 3 seconds
- **First Contentful Paint (FCP)**: < 1 second
- **Time to Interactive (TTI)**: < 2.5 seconds
- **Registration Section Load**: < 1 second

### Network Performance

- **Total Network Requests**: < 50 external requests
- **Total Page Size**: < 5MB
- **Resource Load Time**: < 2 seconds average
- **Image Formats**: Prefer modern formats (WebP, AVIF, SVG)

### Rendering Performance

- **Cumulative Layout Shift (CLS)**: < 0.25 (Good: < 0.1)
- **Largest Contentful Paint (LCP)**: < 4 seconds (Good: < 2.5s)
- **Hero Section Render**: < 1 second

### JavaScript Performance

- **JS Execution Time**: < 500ms
- **Memory Usage**: < 10MB increase after interactions
- **Bundle Size**: < 2MB uncompressed (will be smaller gzipped)

### Form Performance

- **Form Interactivity**: < 500ms
- **Validation Response**: < 100ms
- **Submission Response**: < 2 seconds (with mocked API)

### Navigation Performance

- **Page Navigation**: < 1 second (client-side routing)
- **Smooth Scrolling**: < 1.5 seconds

### Mobile Performance

- **Mobile Load Time**: < 3 seconds
- **Touch Interaction**: < 300ms

### Core Web Vitals

The application should meet the following Core Web Vitals thresholds:

- **LCP (Largest Contentful Paint)**: < 4s (Good: < 2.5s)
- **FID (First Input Delay)**: < 300ms (Good: < 100ms)
- **CLS (Cumulative Layout Shift)**: < 0.25 (Good: < 0.1)

## Test Categories

### 1. Page Load Performance (`Page Load Performance`)

Tests measure:
- Overall page load time
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- Section-specific load times

### 2. Network Performance (`Network Performance`)

Tests measure:
- Number of network requests
- Resource loading order and timing
- Total page size
- Image format usage

### 3. Rendering Performance (`Rendering Performance`)

Tests measure:
- Cumulative Layout Shift (CLS)
- Largest Contentful Paint (LCP)
- Component-specific render times

### 4. JavaScript Performance (`JavaScript Performance`)

Tests measure:
- JavaScript execution time
- Memory usage and leaks
- Bundle sizes

### 5. Form Performance (`Form Performance`)

Tests measure:
- Form interactivity
- Validation response times
- Submission responsiveness

### 6. Navigation Performance (`Navigation Performance`)

Tests measure:
- Client-side routing speed
- Smooth scrolling performance

### 7. Mobile Performance (`Mobile Performance`)

Tests measure:
- Mobile viewport load times
- Touch interaction responsiveness

### 8. Core Web Vitals (`Core Web Vitals`)

Comprehensive test measuring all three Core Web Vitals metrics.

## Interpreting Results

### Passing Tests

If all tests pass, the application meets the performance benchmarks and should provide a good user experience.

### Failing Tests

If tests fail, consider:

1. **Page Load Issues**: Optimize images, reduce bundle size, implement code splitting
2. **Network Issues**: Minimize external requests, use CDN, enable compression
3. **Rendering Issues**: Fix layout shifts, optimize CSS, reduce render-blocking resources
4. **JavaScript Issues**: Code splitting, lazy loading, reduce bundle size
5. **Memory Issues**: Fix memory leaks, optimize component rendering

## Continuous Monitoring

Performance tests should be run:

- Before each release
- After major feature additions
- When performance regressions are suspected
- As part of CI/CD pipeline

## Performance Optimization Tips

1. **Code Splitting**: Use React.lazy() and dynamic imports
2. **Image Optimization**: Use WebP/AVIF formats, implement lazy loading
3. **Bundle Optimization**: Tree shaking, minification, compression
4. **Caching**: Implement proper cache headers
5. **CDN**: Use CDN for static assets
6. **Lazy Loading**: Load non-critical resources on demand
7. **Font Optimization**: Use font-display: swap, subset fonts

## CI/CD Integration

Performance tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Performance Tests
  run: npm run test:performance
```

## Notes

- Performance tests use mocked APIs to avoid external dependencies
- Tests may need adjustment based on actual network conditions
- Some metrics (like memory) may vary based on browser and system resources
- Performance benchmarks are based on modern hardware and fast networks

