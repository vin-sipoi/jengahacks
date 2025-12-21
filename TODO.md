# TODO

## 🚀 High Priority

### Database & Backend
- [ ] Apply database migrations to production
  - [ ] `20251218000000_add_rate_limiting.sql` - Email-based rate limiting
  - [ ] `20251218000001_add_ip_rate_limiting.sql` - IP-based rate limiting
- [ ] Deploy Supabase Edge Functions
  - [ ] `register-with-ip` - IP capture for registrations
  - [ ] `verify-recaptcha` - Server-side CAPTCHA verification
- [ ] Set up environment variables in production
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_RECAPTCHA_SITE_KEY`
  - [ ] `VITE_USE_REGISTRATION_EDGE_FUNCTION` (set to `true` for IP rate limiting)

### Security
- [ ] Set up reCAPTCHA v2 Checkbox in production
  - [ ] Create site in [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
  - [ ] Add production domain to allowed domains
  - [ ] Configure site key in production environment
- [ ] Set up Content Security Policy (CSP) headers
- [ ] Configure security headers (X-Frame-Options, X-Content-Type-Options, etc.)
- [ ] Enable HTTPS enforcement in production
- [ ] Set up server-side CAPTCHA verification (optional but recommended)

### Deployment
- [ ] Deploy to production hosting
- [ ] Configure custom domain
- [ ] Set up CI/CD pipeline
- [ ] Configure production environment variables
- [ ] Test production deployment end-to-end

## 📋 Medium Priority

### Features & Enhancements
- [x] Add WhatsApp number field to registration form
- [x] Add WhatsApp number validation and normalization
- [x] Add autocomplete attributes to form fields (email, name, tel, url)
- [ ] Add email confirmation for registrations
- [ ] Add registration confirmation page/thank you page
- [ ] Implement admin dashboard for viewing registrations
- [ ] Add export functionality for registrations (CSV/Excel)
- [ ] Add registration status tracking
- [ ] Implement waitlist functionality if registrations exceed limit
- [ ] Add ability to update/cancel registrations
- [ ] Add registration QR code generation

### UI/UX Improvements
- [x] Add loading states for better UX
- [x] Improve mobile responsiveness
- [x] Improve form validation feedback (inline validation with visual indicators)
- [x] Add autocomplete attributes for better UX
- [x] Add React Router v7 future flags (v7_startTransition, v7_relativeSplatPath)
- [ ] Add animations and transitions
- [ ] Add success/error animations
- [ ] Add keyboard navigation improvements
- [ ] Improve accessibility (ARIA labels, screen reader support)

### Testing
- [x] Add unit tests for security utilities (`src/lib/security.test.ts` - 35 tests)
- [x] Add unit tests for HTML sanitization (`src/lib/sanitize.test.ts` - 10 tests)
- [x] Add unit tests for StructuredData component (`src/components/StructuredData.test.tsx` - 6 tests)
- [x] Add unit tests for Registration component (19 tests)
- [x] Add unit tests for rate limiting utilities (`src/lib/rateLimit.test.ts`)
- [x] Add unit tests for Navbar, Hero, About, Sponsors components
- [x] Add unit tests for Index page
- [x] Add unit tests for utility functions (`src/lib/utils.test.ts`)
- [ ] Add integration tests for registration flow
- [ ] Add E2E tests (Playwright/Cypress)
- [ ] Test rate limiting in production-like environment
- [ ] Test CAPTCHA integration end-to-end
- [ ] Add performance tests
- [ ] Test on multiple browsers and devices
- [ ] Add visual regression tests

### Documentation
- [ ] Add API documentation
- [ ] Create deployment guide
- [ ] Add contributor guidelines
- [ ] Document environment variables
- [ ] Create troubleshooting guide
- [ ] Add architecture diagrams

## 🔧 Technical Improvements

### Code Quality
- [x] Fix TypeScript errors (removed `any` types, added proper type annotations)
- [x] Fix React Hook dependency warnings
- [x] Replace dangerouslySetInnerHTML with safer textContent approach in StructuredData
- [x] Add HTML sanitization utilities (DOMPurify integration)
- [ ] Add more comprehensive error boundaries
- [ ] Improve error handling and user feedback
- [ ] Add request/response logging (development only)
- [ ] Implement proper logging system
- [ ] Add monitoring and alerting
- [ ] Set up error tracking (Sentry, etc.)

### Performance
- [ ] Optimize bundle size
- [ ] Add code splitting
- [ ] Implement lazy loading for components
- [ ] Optimize images and assets
- [ ] Add caching strategies
- [ ] Implement service worker for offline support
- [ ] Optimize database queries

### Infrastructure
- [ ] Set up monitoring (uptime, performance)
- [ ] Configure backup strategies
- [ ] Set up staging environment
- [ ] Implement database backups
- [ ] Set up log aggregation
- [ ] Configure CDN for static assets

## 🎨 Design & Content

### Content Updates
- [ ] Finalize event date and details
- [ ] Add actual sponsor logos and information
- [ ] Update event description and details
- [ ] Add FAQ section
- [ ] Add schedule/timeline section
- [ ] Add prizes and awards information
- [ ] Add judges/mentors section
- [ ] Add past events/highlights section

### Design Improvements
- [ ] Add more visual elements and graphics
- [ ] Improve color scheme consistency
- [ ] Add more engaging animations
- [ ] Create custom illustrations
- [ ] Add video content
- [ ] Improve typography
- [ ] Add dark mode support (if desired)

## 🔐 Security Enhancements

### Additional Security Measures
- [x] Conduct security audit (see SECURITY_AUDIT.md for details)
- [x] Add HTML sanitization utilities for external content
- [x] Replace dangerouslySetInnerHTML with safer alternatives
- [ ] Fix CORS configuration in Edge Functions (restrict to specific origins)
- [ ] Add Content Security Policy (CSP) headers
- [ ] Add server-side input validation in Edge Functions
- [ ] Sanitize error messages to prevent information disclosure
- [ ] Add security headers (X-Frame-Options, HSTS, etc.)
- [ ] Add maxLength attributes to form inputs
- [ ] Implement file signature validation (magic bytes) for PDFs
- [ ] Add IP whitelisting for admin functions
- [ ] Set up DDoS protection
- [ ] Implement request signing for API calls
- [ ] Add audit logging for sensitive operations
- [ ] Set up security monitoring and alerts
- [ ] Regular security audits

## 📊 Analytics & Monitoring

- [ ] Set up Google Analytics or similar
- [ ] Add event tracking for form submissions
- [ ] Monitor registration conversion rates
- [ ] Track user behavior and engagement
- [ ] Set up error tracking and alerting
- [ ] Monitor API performance
- [ ] Track rate limit violations

## 🌐 Internationalization (Future)

- [ ] Add multi-language support
- [ ] Translate content to Swahili
- [ ] Add language switcher
- [ ] Localize dates and formats

## 📱 Mobile App (Future)

- [ ] Add push notifications
- [ ] Mobile-specific features

## 🤝 Community & Outreach

- [ ] Set up social media integration
- [ ] Add social sharing buttons
- [ ] Create blog/news section
- [ ] Add community forum or Discord integration

## 🐛 Known Issues

- [ ] Fix any reported bugs
- [ ] Address browser compatibility issues
- [ ] Resolve performance issues if any

## 📝 Maintenance

### Regular Tasks
- [ ] Keep dependencies updated
- [ ] Run security audits regularly
- [ ] Review and update documentation
- [ ] Monitor and optimize database performance
- [ ] Review and clean up old registrations (if needed)
- [ ] Backup database regularly

## 🎯 Post-Event Tasks

- [ ] Archive registrations
- [ ] Generate reports and analytics
- [ ] Send thank you emails to participants
- [ ] Collect feedback from participants
- [ ] Update website with event highlights
- [ ] Plan for next year's event

---

## Notes

- Items are organized by priority and category
- Check off items as they're completed
- Add new items as needed
- Review and update regularly

## Quick Links

- [README](./README.md)
- [Example Environment Variables](./example.env)

## Recent Accomplishments

### December 2024
- ✅ Added WhatsApp number field to registration form
- ✅ Added comprehensive test suite (119 tests across 11 test files)
- ✅ Fixed security concerns (XSS prevention, HTML sanitization)
- ✅ Improved form UX (autocomplete attributes, inline validation)
- ✅ Fixed TypeScript errors and React warnings
- ✅ Added React Router v7 future flags
- ✅ Conducted security audit

