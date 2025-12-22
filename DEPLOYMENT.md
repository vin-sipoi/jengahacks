# Deployment Guide

This guide covers deploying the JengaHacks 2026 website to production, including database setup, Edge Functions deployment, and frontend hosting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Supabase Setup](#supabase-setup)
  - [Database Migrations](#database-migrations)
  - [Edge Functions](#edge-functions)
  - [Storage Buckets](#storage-buckets)
  - [Environment Variables](#supabase-environment-variables)
- [Frontend Deployment](#frontend-deployment)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)
  - [Cloudflare Pages](#cloudflare-pages)
  - [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Post-Deployment Verification](#post-deployment-verification)
- [CI/CD Setup](#cicd-setup)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- ✅ **Supabase Account** - [Sign up](https://supabase.com)
- ✅ **Node.js** (v18+) installed
- ✅ **Git** installed
- ✅ **Supabase CLI** installed (`npm install -g supabase`)
- ✅ **Google reCAPTCHA** account and site key
- ✅ **Google Analytics** account (optional)
- ✅ **Hosting Platform** account (Vercel, Netlify, etc.)

## Pre-Deployment Checklist

- [ ] All tests passing (`npm run test:run`)
- [ ] Code linted (`npm run lint`)
- [ ] Production build successful (`npm run build`)
- [ ] Environment variables documented
- [ ] Database migrations reviewed
- [ ] Edge Functions tested locally
- [ ] Security audit completed
- [ ] Performance optimization checked

## Supabase Setup

### Database Migrations

1. **Link to Supabase Project:**

```bash
supabase link --project-ref <your-project-ref>
```

2. **Apply Migrations:**

```bash
# Apply all pending migrations
supabase db push

# Or apply specific migration
supabase migration up <migration-name>
```

3. **Verify Migrations:**

```bash
# Check migration status
supabase migration list

# View database schema
supabase db diff
```

**Required Migrations (in order):**

1. `20251217173317_b1b034cb-519e-4104-9df8-911986161c60.sql` - Initial schema
2. `20251218000000_add_rate_limiting.sql` - Email-based rate limiting
3. `20251218000001_add_ip_rate_limiting.sql` - IP-based rate limiting
4. `20251219000000_add_whatsapp_number.sql` - WhatsApp number field
5. `20251220000000_add_rls_protection_update_delete.sql` - RLS protection
6. `20251220000001_fix_security_definer_search_path.sql` - Security fixes
7. `20251220000002_secure_resume_access.sql` - Resume access security
8. `20251220000003_add_validation_constraints.sql` - Database validation
9. `20251220000004_secure_storage_update_delete.sql` - Storage security

### Edge Functions

1. **Login to Supabase:**

```bash
supabase login
```

2. **Deploy Edge Functions:**

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy register-with-ip
supabase functions deploy verify-recaptcha
supabase functions deploy get-resume-url
```

3. **Set Edge Function Secrets:**

```bash
# Set reCAPTCHA secret key
supabase secrets set RECAPTCHA_SECRET_KEY=<your-recaptcha-secret-key>

# Set admin password
supabase secrets set ADMIN_PASSWORD=<secure-admin-password>
```

**Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions.

### Storage Buckets

1. **Create Storage Bucket:**

Navigate to Supabase Dashboard → Storage → Create Bucket:
- **Name:** `resumes`
- **Public:** `false` (private)
- **File Size Limit:** 5MB
- **Allowed MIME Types:** `application/pdf`

2. **Verify Storage Policies:**

Storage policies are created via migrations. Verify in Supabase Dashboard:
- ✅ INSERT policy allows public uploads
- ✅ SELECT policy denies public access
- ✅ UPDATE/DELETE policies deny all access

### Supabase Environment Variables

Set these in your Supabase project settings:

1. Go to **Project Settings → API**
2. Note your:
   - **Project URL** (`VITE_SUPABASE_URL`)
   - **Anon/Public Key** (`VITE_SUPABASE_PUBLISHABLE_KEY`)
   - **Service Role Key** (for Edge Functions - keep secret!)

## Frontend Deployment

### Vercel

1. **Install Vercel CLI:**

```bash
npm install -g vercel
```

2. **Deploy:**

```bash
# Login
vercel login

# Deploy
vercel --prod

# Or connect GitHub repo for automatic deployments
```

3. **Configure Environment Variables:**

In Vercel Dashboard → Project Settings → Environment Variables:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
VITE_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>
VITE_USE_REGISTRATION_EDGE_FUNCTION=true
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA_ENABLED=true
VITE_ADMIN_PASSWORD=<secure-password>
VITE_DISCORD_URL=https://discord.gg/jengahacks
```

4. **Build Settings:**

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Netlify

1. **Install Netlify CLI:**

```bash
npm install -g netlify-cli
```

2. **Deploy:**

```bash
# Login
netlify login

# Deploy
netlify deploy --prod

# Or connect GitHub repo
netlify init
```

3. **Create `netlify.toml`:**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

4. **Configure Environment Variables:**

In Netlify Dashboard → Site Settings → Environment Variables (add same variables as Vercel)

### GitHub Pages

1. **Install gh-pages:**

```bash
npm install --save-dev gh-pages
```

2. **Add to `package.json`:**

```json
{
  "scripts": {
    "deploy": "npm run build && gh-pages -d dist"
  }
}
```

3. **Configure GitHub Actions:**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_RECAPTCHA_SITE_KEY: ${{ secrets.VITE_RECAPTCHA_SITE_KEY }}
          VITE_USE_REGISTRATION_EDGE_FUNCTION: ${{ secrets.VITE_USE_REGISTRATION_EDGE_FUNCTION }}
          VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
          VITE_GA_ENABLED: ${{ secrets.VITE_GA_ENABLED }}
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

4. **Set GitHub Secrets:**

Repository → Settings → Secrets → Actions (add all environment variables)

### Cloudflare Pages

1. **Connect Repository:**

- Go to Cloudflare Dashboard → Pages → Create Project
- Connect GitHub/GitLab repository

2. **Build Settings:**

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Build Output Directory:** `dist`
- **Root Directory:** `/`

3. **Environment Variables:**

Add in Cloudflare Dashboard → Pages → Settings → Environment Variables

### Manual Deployment

1. **Build for Production:**

```bash
npm run build
```

2. **Upload `dist/` Directory:**

Upload the contents of the `dist/` directory to your hosting provider:
- **Static Hosting:** Upload to web root
- **CDN:** Upload to CDN origin
- **Server:** Copy to web server directory (e.g., `/var/www/html`)

3. **Configure Web Server:**

**Nginx Example:**

```nginx
server {
    listen 80;
    server_name jengahacks.com;
    root /var/www/jengahacks/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Apache Example:**

```apache
<VirtualHost *:80>
    ServerName jengahacks.com
    DocumentRoot /var/www/jengahacks/dist

    <Directory /var/www/jengahacks/dist>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    # Rewrite rules for React Router
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]

    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
</VirtualHost>
```

## Environment Configuration

### Required Variables

```env
# Supabase
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=<your-recaptcha-site-key>

# Edge Functions
VITE_USE_REGISTRATION_EDGE_FUNCTION=true
```

### Optional Variables

```env
# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_GA_ENABLED=true

# Admin
VITE_ADMIN_PASSWORD=<secure-password>

# Discord
VITE_DISCORD_URL=https://discord.gg/jengahacks
```

### Production Checklist

- [ ] All environment variables set
- [ ] `VITE_USE_REGISTRATION_EDGE_FUNCTION=true` (for IP rate limiting)
- [ ] `VITE_GA_ENABLED=true` (if using analytics)
- [ ] Strong `VITE_ADMIN_PASSWORD` set
- [ ] reCAPTCHA site key configured for production domain
- [ ] Google Analytics configured for production domain

## Post-Deployment Verification

### 1. Frontend Checks

- [ ] Website loads correctly
- [ ] All pages accessible (Home, Blog, Sponsorship, Admin)
- [ ] Navigation works
- [ ] Responsive design works on mobile
- [ ] Images and assets load
- [ ] No console errors

### 2. Registration Flow

- [ ] Registration form displays
- [ ] Form validation works
- [ ] reCAPTCHA loads and verifies
- [ ] Registration submission succeeds
- [ ] Success message displays
- [ ] Rate limiting works (test with multiple attempts)

### 3. Database Checks

```bash
# Connect to Supabase database
supabase db connect

# Verify registrations table exists
SELECT * FROM registrations LIMIT 1;

# Check rate limiting functions
SELECT check_registration_rate_limit('test@example.com', NULL);
```

### 4. Edge Functions

Test each Edge Function:

```bash
# Test register-with-ip
curl -X POST https://<project-ref>.supabase.co/functions/v1/register-with-ip \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"full_name":"Test User","email":"test@example.com"}'

# Test verify-recaptcha
curl -X POST https://<project-ref>.supabase.co/functions/v1/verify-recaptcha \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"token":"<recaptcha-token>"}'

# Test get-resume-url (requires admin password)
curl -X POST https://<project-ref>.supabase.co/functions/v1/get-resume-url \
  -H "Content-Type: application/json" \
  -H "apikey: <anon-key>" \
  -d '{"resume_path":"test.pdf","admin_password":"<admin-password>"}'
```

### 5. Storage

- [ ] Resume upload works
- [ ] File size validation (5MB limit)
- [ ] File type validation (PDF only)
- [ ] Files stored in private bucket
- [ ] Signed URLs work for admin access

### 6. Analytics

- [ ] Google Analytics loads (if enabled)
- [ ] Page views tracked
- [ ] Events tracked (registration, button clicks, etc.)

### 7. Security Checks

- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] CORS configured correctly
- [ ] Rate limiting active
- [ ] Admin endpoints protected
- [ ] No sensitive data exposed

## CI/CD Setup

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
          VITE_RECAPTCHA_SITE_KEY: ${{ secrets.VITE_RECAPTCHA_SITE_KEY }}
          VITE_USE_REGISTRATION_EDGE_FUNCTION: ${{ secrets.VITE_USE_REGISTRATION_EDGE_FUNCTION }}
          VITE_GA_MEASUREMENT_ID: ${{ secrets.VITE_GA_MEASUREMENT_ID }}
          VITE_GA_ENABLED: ${{ secrets.VITE_GA_ENABLED }}
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### GitLab CI

Create `.gitlab-ci.yml`:

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: node:18
  script:
    - npm ci
    - npm run lint
    - npm run test:run

build:
  stage: build
  image: node:18
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

deploy:
  stage: deploy
  image: node:18
  script:
    - npm install -g netlify-cli
    - netlify deploy --prod --dir=dist
  only:
    - main
  environment:
    name: production
```

## Troubleshooting

### Build Failures

**Issue:** Build fails with environment variable errors

**Solution:**
- Ensure all required environment variables are set
- Check variable names match exactly (case-sensitive)
- Verify no trailing spaces in values

**Issue:** TypeScript errors during build

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Database Issues

**Issue:** Migrations fail

**Solution:**
```bash
# Check migration status
supabase migration list

# Reset and reapply (⚠️ destructive)
supabase db reset

# Or apply migrations manually via Supabase Dashboard SQL Editor
```

**Issue:** RLS policies blocking operations

**Solution:**
- Verify policies are correctly applied
- Check service role key is used for admin operations
- Review policy conditions in Supabase Dashboard

### Edge Function Issues

**Issue:** Functions return 500 errors

**Solution:**
- Check function logs: `supabase functions logs <function-name>`
- Verify secrets are set: `supabase secrets list`
- Test locally: `supabase functions serve`

**Issue:** CORS errors

**Solution:**
- Verify CORS headers in Edge Function code
- Check allowed origins in Supabase Dashboard
- Ensure `apikey` header is included

### Frontend Issues

**Issue:** Blank page after deployment

**Solution:**
- Check browser console for errors
- Verify `index.html` is in root of `dist/`
- Ensure routing is configured (SPA redirect rules)
- Check environment variables are set correctly

**Issue:** API calls fail

**Solution:**
- Verify Supabase URL and keys are correct
- Check CORS configuration
- Verify Edge Functions are deployed
- Test API endpoints directly with curl

### Performance Issues

**Issue:** Slow page loads

**Solution:**
- Enable CDN caching for static assets
- Optimize images (use WebP format)
- Enable gzip/brotli compression
- Check bundle size: `npm run build` and review output

**Issue:** Large bundle size

**Solution:**
```bash
# Analyze bundle
npm run build
# Check dist/ directory sizes

# Use Vite bundle analyzer (if installed)
npm install -D rollup-plugin-visualizer
```

### Security Issues

**Issue:** Environment variables exposed

**Solution:**
- Never commit `.env` files
- Use hosting platform secrets management
- Verify variables are prefixed with `VITE_` for client-side
- Use server-side variables for sensitive data

**Issue:** reCAPTCHA not working

**Solution:**
- Verify site key is correct
- Check domain is added to reCAPTCHA allowed domains
- Ensure secret key is set in Edge Function secrets
- Test reCAPTCHA verification endpoint directly

## Rollback Procedure

If deployment fails:

1. **Frontend Rollback:**
   - Revert to previous deployment in hosting platform
   - Or redeploy previous Git commit

2. **Database Rollback:**
   ```bash
   # Rollback specific migration
   supabase migration down <migration-name>
   
   # Or restore from backup
   supabase db restore <backup-file>
   ```

3. **Edge Function Rollback:**
   ```bash
   # Redeploy previous version
   supabase functions deploy <function-name> --version <previous-version>
   ```

## Support

For deployment issues:
- Check [API Documentation](./API.md) for endpoint details
- Review [README.md](./README.md) for setup instructions
- Check Supabase Dashboard logs
- Review hosting platform logs
- Open an issue on the repository

---

**Last Updated:** January 2026
**Deployment Version:** 1.0.0


