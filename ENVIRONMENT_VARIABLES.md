# Environment Variables Documentation

Complete reference for all environment variables used in the JengaHacks 2026 project.

## Table of Contents

- [Overview](#overview)
- [Client-Side Variables (VITE_*)](#client-side-variables-vite_)
  - [Required](#required-client-side)
  - [Optional](#optional-client-side)
- [Server-Side Variables (Edge Functions)](#server-side-variables-edge-functions)
- [Setup Instructions](#setup-instructions)
- [Security Considerations](#security-considerations)
- [Environment-Specific Configuration](#environment-specific-configuration)
- [Troubleshooting](#troubleshooting)

## Overview

Environment variables are used to configure the application without hardcoding sensitive values. In Vite projects, client-side variables must be prefixed with `VITE_` to be exposed to the browser.

**Important:**
- Variables prefixed with `VITE_` are **exposed to the browser** - never include secrets
- Server-side variables (Edge Functions) are **never exposed** to the client
- Always use `.env` files for local development (never commit them)

## Client-Side Variables (VITE_*)

### Required Client-Side

These variables are required for the application to function properly.

#### `VITE_SUPABASE_URL`

**Type:** `string`  
**Required:** ✅ Yes  
**Example:** `https://abcdefghijklmnop.supabase.co`  
**Description:** Your Supabase project URL.

**Where to find:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Settings → API**
4. Copy the **Project URL**

**Validation:**
- Must be a valid HTTPS URL
- Must end with `.supabase.co`
- Application will throw an error if missing or invalid

---

#### `VITE_SUPABASE_PUBLISHABLE_KEY`

**Type:** `string`  
**Required:** ✅ Yes  
**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`  
**Description:** Supabase anonymous/public key (safe to expose in client).

**Where to find:**
1. Go to Supabase Dashboard → **Settings → API**
2. Copy the **anon/public** key (not the service_role key!)

**Security:**
- ✅ Safe to expose in client-side code
- ✅ Used for public database operations
- ❌ Do NOT use service_role key here

**Validation:**
- Application will throw an error if missing
- Must be a valid JWT token format

---

#### `VITE_RECAPTCHA_SITE_KEY`

**Type:** `string`  
**Required:** ✅ Yes (for production)  
**Example:** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`  
**Description:** Google reCAPTCHA site key for form protection.

**Where to find:**
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Create a new site or select existing
3. Choose **reCAPTCHA v2** (Checkbox) or **v3** (Invisible)
4. Add your domain(s) to allowed domains
5. Copy the **Site Key** (not the Secret Key)

**Development:**
- Can be empty in development (form will work without CAPTCHA)
- Required in production for security

**Note:** The Secret Key goes in Edge Function secrets (see [Server-Side Variables](#server-side-variables-edge-functions))

---

### Optional Client-Side

These variables enhance functionality but are not required for basic operation.

#### `VITE_USE_REGISTRATION_EDGE_FUNCTION`

**Type:** `boolean` (string: `"true"` or `"false"`)  
**Required:** ❌ No  
**Default:** `false`  
**Example:** `true`  
**Description:** Enable IP-based rate limiting via Edge Function.

**Values:**
- `"true"` - Use Edge Function for registration (captures IP, enables IP rate limiting)
- `"false"` - Use direct database insert (no IP capture, email-only rate limiting)

**When to enable:**
- ✅ Production deployments
- ✅ When Edge Functions are deployed
- ❌ Development (unless testing Edge Functions)

**Impact:**
- When `true`: Registration uses `register-with-ip` Edge Function
- When `false`: Registration uses direct Supabase client insert

---

#### `VITE_GA_MEASUREMENT_ID`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `G-XXXXXXXXXX`  
**Description:** Google Analytics 4 Measurement ID for tracking.

**Where to find:**
1. Go to [Google Analytics](https://analytics.google.com)
2. Create a GA4 property or select existing
3. Navigate to **Admin → Data Streams**
4. Select your web stream
5. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

**Usage:**
- Only used if `VITE_GA_ENABLED=true`
- Analytics will not initialize if this is missing

---

#### `VITE_GA_ENABLED`

**Type:** `boolean` (string: `"true"` or `"false"`)  
**Required:** ❌ No  
**Default:** `false` (if not set)  
**Example:** `true`  
**Description:** Enable or disable Google Analytics tracking.

**Values:**
- `"true"` - Enable analytics (requires `VITE_GA_MEASUREMENT_ID`)
- `"false"` or unset - Disable analytics

**Privacy:**
- Set to `false` to disable analytics completely
- Useful for development or privacy-conscious deployments

---

#### `VITE_SENTRY_DSN`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `https://c97ecce9c0ad10a5af3b065e2559ab61@o4510575021719552.ingest.us.sentry.io/4510575024209920`  
**Description:** Sentry Data Source Name (DSN) for error tracking and monitoring.

**Where to find:**
1. Go to [Sentry Dashboard](https://sentry.io)
2. Select your project
3. Navigate to **Settings → Projects → Client Keys (DSN)**
4. Copy the DSN URL

**Security:**
- ✅ DSN is safe to expose in client code
- ✅ Only used for sending error reports
- ⚠️ Requires `VITE_SENTRY_ENABLED=true` to activate

**Usage:**
- Used for automatic error tracking
- Captures unhandled exceptions and React errors
- Provides error context and stack traces
- Performance monitoring (optional)

---

#### `VITE_SENTRY_ENABLED`

**Type:** `boolean` (string: `"true"` or `"false"`)  
**Required:** ❌ No  
**Default:** `false` (if not set)  
**Example:** `true`  
**Description:** Enable or disable Sentry error tracking.

**Values:**
- `"true"` - Enable Sentry (requires `VITE_SENTRY_DSN`)
- `"false"` or unset - Disable Sentry

**Privacy:**
- Set to `false` to disable error tracking completely
- Useful for development or privacy-conscious deployments
- Defaults to `false` to respect user privacy

**Usage:**
- Controls whether Sentry initializes
- Even with DSN set, Sentry won't run unless enabled
- Recommended: Enable in production, disable in development

---

#### `VITE_SENTRY_SEND_PII`

**Type:** `boolean` (string: `"true"` or `"false"`)  
**Required:** ❌ No  
**Default:** `false` (if not set)  
**Example:** `true`  
**Description:** Send Personally Identifiable Information (PII) to Sentry.

**Values:**
- `"true"` - Send PII (IP addresses, user data)
- `"false"` or unset - Don't send PII (recommended)

**Privacy:**
- ⚠️ Only enable if you have user consent
- ⚠️ Must comply with GDPR, CCPA, and other privacy regulations
- ✅ Defaults to `false` for privacy protection

**What is PII:**
- IP addresses
- User email addresses
- User IDs
- Browser fingerprinting data

**Recommendation:**
- Keep `false` unless you have explicit consent
- Use `setUser()` manually if you need user context

---

#### `VITE_SENTRY_RELEASE`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `1.0.0`, `v1.2.3`, `2026-02-21`  
**Description:** Release version identifier for tracking errors by version.

**Usage:**
- Helps identify which version introduced bugs
- Useful for release management
- Can be set to git commit hash, version number, or date

**Example:**
```env
VITE_SENTRY_RELEASE=1.0.0
# or
VITE_SENTRY_RELEASE=abc123def456
```

---

#### `VITE_SENTRY_ENABLE_IN_DEV`

**Type:** `boolean` (string: `"true"` or `"false"`)  
**Required:** ❌ No  
**Default:** `false` (if not set)  
**Example:** `true`  
**Description:** Enable Sentry error tracking in development mode.

**Values:**
- `"true"` - Send errors to Sentry even in development
- `"false"` or unset - Only send errors in production

**Recommendation:**
- Keep `false` to avoid cluttering Sentry with dev errors
- Set to `true` only when debugging production-like issues locally

---

#### `VITE_ADMIN_PASSWORD`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `SecurePassword123!`  
**Description:** Password for admin portal access.

**Security:**
- ⚠️ Use a strong, unique password
- ⚠️ Change default password in production
- ⚠️ This is exposed to client (basic auth only)
- 💡 Consider implementing proper Supabase Auth for production

**Default:**
- Falls back to `"admin123"` if not set (development only)
- **Never use default in production!**

**Usage:**
- Used for admin portal authentication (`/admin` route)
- Also used for Edge Function admin operations

---

#### `VITE_DISCORD_URL`

**Type:** `string`  
**Required:** ❌ No  
**Default:** `https://discord.gg/jengahacks`  
**Example:** `https://discord.gg/your-server`  
**Description:** Discord community server invite URL.

**Where to find:**
1. Go to your Discord server
2. Right-click server → **Invite People**
3. Create invite link (permanent or temporary)
4. Copy the invite URL

**Usage:**
- Used in Hero section Discord button
- Used in Footer Discord link
- Used in About section community CTA

---

#### `VITE_LOCALE`

**Type:** `string`  
**Required:** ❌ No  
**Default:** Browser-detected or `"en"`  
**Example:** `en`, `sw`  
**Description:** Default locale for internationalization.

**Supported Values:**
- `en` - English
- `sw` - Swahili

**Usage:**
- Sets default language on first visit
- Users can change via language switcher
- Falls back to browser language if not set

---

#### `VITE_TIMEZONE`

**Type:** `string`  
**Required:** ❌ No  
**Default:** `Africa/Nairobi`  
**Example:** `Africa/Nairobi`, `UTC`, `America/New_York`  
**Description:** Default timezone for date/time formatting.

**Format:**
- IANA timezone identifier (e.g., `Africa/Nairobi`)
- See [IANA Time Zone Database](https://www.iana.org/time-zones)

**Usage:**
- Used for date/time formatting in i18n utilities
- Affects registration timestamps display
- Admin dashboard date formatting

---

#### `VITE_BLOG_API_URL`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `https://api.example.com/blog/posts`  
**Description:** API endpoint for fetching blog posts.

**Usage:**
- Used by blog feature to fetch posts
- Falls back to RSS feed if not provided
- Can be used for custom blog API integration

**Format:**
- Must return JSON array of blog post objects
- See `src/lib/blog.ts` for expected format

---

#### `VITE_BLOG_RSS_URL`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `https://medium.com/feed/@jengahacks`  
**Description:** RSS feed URL for blog posts.

**Usage:**
- Primary source for blog posts if API URL not provided
- Parsed to extract blog post data
- Supports Medium, WordPress, and other RSS feeds

---

#### `VITE_RSS_PROXY_URL`

**Type:** `string`  
**Required:** ❌ No  
**Example:** `https://rss-proxy.example.com`  
**Description:** CORS proxy URL for RSS feeds.

**Usage:**
- Used when RSS feed doesn't allow CORS
- Proxy must support RSS feed forwarding
- Falls back to direct RSS URL if not provided

---

## Server-Side Variables (Edge Functions)

These variables are set in Supabase Edge Function secrets and are **never exposed** to the client.

### Setting Edge Function Secrets

```bash
# Using Supabase CLI
supabase secrets set SECRET_NAME=secret_value

# Example
supabase secrets set RECAPTCHA_SECRET_KEY=your_secret_key
```

Or via Supabase Dashboard:
1. Go to **Project Settings → Edge Functions**
2. Navigate to **Secrets**
3. Add secret name and value

---

#### `SUPABASE_URL`

**Type:** `string`  
**Required:** ✅ Yes  
**Auto-provided:** ✅ Yes (automatically available)  
**Description:** Supabase project URL (same as `VITE_SUPABASE_URL`).

**Note:** This is automatically provided by Supabase - you don't need to set it manually.

---

#### `SUPABASE_SERVICE_ROLE_KEY`

**Type:** `string`  
**Required:** ✅ Yes  
**Auto-provided:** ✅ Yes (automatically available)  
**Description:** Supabase service role key for admin operations.

**Security:**
- ⚠️ **NEVER expose this to the client**
- ⚠️ Only used in Edge Functions
- ⚠️ Has full database access (bypasses RLS)

**Note:** This is automatically provided by Supabase - you don't need to set it manually.

---

#### `RECAPTCHA_SECRET_KEY`

**Type:** `string`  
**Required:** ✅ Yes (if using reCAPTCHA verification)  
**Example:** `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`  
**Description:** Google reCAPTCHA secret key for server-side verification.

**Where to find:**
1. Go to [Google reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
2. Select your site
3. Copy the **Secret Key** (not the Site Key)

**Usage:**
- Used by `verify-recaptcha` Edge Function
- Validates CAPTCHA tokens server-side
- Prevents client-side manipulation

**Set via CLI:**
```bash
supabase secrets set RECAPTCHA_SECRET_KEY=your_secret_key
```

---

#### `ADMIN_PASSWORD`

**Type:** `string`  
**Required:** ❌ No (has default)  
**Default:** `admin123`  
**Example:** `SecurePassword123!`  
**Description:** Admin password for protected Edge Function endpoints.

**Security:**
- ⚠️ Change default in production
- ⚠️ Use strong password
- 💡 Consider implementing Supabase Auth instead

**Usage:**
- Used by `get-resume-url` Edge Function
- Validates admin access for resume downloads
- Can be overridden by request body `admin_password`

**Set via CLI:**
```bash
supabase secrets set ADMIN_PASSWORD=your_secure_password
```

---

## Setup Instructions

### Local Development

1. **Copy example file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file:**
   ```env
   # Required
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_RECAPTCHA_SITE_KEY=your-site-key

   # Optional
   VITE_USE_REGISTRATION_EDGE_FUNCTION=false
   VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   VITE_GA_ENABLED=false
   VITE_ADMIN_PASSWORD=dev-password
   VITE_DISCORD_URL=https://discord.gg/jengahacks
   ```

3. **Restart dev server:**
   ```bash
   npm run dev
   ```

### Production Deployment

#### Vercel

1. Go to **Project Settings → Environment Variables**
2. Add all required variables
3. Set environment (Production, Preview, Development)
4. Redeploy

#### Netlify

1. Go to **Site Settings → Environment Variables**
2. Add all required variables
3. Redeploy

#### GitHub Actions

Add secrets in **Repository Settings → Secrets → Actions**:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_RECAPTCHA_SITE_KEY`
- etc.

Reference in workflow:
```yaml
env:
  VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
```

### Edge Functions

Set secrets via CLI:
```bash
supabase secrets set RECAPTCHA_SECRET_KEY=your_secret_key
supabase secrets set ADMIN_PASSWORD=your_password
```

Or via Dashboard:
1. **Project Settings → Edge Functions → Secrets**
2. Add secret name and value
3. Click **Save**

---

## Security Considerations

### Client-Side Variables (VITE_*)

⚠️ **Important:** All `VITE_*` variables are exposed in the browser bundle.

**Safe to expose:**
- ✅ Public API keys (Supabase anon key, reCAPTCHA site key)
- ✅ Public URLs
- ✅ Feature flags
- ✅ Configuration values

**Never expose:**
- ❌ Secret keys
- ❌ Service role keys
- ❌ Database passwords
- ❌ API secrets

### Server-Side Variables

✅ **Safe:** Edge Function secrets are never exposed to the client.

**Best Practices:**
- Use strong passwords for `ADMIN_PASSWORD`
- Rotate secrets regularly
- Use different values for dev/staging/production
- Never commit secrets to version control

### Environment File Security

- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Never commit `.env` files
- ✅ Use `.env.example` as template (without real values)
- ✅ Use platform secrets management for production

---

## Environment-Specific Configuration

### Development

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_RECAPTCHA_SITE_KEY=your-site-key
VITE_USE_REGISTRATION_EDGE_FUNCTION=false
VITE_GA_ENABLED=false
VITE_ADMIN_PASSWORD=dev-password
```

### Staging

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_RECAPTCHA_SITE_KEY=your-site-key
VITE_USE_REGISTRATION_EDGE_FUNCTION=true
VITE_GA_ENABLED=true
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ADMIN_PASSWORD=staging-password
```

### Production

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_RECAPTCHA_SITE_KEY=your-site-key
VITE_USE_REGISTRATION_EDGE_FUNCTION=true
VITE_GA_ENABLED=true
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_ADMIN_PASSWORD=strong-production-password
VITE_DISCORD_URL=https://discord.gg/jengahacks
VITE_LOCALE=en
VITE_TIMEZONE=Africa/Nairobi
```

---

## Troubleshooting

### Variable Not Working

**Issue:** Environment variable not accessible in code

**Solutions:**
1. ✅ Ensure variable starts with `VITE_` for client-side
2. ✅ Restart dev server after adding variables
3. ✅ Check for typos in variable name
4. ✅ Verify `.env` file is in project root
5. ✅ Check variable is not in `.gitignore` (should be)

### Build-Time vs Runtime

**Vite Variables:**
- `VITE_*` variables are embedded at **build time**
- Changes require rebuild
- Use build-time variables for configuration

**Runtime Variables:**
- Not supported for client-side in Vite
- Use Edge Functions for runtime configuration
- Or fetch config from API endpoint

### Missing Variables

**Error:** `Missing VITE_SUPABASE_URL environment variable`

**Solution:**
1. Check `.env` file exists
2. Verify variable name matches exactly (case-sensitive)
3. Ensure no trailing spaces
4. Restart dev server

### Edge Function Secrets

**Issue:** Edge Function can't access secret

**Solutions:**
1. Verify secret is set: `supabase secrets list`
2. Check secret name matches exactly
3. Redeploy Edge Function after setting secret
4. Check Supabase Dashboard for secret visibility

### Type Issues

**Issue:** Boolean variables treated as strings

**Solution:**
```typescript
// Correct way to check boolean
const isEnabled = import.meta.env.VITE_GA_ENABLED === 'true';

// Not this:
const isEnabled = import.meta.env.VITE_GA_ENABLED; // This is a string!
```

---

## Quick Reference

### Required Variables Checklist

**Client-Side:**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_RECAPTCHA_SITE_KEY` (production)

**Server-Side:**
- [ ] `RECAPTCHA_SECRET_KEY` (if using CAPTCHA verification)
- [ ] `ADMIN_PASSWORD` (change from default)

### Optional Variables Checklist

**Client-Side:**
- [ ] `VITE_USE_REGISTRATION_EDGE_FUNCTION`
- [ ] `VITE_GA_MEASUREMENT_ID`
- [ ] `VITE_GA_ENABLED`
- [ ] `VITE_SENTRY_DSN`
- [ ] `VITE_SENTRY_ENABLED`
- [ ] `VITE_SENTRY_SEND_PII`
- [ ] `VITE_SENTRY_RELEASE`
- [ ] `VITE_SENTRY_ENABLE_IN_DEV`
- [ ] `VITE_ADMIN_PASSWORD`
- [ ] `VITE_DISCORD_URL`
- [ ] `VITE_LOCALE`
- [ ] `VITE_TIMEZONE`
- [ ] `VITE_BLOG_API_URL`
- [ ] `VITE_BLOG_RSS_URL`
- [ ] `VITE_RSS_PROXY_URL`

---

## Example `.env` File

```env
# ============================================
# Required Variables
# ============================================

# Supabase Configuration
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# reCAPTCHA (required for production)
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI

# ============================================
# Optional Variables
# ============================================

# Edge Functions
VITE_USE_REGISTRATION_EDGE_FUNCTION=false

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA_ENABLED=false

# Sentry Error Tracking
VITE_SENTRY_DSN=https://c97ecce9c0ad10a5af3b065e2559ab61@o4510575021719552.ingest.us.sentry.io/4510575024209920
VITE_SENTRY_ENABLED=false
VITE_SENTRY_SEND_PII=false
VITE_SENTRY_RELEASE=
VITE_SENTRY_ENABLE_IN_DEV=false

# Admin
VITE_ADMIN_PASSWORD=dev-password-123

# Social & Community
VITE_DISCORD_URL=https://discord.gg/jengahacks

# Internationalization
VITE_LOCALE=en
VITE_TIMEZONE=Africa/Nairobi

# Blog (optional)
VITE_BLOG_API_URL=https://api.example.com/blog/posts
VITE_BLOG_RSS_URL=https://medium.com/feed/@jengahacks
VITE_RSS_PROXY_URL=https://rss-proxy.example.com
```

---

## Support

For issues with environment variables:
- Check [Deployment Guide](./DEPLOYMENT.md) for platform-specific setup
- Review [API Documentation](./API.md) for Edge Function configuration
- Check Supabase Dashboard for project settings
- Open an issue on the repository

---

**Last Updated:** January 2026  
**Version:** 1.0.0

