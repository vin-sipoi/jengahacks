# Contributing to JengaHacks Hub

Thank you for your interest in contributing to JengaHacks 2026! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Features](#suggesting-features)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Review Guidelines](#code-review-guidelines)
- [Project Structure](#project-structure)
- [Style Guide](#style-guide)

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of background, experience level, gender identity, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Expected Behavior

- Be respectful and considerate
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling, insulting/derogatory comments, and personal attacks
- Publishing others' private information without permission
- Other conduct that could reasonably be considered inappropriate

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues to avoid duplicates.

**Bug Report Template:**

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

**Include:**
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details
- Error messages or logs

### Suggesting Features

Feature suggestions help us improve the project. Please include:

**Feature Request Template:**

```markdown
**Is your feature request related to a problem?**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

**Consider:**
- Does it align with project goals?
- Is it feasible to implement?
- Does it improve user experience?
- Are there security implications?

### Submitting Pull Requests

1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```
3. **Make your changes**
4. **Write/update tests**
5. **Ensure tests pass:**
   ```bash
   npm run test:run
   npm run lint
   ```
6. **Commit your changes** (follow [commit message guidelines](#commit-message-guidelines))
7. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request**

## Development Setup

### Prerequisites

- **Node.js** v18 or higher
- **npm** or **bun** package manager
- **Git**

### Initial Setup

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/jengahacks-hub.git
   cd jengahacks-hub
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your local configuration (see [README.md](./README.md#environment-setup))

4. **Start development server:**
   ```bash
   npm run dev
   ```

5. **Verify setup:**
   ```bash
   npm run test:run
   npm run lint
   npm run build
   ```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` types - use proper types or `unknown`
- Use interfaces for object shapes
- Prefer `const` over `let`, avoid `var`
- Use meaningful variable and function names

**Good:**
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}

const getUserById = async (id: string): Promise<User | null> => {
  // implementation
};
```

**Avoid:**
```typescript
const getUser = async (id: any): Promise<any> => {
  // implementation
};
```

### React Components

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use TypeScript for component props
- Prefer named exports for components

**Good:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  return (
    <button onClick={onClick} className={cn('btn', `btn-${variant}`)}>
      {label}
    </button>
  );
};

export default Button;
```

### File Naming

- **Components:** PascalCase (e.g., `RegistrationForm.tsx`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Tests:** Same as source file with `.test.` (e.g., `RegistrationForm.test.tsx`)
- **Hooks:** camelCase with `use` prefix (e.g., `useTranslation.ts`)

### Import Organization

Order imports as follows:

1. External dependencies (React, third-party libraries)
2. Internal modules (@/ imports)
3. Relative imports
4. Type imports (using `import type`)

**Example:**
```typescript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatDate } from '@/lib/utils';

import type { User } from '@/types';
```

### Code Formatting

- Use Prettier (if configured) or follow consistent formatting
- Use 2 spaces for indentation
- Use single quotes for strings (unless double quotes are needed)
- Add trailing commas in multi-line objects/arrays
- Maximum line length: 100 characters (soft limit)

### Comments

- Write self-documenting code (prefer clear code over comments)
- Add comments for complex logic or business rules
- Use JSDoc for public APIs
- Keep comments up-to-date with code changes

**Good:**
```typescript
/**
 * Calculates the rate limit status for a given email.
 * Returns whether registration is allowed and retry information.
 *
 * @param email - User's email address
 * @returns Rate limit status with allowed flag and retry after seconds
 */
export const checkRateLimit = (email: string): RateLimitStatus => {
  // Implementation
};
```

## Testing Guidelines

### Test Requirements

- **All new features** must include tests
- **Bug fixes** should include regression tests
- **Edge cases** should be covered
- Aim for **>80% code coverage** for new code

### Writing Tests

1. **Test files** should be co-located with source files:
   - `src/components/Registration.tsx` → `src/components/Registration.test.tsx`
   - `src/lib/utils.ts` → `src/lib/utils.test.ts`

2. **Use descriptive test names:**
   ```typescript
   // Good
   it('should display error message when email is invalid', () => {
     // test
   });

   // Avoid
   it('works', () => {
     // test
   });
   ```

3. **Follow AAA pattern** (Arrange, Act, Assert):
   ```typescript
   it('should validate email format', () => {
     // Arrange
     const validEmail = 'test@example.com';
     const invalidEmail = 'not-an-email';

     // Act
     const validResult = isValidEmail(validEmail);
     const invalidResult = isValidEmail(invalidEmail);

     // Assert
     expect(validResult).toBe(true);
     expect(invalidResult).toBe(false);
   });
   ```

4. **Test user interactions**, not implementation details:
   ```typescript
   // Good - tests user-visible behavior
   it('should submit form when valid data is entered', async () => {
     render(<RegistrationForm />);
     await userEvent.type(screen.getByLabelText('Email'), 'test@example.com');
     await userEvent.click(screen.getByRole('button', { name: 'Submit' }));
     expect(screen.getByText('Registration successful')).toBeInTheDocument();
   });

   // Avoid - tests implementation details
   it('should call onSubmit function', () => {
     const onSubmit = vi.fn();
     // ...
   });
   ```

### Running Tests

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, build config, etc.)
- `perf`: Performance improvements
- `ci`: CI/CD changes
- `build`: Build system changes

### Examples

**Good:**
```
feat(registration): add WhatsApp number field

Add optional WhatsApp number input to registration form with validation.
Includes E.164 format validation and normalization.

Closes #123
```

```
fix(security): prevent XSS in user input sanitization

Update sanitizeInput function to properly escape HTML entities.
Adds DOMPurify integration for additional security.

Fixes #456
```

```
docs: update API documentation

Add missing Edge Function endpoints and update request/response examples.
```

**Avoid:**
```
fix: bug fix
update: changed stuff
WIP: working on feature
```

## Pull Request Process

### Before Submitting

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm run test:run`)
- [ ] Code is linted (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Tests added/updated for new features
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with main

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe the tests you ran and their results

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console errors
- [ ] Tested in multiple browsers

## Related Issues
Closes #123
```

### Review Process

1. **Automated checks** must pass (tests, linting, build)
2. **Code review** by maintainers
3. **Address feedback** and update PR
4. **Approval** from at least one maintainer
5. **Merge** (squash and merge preferred)

## Code Review Guidelines

### For Reviewers

- Be constructive and respectful
- Focus on code quality, not personal preferences
- Explain reasoning for requested changes
- Approve when satisfied, even if minor improvements could be made
- Use GitHub's suggestion feature for small fixes

### For Contributors

- Respond to all review comments
- Don't take feedback personally
- Ask questions if feedback is unclear
- Make requested changes or explain why not
- Keep PRs focused and reasonably sized

## Project Structure

```
jengahacks-hub/
├── public/                 # Static assets
├── src/
│   ├── assets/            # Images, logos, etc.
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── *.tsx         # Feature components
│   ├── hooks/            # Custom React hooks
│   ├── integrations/     # Third-party integrations
│   │   └── supabase/     # Supabase client
│   ├── lib/              # Utility functions
│   ├── locales/          # Translation files
│   ├── pages/            # Page components
│   ├── test/             # Test utilities
│   └── *.tsx             # App entry points
├── supabase/
│   ├── functions/        # Edge Functions
│   └── migrations/       # Database migrations
└── *.config.*            # Configuration files
```

### Where to Add Code

- **New components:** `src/components/`
- **New pages:** `src/pages/`
- **Utilities:** `src/lib/`
- **Custom hooks:** `src/hooks/`
- **Tests:** Co-located with source files
- **Database changes:** `supabase/migrations/`
- **Edge Functions:** `supabase/functions/`

## Style Guide

### CSS/Styling

- Use **Tailwind CSS** utility classes
- Prefer utility classes over custom CSS
- Use CSS variables for theming (defined in `src/index.css`)
- Follow mobile-first responsive design
- Use semantic class names when custom CSS is needed

**Good:**
```tsx
<div className="flex flex-col gap-4 p-6 bg-card rounded-lg border border-border">
  <h2 className="text-2xl font-bold text-foreground">Title</h2>
</div>
```

### Accessibility

- Use semantic HTML elements
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Maintain color contrast ratios
- Test with screen readers

**Good:**
```tsx
<button
  onClick={handleClick}
  aria-label="Close dialog"
  className="p-2 rounded hover:bg-muted"
>
  <X className="w-4 h-4" aria-hidden="true" />
</button>
```

### Performance

- Use React.memo for expensive components
- Lazy load routes when appropriate
- Optimize images (use WebP, proper sizing)
- Avoid unnecessary re-renders
- Use React Query for data fetching/caching

### Security

- Sanitize user input
- Validate data on client and server
- Use parameterized queries (Supabase handles this)
- Never commit secrets or API keys
- Follow security best practices

## Getting Help

- **Documentation:** Check [README.md](./README.md) and [API.md](./API.md)
- **Issues:** Search existing issues before creating new ones
- **Questions:** Open a discussion or ask in issues
- **Security:** Report security issues privately to maintainers

## Recognition

Contributors will be recognized in:
- Project README (if applicable)
- Release notes
- GitHub contributors page

Thank you for contributing to JengaHacks 2026! 🎉

---

**Last Updated:** January 2026


