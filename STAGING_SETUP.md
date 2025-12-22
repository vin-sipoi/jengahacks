# Staging Environment Setup

Complete guide for setting up and managing a staging environment for JengaHacks Hub.

## Overview

The staging environment is a production-like environment used for testing changes before deploying to production. It mirrors production as closely as possible while allowing safe experimentation.

## Architecture

```
┌─────────────────┐         ┌─────────────────┐
│   Production    │         │    Staging      │
├─────────────────┤         ├─────────────────┤
│ Supabase Proj A │         │ Supabase Proj B │
│ Domain: prod    │         │ Domain: staging │
│ Branch: main    │         │ Branch: develop │
└─────────────────┘         └─────────────────┘
```

## Prerequisites

- ✅ Production environment already set up
- ✅ GitHub repository with branch protection
- ✅ Access to Supabase Dashboard
- ✅ Hosting platform account (Vercel, Netlify, etc.)

## Step 1: Create Staging Supabase Project

### 1.1 Create New Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click **New Project**
3. Fill in details:
   - **Name:** `jengahacks-staging` (or similar)
   - **Database Password:** Use a strong password (save it securely)
   - **Region:** Same as production (for consistency)
   - **Pricing Plan:** Free tier is fine for staging

### 1.2 Link Project Locally

```bash
# Link to staging project
supabase link --project-ref <staging-project-ref>

# Verify link
supabase projects list
```

### 1.3 Apply Migrations

```bash
# Ensure you're linked to staging project
supabase link --project-ref <staging-project-ref>

# Apply all migrations
supabase db push

# Verify migrations
supabase migration list
```

### 1.4 Set Up Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Create bucket: `resumes`
3. Set as **Private** (not public)
4. Configure policies (same as production)

Or use SQL:
```sql
-- Create storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;
```

### 1.5 Deploy Edge Functions

```bash
# Deploy all Edge Functions to staging
supabase functions deploy register-with-ip --project-ref <staging-project-ref>
supabase functions deploy verify-recaptcha --project-ref <staging-project-ref>
supabase functions deploy get-resume-url --project-ref <staging-project-ref>
```

### 1.6 Set Edge Function Secrets

```bash
# Set reCAPTCHA secret (use staging/test keys)
supabase secrets set RECAPTCHA_SECRET_KEY=<staging-secret-key> --project-ref <staging-project-ref>

# Set admin password (can be different from production)
supabase secrets set ADMIN_PASSWORD=<staging-admin-password> --project-ref <staging-project-ref>
```

## Step 2: Configure Staging Environment Variables

### 2.1 Create Staging Environment File

Create `.env.staging` (do not commit to Git):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://<staging-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<staging-anon-key>

# reCAPTCHA (use test keys for staging)
VITE_RECAPTCHA_SITE_KEY=<staging-site-key>

# Google Analytics (optional - use separate property for staging)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Feature Flags
VITE_USE_REGISTRATION_EDGE_FUNCTION=true

# Monitoring (enable for staging)
VITE_MONITORING_ENABLED=true
VITE_MONITORING_HEALTH=true
VITE_MONITORING_ALERTS=false  # Disable alerts for staging

# Sentry (use separate DSN for staging)
VITE_SENTRY_ENABLED=true
VITE_SENTRY_DSN=<staging-sentry-dsn>
VITE_SENTRY_ENVIRONMENT=staging

# Discord (can use same URL or separate staging channel)
VITE_DISCORD_URL=https://discord.gg/jengahacks-staging
```

### 2.2 Get Supabase Keys

1. Go to Supabase Dashboard → Settings → API
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Save securely (for scripts, not for client)

### 2.3 Get reCAPTCHA Test Keys

For staging, use Google reCAPTCHA test keys (always pass):

- **Site Key:** `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
- **Secret Key:** `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`

These keys always pass validation, perfect for testing.

## Step 3: Set Up Staging Hosting

### 3.1 Vercel Setup

1. Go to [Vercel Dashboard](https://vercel.com)
2. Import your repository
3. Configure:
   - **Project Name:** `jengahacks-staging`
   - **Framework Preset:** Vite
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm ci`

4. Add Environment Variables:
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.staging`
   - Set to **Preview** environment (or create `staging` environment)

5. Configure Branch:
   - Go to Settings → Git
   - Set **Production Branch:** `main`
   - Set **Preview Branch:** `develop` (or create staging branch)

### 3.2 Netlify Setup

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Add new site from Git
3. Configure:
   - **Branch to deploy:** `develop` or `staging`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`

4. Add Environment Variables:
   - Go to Site Settings → Environment Variables
   - Add all variables from `.env.staging`
   - Set **Scopes:** Deploy contexts → Branch deploys → `develop` or `staging`

### 3.3 Custom Domain (Optional)

Set up a staging subdomain:
- `staging.jengahacks.com`
- `staging-jengahacks.vercel.app` (Vercel default)
- `staging--jengahacks.netlify.app` (Netlify default)

## Step 4: Set Up GitHub Actions for Staging

### 4.1 Create Staging Deployment Workflow

See `.github/workflows/deploy-staging.yml` (created below)

### 4.2 Configure GitHub Secrets

Go to Repository Settings → Secrets and variables → Actions:

**Required Secrets:**
- `STAGING_SUPABASE_URL`
- `STAGING_SUPABASE_ANON_KEY`
- `STAGING_RECAPTCHA_SITE_KEY`
- `STAGING_RECAPTCHA_SECRET_KEY`
- `STAGING_SENTRY_DSN` (optional)
- `STAGING_GA_MEASUREMENT_ID` (optional)

**Hosting Platform Secrets:**
- `VERCEL_TOKEN` and `VERCEL_PROJECT_ID` (for Vercel)
- `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` (for Netlify)

## Step 5: Database Seeding (Optional)

### 5.1 Create Seed Data

Create `supabase/seed.sql`:

```sql
-- Seed staging database with test data
-- Only run this on staging, never on production!

-- Insert test registrations
INSERT INTO public.registrations (
  full_name,
  email,
  whatsapp_number,
  linkedin_url,
  status,
  is_waitlist
) VALUES
  ('Test User 1', 'test1@example.com', '+254700000001', 'https://linkedin.com/in/test1', 'active', false),
  ('Test User 2', 'test2@example.com', '+254700000002', 'https://linkedin.com/in/test2', 'active', false),
  ('Waitlist User', 'waitlist@example.com', '+254700000003', NULL, 'active', true)
ON CONFLICT (email) DO NOTHING;
```

### 5.2 Run Seed Script

```bash
# Link to staging
supabase link --project-ref <staging-project-ref>

# Run seed
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" < supabase/seed.sql
```

## Step 6: Branch Strategy

### Recommended Workflow

```
main (production)
  └── develop (staging)
      └── feature/* (feature branches)
```

**Branch Rules:**
- `main` → Production (protected, requires PR)
- `develop` → Staging (auto-deploys)
- `feature/*` → Feature branches (preview deployments)

### GitHub Branch Protection

1. Go to Repository Settings → Branches
2. Add rule for `main`:
   - ✅ Require pull request reviews
   - ✅ Require status checks to pass
   - ✅ Require branches to be up to date
   - ✅ Include administrators

3. Add rule for `develop`:
   - ✅ Require pull request reviews (optional)
   - ✅ Allow force pushes (for hotfixes)

## Step 7: Testing Staging

### 7.1 Smoke Tests

After deploying to staging, verify:

- [ ] Homepage loads correctly
- [ ] Registration form works
- [ ] Form validation works
- [ ] CAPTCHA works (or always passes with test keys)
- [ ] File upload works
- [ ] Database writes succeed
- [ ] Admin dashboard accessible
- [ ] All routes work

### 7.2 Integration Tests

Run full test suite against staging:

```bash
# Set staging environment variables
export VITE_SUPABASE_URL=https://<staging-project>.supabase.co
export VITE_SUPABASE_ANON_KEY=<staging-anon-key>

# Run tests
npm run test:run
npm run test:e2e
```

## Step 8: Monitoring Staging

### 8.1 Set Up Staging Monitoring

- **Sentry:** Create separate project for staging
- **Google Analytics:** Use separate property or filter by hostname
- **Uptime Monitoring:** Monitor staging URL separately

### 8.2 Health Checks

Monitor staging health endpoint:
- URL: `https://staging.jengahacks.com/health`
- Interval: 5 minutes (less critical than production)

## Step 9: Data Management

### 9.1 Staging Data Policy

**Best Practices:**
- Use test/anonymized data only
- Never use real user data in staging
- Reset staging database periodically
- Use separate reCAPTCHA keys (test keys)

### 9.2 Database Reset

Reset staging database when needed:

```bash
# Link to staging
supabase link --project-ref <staging-project-ref>

# Reset database (WARNING: Deletes all data)
supabase db reset

# Re-apply migrations
supabase db push

# Re-seed if needed
psql "postgresql://..." < supabase/seed.sql
```

## Step 10: Promotion to Production

### 10.1 Pre-Promotion Checklist

Before promoting staging to production:

- [ ] All tests passing
- [ ] Staging tested and verified
- [ ] Code reviewed and approved
- [ ] Database migrations tested on staging
- [ ] Edge Functions tested on staging
- [ ] Performance acceptable
- [ ] No breaking changes
- [ ] Documentation updated

### 10.2 Promotion Process

1. **Merge to Main:**
   ```bash
   git checkout main
   git pull origin main
   git merge develop
   git push origin main
   ```

2. **Production Deployment:**
   - Automatic via GitHub Actions (if configured)
   - Or manual deployment following `DEPLOYMENT.md`

3. **Verify Production:**
   - Check production URL
   - Run smoke tests
   - Monitor error logs
   - Check Sentry for errors

## Environment Comparison

| Aspect | Production | Staging |
|--------|-----------|---------|
| **Supabase Project** | Production project | Staging project |
| **Domain** | `jengahacks.com` | `staging.jengahacks.com` |
| **Branch** | `main` | `develop` |
| **reCAPTCHA** | Production keys | Test keys |
| **Sentry** | Production DSN | Staging DSN |
| **Analytics** | Production property | Staging property |
| **Monitoring** | Full alerts | Reduced alerts |
| **Data** | Real user data | Test data only |
| **Backups** | Daily automated | Weekly manual |

## Troubleshooting

### Staging Deployment Fails

1. Check GitHub Actions logs
2. Verify environment variables are set
3. Check Supabase project is accessible
4. Verify build succeeds locally with staging vars

### Database Migrations Fail

1. Check migration order
2. Verify staging database state
3. Check for conflicts with existing data
4. Review migration SQL for errors

### Edge Functions Not Working

1. Verify functions are deployed to staging project
2. Check secrets are set correctly
3. Review function logs in Supabase Dashboard
4. Test functions locally with staging config

## Related Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Environment Variables](./ENVIRONMENT_VARIABLES.md) - Environment variable reference
- [Backup Strategy](./BACKUP_STRATEGY.md) - Backup procedures
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues

## Quick Reference

### Staging URLs

- **Frontend:** `https://staging.jengahacks.com` (or your staging URL)
- **Health Check:** `https://staging.jengahacks.com/health`
- **Admin:** `https://staging.jengahacks.com/admin`

### Useful Commands

```bash
# Link to staging
supabase link --project-ref <staging-ref>

# Deploy functions to staging
supabase functions deploy <function-name> --project-ref <staging-ref>

# Check staging database
supabase db pull --project-ref <staging-ref>

# View staging logs
supabase functions logs <function-name> --project-ref <staging-ref>
```

