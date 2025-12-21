# Accessibility Guide

This document describes the accessibility features and improvements implemented throughout the JengaHacks Hub application.

## Overview

The application follows **WCAG 2.1 Level AA** accessibility standards and includes comprehensive ARIA labels, screen reader support, keyboard navigation, and semantic HTML to ensure an inclusive experience for all users.

## Features

### 1. ARIA Labels and Attributes

**Purpose**: Provide descriptive labels for screen readers and assistive technologies.

**Implementation**:
- `aria-label`: Descriptive labels for interactive elements
- `aria-labelledby`: Links labels to elements via ID references
- `aria-describedby`: Links descriptions to form fields
- `aria-invalid`: Indicates form field validation state
- `aria-required`: Marks required form fields
- `aria-live`: Announces dynamic content changes
- `aria-atomic`: Controls what gets announced in live regions
- `aria-busy`: Indicates loading states
- `aria-expanded`: Indicates menu/dropdown state
- `aria-controls`: Links controls to controlled elements

**Examples**:
```tsx
<button aria-label="Close menu" aria-expanded={isOpen}>
  <MenuIcon />
</button>

<input
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : undefined}
  aria-required="true"
/>
```

### 2. Semantic HTML

**Purpose**: Use proper HTML elements to convey meaning and structure.

**Implementation**:
- `<header>`: Page headers and navigation
- `<nav>`: Navigation sections
- `<main>`: Main content area
- `<section>`: Content sections with `aria-labelledby`
- `<article>`: Standalone content pieces
- `<aside>`: Supplementary content
- `<footer>`: Page footer with `role="contentinfo"`
- `<time>`: Dates and times with `dateTime` attribute
- Proper heading hierarchy (h1 → h2 → h3)

**Examples**:
```tsx
<header role="banner">
  <nav aria-label="Main navigation">...</nav>
</header>

<main id="main-content" tabIndex={-1}>
  <section aria-labelledby="about-heading">
    <h2 id="about-heading">About</h2>
  </section>
</main>
```

### 3. Screen Reader Support

**Live Regions** (`LiveRegion` component):
- Announces dynamic content changes (form submissions, errors, success messages)
- Uses `aria-live="polite"` for non-critical updates
- Uses `aria-live="assertive"` for critical errors
- Automatically clears and re-announces messages

**Error Messages**:
- All form errors include `role="alert"` and `aria-live="polite"`
- Error messages are linked to form fields via `aria-describedby`
- Success indicators are announced via `aria-label` on icons

**Loading States**:
- Loading spinners include `aria-label` descriptions
- Loading containers use `role="status"` and `aria-live="polite"`

### 4. Form Accessibility

**Form Fields**:
- All inputs have associated `<label>` elements
- Required fields marked with `aria-required="true"`
- Visual asterisks include `sr-only` text for screen readers
- Validation errors linked via `aria-describedby`
- Success indicators announced via `aria-label`

**Example**:
```tsx
<Label htmlFor="email">
  Email <span className="sr-only">required</span>
  <span aria-hidden="true">*</span>
</Label>
<Input
  id="email"
  aria-invalid={!!errors.email}
  aria-describedby={errors.email ? "email-error" : "email-success"}
  aria-required="true"
/>
{errors.email && (
  <p id="email-error" role="alert" aria-live="polite">
    {errors.email}
  </p>
)}
```

### 5. Keyboard Navigation

**Features**:
- Full keyboard navigation support (see [KEYBOARD_NAVIGATION.md](./KEYBOARD_NAVIGATION.md))
- Focus trap for modals and menus
- Arrow key navigation in lists and menus
- Skip links for main content
- Logical tab order
- Enhanced focus indicators

### 6. Icon Accessibility

**Decorative Icons**:
- Use `aria-hidden="true"` to hide from screen readers
- Icons that convey meaning include `aria-label`

**Examples**:
```tsx
{/* Decorative icon */}
<Calendar className="w-4 h-4" aria-hidden="true" />

{/* Meaningful icon */}
<button aria-label="Download CSV">
  <Download className="w-4 h-4" aria-hidden="true" />
</button>
```

### 7. Image Accessibility

**Decorative Images**:
- Use empty `alt=""` and `aria-hidden="true"`

**Informative Images**:
- Provide descriptive `alt` text
- Include context in alt text

**Examples**:
```tsx
{/* Decorative logo */}
<img src={logo} alt="" aria-hidden="true" />

{/* Informative image */}
<img src={sponsorLogo} alt="Silicon Savannah Solutions - Platinum sponsor" />
```

### 8. Link Accessibility

**External Links**:
- Include "Opens in new tab" in `aria-label`
- Use `rel="noopener noreferrer"` for security

**Navigation Links**:
- Include context in `aria-label` (e.g., "Navigate to registration form")
- Use descriptive link text

**Examples**:
```tsx
<a
  href="#register"
  aria-label="Navigate to registration form"
>
  Register Now
</a>

<a
  href="https://example.com"
  target="_blank"
  rel="noopener noreferrer"
  aria-label="Visit example.com - Opens in new tab"
>
  Example
</a>
```

### 9. List Accessibility

**Lists**:
- Use proper `<ul>`, `<ol>`, and `<li>` elements
- Include `role="list"` and `aria-label` for custom lists
- Use `role="listitem"` for list items in custom structures

**Examples**:
```tsx
<ul role="list" aria-label="Event features">
  {features.map((feature) => (
    <li key={feature.id} role="listitem">
      {feature.title}
    </li>
  ))}
</ul>
```

### 10. Button Accessibility

**Buttons**:
- Include descriptive `aria-label` for icon-only buttons
- Use `aria-busy` for loading states
- Provide context in labels (e.g., "Submit registration form")

**Examples**:
```tsx
<Button
  aria-label="Submit registration form"
  aria-busy={isSubmitting}
  disabled={isSubmitting}
>
  {isSubmitting ? "Submitting..." : "Submit"}
</Button>
```

## Component-Specific Improvements

### Hero Section
- Section includes `aria-label`
- Event details use semantic `<time>` elements
- Stats include `aria-label` for numbers
- CTA buttons include descriptive `aria-label`
- Scroll indicator is keyboard accessible

### Navigation
- Main nav includes `role="navigation"` and `aria-label`
- Mobile menu includes `role="menu"` and `aria-label`
- Menu items use `role="menuitem"`
- Menu button includes `aria-expanded` and `aria-controls`

### Registration Form
- Form includes `aria-label`
- All fields have proper labels and descriptions
- Error messages use `role="alert"` and `aria-live="polite"`
- Success indicators announced via `aria-label`
- Live region announces form submission results

### Blog Components
- Blog posts use semantic `<article>` elements
- Dates use `<time>` with `dateTime` attribute
- Reading time includes descriptive `aria-label`
- External links include "Opens in new tab" in `aria-label`

### Sponsors Section
- Sponsor links include descriptive `aria-label`
- Lists use proper `role="list"` and `role="listitem"`
- Sponsor logos are decorative (`aria-hidden="true"`)

## Testing Accessibility

### Manual Testing

1. **Screen Reader Testing**:
   - Test with NVDA (Windows), JAWS (Windows), or VoiceOver (macOS/iOS)
   - Navigate through all pages and forms
   - Verify announcements are clear and helpful

2. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Verify logical tab order
   - Test arrow key navigation in menus
   - Verify focus indicators are visible

3. **Color Contrast**:
   - Use tools like WebAIM Contrast Checker
   - Verify all text meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)

### Automated Testing

**Tools**:
- **axe DevTools**: Browser extension for accessibility testing
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Includes accessibility audit
- **Pa11y**: Command-line accessibility testing

**Example**:
```bash
# Run Lighthouse accessibility audit
npx lighthouse https://jengahacks.com --only-categories=accessibility

# Run Pa11y
npx pa11y https://jengahacks.com
```

## Best Practices

1. **Always Provide Labels**:
   - Every form field must have a label
   - Every button must have accessible text
   - Every link must have descriptive text

2. **Use Semantic HTML**:
   - Prefer semantic elements over divs
   - Use proper heading hierarchy
   - Use lists for list-like content

3. **Announce Dynamic Changes**:
   - Use live regions for important updates
   - Use `aria-live="polite"` for non-critical updates
   - Use `aria-live="assertive"` for critical errors

4. **Hide Decorative Content**:
   - Use `aria-hidden="true"` for decorative icons/images
   - Use `sr-only` class for visually hidden but accessible content

5. **Provide Context**:
   - Include action context in `aria-label` (e.g., "Navigate to...", "Opens in new tab")
   - Link related content via `aria-describedby` and `aria-labelledby`

6. **Test Regularly**:
   - Test with screen readers
   - Test keyboard navigation
   - Run automated accessibility audits
   - Test with real users with disabilities

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/resources/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

## Related Documentation

- [Keyboard Navigation Guide](./KEYBOARD_NAVIGATION.md) - Comprehensive keyboard navigation documentation
- [Animations Guide](./ANIMATIONS.md) - Animation and transition details

