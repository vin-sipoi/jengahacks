# Keyboard Navigation Guide

This document describes the keyboard navigation improvements implemented throughout the JengaHacks Hub application.

## Overview

The application now includes comprehensive keyboard navigation support, making it fully accessible to users who navigate using only a keyboard.

## Features

### 1. Skip Link

**Component**: `SkipLink`
- **Location**: `src/components/SkipLink.tsx`
- **Purpose**: Allows keyboard users to skip directly to main content
- **Usage**: Automatically included on all pages
- **Activation**: Press Tab on page load to see "Skip to main content" link

### 2. Keyboard Shortcuts

**Hook**: `useKeyboardShortcuts`
- **Location**: `src/hooks/useKeyboardShortcuts.ts`
- **Purpose**: Global keyboard shortcuts for common actions

**Available Shortcuts**:
- `Ctrl/Cmd + M`: Focus main content
- `Ctrl/Cmd + Home`: Scroll to top
- `Ctrl/Cmd + End`: Scroll to bottom
- `Ctrl/Cmd + K`: Focus search (if available)

### 3. Focus Trap

**Hook**: `useFocusTrap`
- **Location**: `src/hooks/useFocusTrap.ts`
- **Purpose**: Traps focus within modals, dropdowns, and overlays
- **Usage**: Automatically applied to mobile menu

**Features**:
- Tab cycles through focusable elements within container
- Shift+Tab cycles backwards
- Focus cannot escape the container while active

### 4. Arrow Key Navigation

**Hook**: `useArrowKeyNavigation`
- **Location**: `src/hooks/useArrowKeyNavigation.ts`
- **Purpose**: Arrow key navigation for lists, menus, and grids

**Features**:
- Arrow Up/Down: Navigate vertically
- Arrow Left/Right: Navigate horizontally
- Home: Jump to first item
- End: Jump to last item
- Loop: Wraps around at beginning/end

### 5. Enhanced Mobile Menu Navigation

**Improvements**:
- Arrow key navigation (Up/Down)
- Escape key to close menu
- Focus trap when menu is open
- Focus returns to menu button when closed
- Enter/Space to activate menu items

**ARIA Attributes**:
- `aria-expanded`: Indicates menu state
- `aria-controls`: Links button to menu
- `role="menu"`: Identifies menu container
- `role="menuitem"`: Identifies menu items

### 6. Form Keyboard Shortcuts

**Registration Form**:
- `Ctrl/Cmd + Enter`: Submit form
- Tab navigation between fields
- Enter to submit
- Escape to clear focus

### 7. Enhanced Focus Indicators

**Visual Improvements**:
- Clear focus rings on all interactive elements
- Consistent focus styling
- High contrast for visibility
- Smooth transitions

**CSS Classes**:
- `focus-visible`: Enhanced focus styles
- `focus:ring-2`: Visible focus ring
- `focus:ring-primary`: Primary color ring
- `focus:ring-offset-2`: Ring offset for visibility

## Implementation Details

### Skip Link

```tsx
<SkipLink />
```

The skip link is hidden by default and appears when focused. It allows users to jump directly to the main content area.

### Keyboard Shortcuts

```tsx
import { useKeyboardShortcuts, commonShortcuts } from "@/hooks/useKeyboardShortcuts";

useKeyboardShortcuts([
  commonShortcuts.focusMainContent,
  commonShortcuts.scrollToTop,
]);
```

### Focus Trap

```tsx
import { useFocusTrap } from "@/hooks/useFocusTrap";

const trapRef = useFocusTrap(isActive);
<div ref={trapRef}>...</div>
```

### Arrow Key Navigation

```tsx
import { useArrowKeyNavigation } from "@/hooks/useArrowKeyNavigation";

const navRef = useArrowKeyNavigation({
  enabled: true,
  orientation: "vertical",
  loop: true,
});
<div ref={navRef}>...</div>
```

## Keyboard Navigation Patterns

### Navigation Menu

1. **Open Menu**: Click/Tap menu button or press Enter/Space when focused
2. **Navigate**: Use Arrow Up/Down keys
3. **Select**: Press Enter or Space
4. **Close**: Press Escape or click outside

### Forms

1. **Navigate Fields**: Tab to move forward, Shift+Tab to move backward
2. **Submit**: Press Enter or Ctrl/Cmd+Enter
3. **Clear Focus**: Press Escape

### Modals/Dropdowns

1. **Open**: Click trigger or press Enter/Space
2. **Navigate**: Tab/Shift+Tab or Arrow keys
3. **Close**: Press Escape or click outside

## Accessibility Standards

All keyboard navigation improvements follow:

- **WCAG 2.1 Level AA**: Keyboard accessible
- **ARIA Best Practices**: Proper roles and attributes
- **Focus Management**: Logical tab order
- **Visual Indicators**: Clear focus states

## Testing Keyboard Navigation

### Manual Testing

1. **Tab Navigation**:
   - Press Tab to move through interactive elements
   - Verify logical order
   - Check focus visibility

2. **Arrow Keys**:
   - Test in menus and lists
   - Verify wrapping behavior
   - Check Home/End keys

3. **Shortcuts**:
   - Test all global shortcuts
   - Verify no conflicts
   - Check cross-browser compatibility

4. **Focus Trap**:
   - Open modal/menu
   - Press Tab repeatedly
   - Verify focus stays within container

5. **Escape Key**:
   - Open modal/menu
   - Press Escape
   - Verify closure and focus return

### Automated Testing

Consider adding keyboard navigation tests to E2E test suite:

```typescript
test('should navigate menu with arrow keys', async ({ page }) => {
  await page.keyboard.press('Tab'); // Focus menu button
  await page.keyboard.press('Enter'); // Open menu
  await page.keyboard.press('ArrowDown'); // Navigate
  await page.keyboard.press('Enter'); // Select
});
```

## Browser Compatibility

Keyboard navigation works in:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (with external keyboard)

## Best Practices

1. **Logical Tab Order**: Ensure tab order follows visual flow
2. **Focus Indicators**: Always show clear focus states
3. **Skip Links**: Provide skip links for repetitive content
4. **Keyboard Shortcuts**: Document shortcuts for users
5. **Focus Management**: Return focus appropriately after actions
6. **Escape Key**: Always allow Escape to close modals/menus

## Future Enhancements

Potential additions:
- [ ] Keyboard shortcut help dialog (press `?`)
- [ ] Customizable keyboard shortcuts
- [ ] Voice navigation support
- [ ] Enhanced screen reader announcements
- [ ] Keyboard navigation for carousels/sliders
- [ ] Grid navigation with arrow keys

## Related Documentation

- [Accessibility Guide](./ACCESSIBILITY.md) - Comprehensive accessibility documentation
- [Animations Guide](./ANIMATIONS.md) - Animation and transition details
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) - Web Content Accessibility Guidelines

