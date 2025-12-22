# Troubleshooting Guide

Comprehensive guide for resolving common issues when developing, deploying, or using the JengaHacks 2026 application.

## Table of Contents

- [Quick Diagnosis](#quick-diagnosis)
- [Setup & Installation](#setup--installation)
- [Development Server](#development-server)
- [Build & Deployment](#build--deployment)
- [Database & Supabase](#database--supabase)
- [Edge Functions](#edge-functions)
- [Registration Form](#registration-form)
- [Authentication & Security](#authentication--security)
- [Performance Issues](#performance-issues)
- [Browser Compatibility](#browser-compatibility)
- [Common Error Messages](#common-error-messages)
- [Getting Help](#getting-help)

## Quick Diagnosis

### Check These First

1. **Node.js version:**
   ```bash
   node --version  # Should be v18 or higher
   ```

2. **Dependencies installed:**
   ```bash
   ls node_modules  # Should exist and contain packages
   ```

3. **Environment variables set:**
   ```bash
   cat .env  # Should contain VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
   ```

4. **Port availability:**
   ```bash
   lsof -i :8080  # Check if port 8080 is in use
   ```

5. **Build succeeds:**
   ```bash
   npm run build  # Should complete without errors
   ```

## Setup & Installation

### Issue: `npm install` fails

**Symptoms:**
- Package installation errors
- Permission denied errors
- Network timeout errors

**Solutions:**

1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Must be v18+
   # If outdated, update using nvm:
   nvm install 18
   nvm use 18
   ```

3. **Use different package manager:**
   ```bash
   # Try with yarn
   yarn install
   
   # Or bun
   bun install
   ```

4. **Check network/firewall:**
   - Ensure npm registry is accessible
   - Check corporate firewall settings
   - Try different network

5. **Permission issues (Linux/Mac):**
   ```bash
   # Don't use sudo with npm
   # Fix npm permissions instead:
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   export PATH=~/.npm-global/bin:$PATH
   ```

---

### Issue: Missing `.env` file

**Symptoms:**
- `Missing VITE_SUPABASE_URL environment variable` error
- Application fails to start
- Supabase connection errors

**Solutions:**

1. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in required variables:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   VITE_RECAPTCHA_SITE_KEY=your-site-key
   ```

3. **Verify file location:**
   - `.env` must be in project root (same directory as `package.json`)
   - Check for typos: `.env` not `.env.local` or `.env.development`

4. **Restart dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

### Issue: TypeScript errors on install

**Symptoms:**
- Type errors during installation
- `@types/*` package errors

**Solutions:**

1. **Install TypeScript globally:**
   ```bash
   npm install -g typescript
   ```

2. **Clear and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check TypeScript version:**
   ```bash
   npx tsc --version
   # Should match package.json version
   ```

## Development Server

### Issue: Port 8080 already in use

**Symptoms:**
- `Port 8080 is already in use` error
- Server won't start

**Solutions:**

1. **Find and kill process:**
   ```bash
   # Find process using port 8080
   lsof -i :8080
   # Kill process (replace PID with actual process ID)
   kill -9 <PID>
   ```

2. **Use different port:**
   ```bash
   # Edit vite.config.ts or use CLI flag
   npm run dev -- --port 3000
   ```

3. **Change default port in `vite.config.ts`:**
   ```typescript
   export default defineConfig({
     server: {
       port: 3000,  // Change default port
     },
   });
   ```

---

### Issue: Hot Module Replacement (HMR) not working

**Symptoms:**
- Changes not reflecting automatically
- Need to manually refresh browser
- Console shows HMR errors

**Solutions:**

1. **Check browser console:**
   - Look for WebSocket connection errors
   - Verify no firewall blocking WebSocket connections

2. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Clear browser cache and reload

3. **Restart dev server:**
   ```bash
   # Stop server and restart
   npm run dev
   ```

4. **Check file watchers:**
   ```bash
   # Increase file watcher limit (Linux)
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

---

### Issue: Dev server crashes on startup

**Symptoms:**
- Server starts then immediately crashes
- Error messages in terminal
- Port becomes available again

**Solutions:**

1. **Check error message:**
   - Look for specific error in terminal output
   - Common: Missing environment variables, syntax errors

2. **Verify environment variables:**
   ```bash
   # Check .env file exists and has required vars
   cat .env | grep VITE_SUPABASE_URL
   ```

3. **Check for syntax errors:**
   ```bash
   npm run lint
   ```

4. **Clear cache and restart:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

### Issue: Slow dev server performance

**Symptoms:**
- Long compilation times
- Slow page loads
- High CPU usage

**Solutions:**

1. **Reduce file watching:**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       watch: {
         ignored: ['**/node_modules/**', '**/dist/**'],
       },
     },
   });
   ```

2. **Check system resources:**
   - Close unnecessary applications
   - Increase available RAM
   - Check disk space

3. **Use faster package manager:**
   ```bash
   # Try bun instead of npm
   bun install
   bun run dev
   ```

## Build & Deployment

### Issue: Build fails with TypeScript errors

**Symptoms:**
- Type errors during build
- `npm run build` fails
- Type mismatches

**Solutions:**

1. **Check TypeScript configuration:**
   ```bash
   npx tsc --noEmit  # Check types without building
   ```

2. **Fix type errors:**
   - Review error messages
   - Add proper types or use `as` assertions (sparingly)
   - Check `tsconfig.json` settings

3. **Ignore type errors (temporary):**
   ```typescript
   // vite.config.ts
   export default defineConfig({
     build: {
       rollupOptions: {
         // Only for temporary fixes
       },
     },
   });
   ```

---

### Issue: Build succeeds but app doesn't work

**Symptoms:**
- Build completes successfully
- App loads but features don't work
- Console errors in browser

**Solutions:**

1. **Check environment variables:**
   - Variables must be set at **build time**
   - Verify variables in hosting platform
   - Rebuild after setting variables

2. **Check browser console:**
   - Look for JavaScript errors
   - Check network tab for failed requests
   - Verify API endpoints are accessible

3. **Test production build locally:**
   ```bash
   npm run build
   npm run preview
   # Test at http://localhost:4173
   ```

4. **Verify routing:**
   - Ensure hosting platform configured for SPA routing
   - Check redirect rules (all routes → index.html)

---

### Issue: Environment variables not working in production

**Symptoms:**
- Variables work in development but not production
- `undefined` values in production build
- Features dependent on env vars don't work

**Solutions:**

1. **Verify variable names:**
   - Must start with `VITE_` for client-side
   - Case-sensitive
   - No trailing spaces

2. **Set in hosting platform:**
   - **Vercel:** Project Settings → Environment Variables
   - **Netlify:** Site Settings → Environment Variables
   - **GitHub Actions:** Repository Secrets

3. **Rebuild after setting variables:**
   - Variables are embedded at build time
   - Must rebuild after adding/changing variables

4. **Check build logs:**
   - Verify variables are present during build
   - Look for warnings about missing variables

---

### Issue: Large bundle size

**Symptoms:**
- Slow page loads
- Large `dist/` directory
- Performance warnings

**Solutions:**

1. **Analyze bundle:**
   ```bash
   npm run build
   # Check dist/ directory sizes
   ls -lh dist/assets/
   ```

2. **Enable code splitting:**
   ```typescript
   // Use React.lazy for route-based splitting
   const Blog = lazy(() => import('./pages/Blog'));
   ```

3. **Optimize images:**
   - Use WebP format
   - Compress images before adding
   - Use appropriate sizes

4. **Check for duplicate dependencies:**
   ```bash
   npm ls  # Check for duplicate packages
   ```

## Database & Supabase

### Issue: Cannot connect to Supabase

**Symptoms:**
- `Failed to fetch` errors
- Network errors in console
- Supabase client initialization fails

**Solutions:**

1. **Verify credentials:**
   ```bash
   # Check .env file
   cat .env | grep VITE_SUPABASE
   ```

2. **Test connection:**
   ```typescript
   // In browser console or component
   import { supabase } from '@/integrations/supabase/client';
   const { data, error } = await supabase.from('registrations').select('count');
   console.log('Connection test:', { data, error });
   ```

3. **Check Supabase project status:**
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Verify project is active
   - Check for service interruptions

4. **Verify CORS settings:**
   - Supabase allows all origins by default
   - Check if custom CORS rules are blocking

5. **Check network/firewall:**
   - Ensure `*.supabase.co` is accessible
   - Check corporate firewall settings

---

### Issue: RLS (Row Level Security) blocking operations

**Symptoms:**
- Insert/select operations fail
- "new row violates row-level security policy" error
- Operations work in Supabase Dashboard but not in app

**Solutions:**

1. **Check RLS policies:**
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM pg_policies WHERE tablename = 'registrations';
   ```

2. **Verify policy conditions:**
   - Policies must allow the operation
   - Check policy `USING` and `WITH CHECK` clauses

3. **Test with service role (admin):**
   ```typescript
   // Only for testing - never expose service role key to client
   const adminClient = createClient(url, serviceRoleKey);
   ```

4. **Review migration files:**
   - Ensure migrations applied correctly
   - Check policy creation in migrations

---

### Issue: Database migrations fail

**Symptoms:**
- Migration errors when applying
- "relation already exists" errors
- Migration rollback issues

**Solutions:**

1. **Check migration status:**
   ```bash
   supabase migration list
   ```

2. **Apply migrations manually:**
   - Copy SQL from migration file
   - Run in Supabase SQL Editor
   - Check for errors

3. **Reset database (⚠️ destructive):**
   ```bash
   supabase db reset  # Only for development!
   ```

4. **Fix migration conflicts:**
   - Check for duplicate migrations
   - Verify migration timestamps
   - Rename conflicting migrations

---

### Issue: Storage upload fails

**Symptoms:**
- Resume upload fails
- "Bucket not found" error
- Permission denied errors

**Solutions:**

1. **Verify bucket exists:**
   - Go to Supabase Dashboard → Storage
   - Check `resumes` bucket exists
   - Verify bucket is not public

2. **Check storage policies:**
   ```sql
   -- Check INSERT policy
   SELECT * FROM storage.policies WHERE bucket_id = 'resumes';
   ```

3. **Verify file constraints:**
   - File size ≤ 5MB
   - File type is PDF
   - Filename is valid

4. **Test upload directly:**
   ```typescript
   const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
   const { data, error } = await supabase.storage
     .from('resumes')
     .upload('test.pdf', file);
   console.log({ data, error });
   ```

## Edge Functions

### Issue: Edge Function returns 404

**Symptoms:**
- Function not found error
- 404 response from function endpoint

**Solutions:**

1. **Verify function is deployed:**
   ```bash
   supabase functions list
   ```

2. **Check function name:**
   - Must match exactly (case-sensitive)
   - No typos in function name

3. **Redeploy function:**
   ```bash
   supabase functions deploy <function-name>
   ```

4. **Check function URL:**
   ```typescript
   // Correct format
   const url = `https://${projectRef}.supabase.co/functions/v1/${functionName}`;
   ```

---

### Issue: Edge Function returns 500 error

**Symptoms:**
- Internal server error
- Function crashes
- No specific error message

**Solutions:**

1. **Check function logs:**
   ```bash
   supabase functions logs <function-name>
   ```

2. **Test locally:**
   ```bash
   supabase functions serve <function-name>
   # Test at http://localhost:54321/functions/v1/<function-name>
   ```

3. **Verify secrets:**
   ```bash
   supabase secrets list
   # Ensure required secrets are set
   ```

4. **Check function code:**
   - Look for unhandled errors
   - Verify error handling
   - Check async/await usage

---

### Issue: Edge Function CORS errors

**Symptoms:**
- CORS policy errors in browser
- Preflight requests fail
- "Access-Control-Allow-Origin" errors

**Solutions:**

1. **Verify CORS headers in function:**
   ```typescript
   const corsHeaders = {
     "Access-Control-Allow-Origin": "*",
     "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
   };
   ```

2. **Handle OPTIONS requests:**
   ```typescript
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
   ```

3. **Check Supabase CORS settings:**
   - Go to Project Settings → API
   - Verify CORS configuration

---

### Issue: Edge Function can't access secrets

**Symptoms:**
- `undefined` secret values
- Function fails when accessing secrets
- Secret not found errors

**Solutions:**

1. **Verify secret is set:**
   ```bash
   supabase secrets list
   ```

2. **Set secret correctly:**
   ```bash
   supabase secrets set SECRET_NAME=secret_value
   ```

3. **Redeploy after setting secret:**
   ```bash
   supabase functions deploy <function-name>
   ```

4. **Check secret name:**
   - Must match exactly (case-sensitive)
   - No typos in secret name

## Registration Form

### Issue: Form validation not working

**Symptoms:**
- Invalid data accepted
- Validation errors not showing
- Form submits with errors

**Solutions:**

1. **Check validation functions:**
   ```typescript
   // Test validation directly
   import { isValidEmail, isValidFullName } from '@/lib/security';
   console.log(isValidEmail('test@example.com')); // Should be true
   ```

2. **Verify form state:**
   - Check `errors` state is being set
   - Verify `touched` state updates
   - Check error display logic

3. **Check browser console:**
   - Look for JavaScript errors
   - Verify validation functions are imported

4. **Test validation manually:**
   ```bash
   npm run test -- security.test.ts
   ```

---

### Issue: reCAPTCHA not loading

**Symptoms:**
- CAPTCHA widget doesn't appear
- "reCAPTCHA site key is invalid" error
- CAPTCHA errors in console

**Solutions:**

1. **Verify site key:**
   ```bash
   # Check .env file
   echo $VITE_RECAPTCHA_SITE_KEY
   ```

2. **Check domain configuration:**
   - Go to [reCAPTCHA Admin](https://www.google.com/recaptcha/admin)
   - Verify domain is in allowed domains
   - Add `localhost` for development

3. **Check network:**
   - Ensure `google.com` is accessible
   - Check firewall/proxy settings
   - Verify no ad blockers blocking reCAPTCHA

4. **Test with test keys:**
   ```env
   # Google's test keys (always pass)
   VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
   ```

---

### Issue: File upload fails

**Symptoms:**
- Resume upload fails
- File size/type errors
- Upload progress stuck

**Solutions:**

1. **Check file constraints:**
   - File size ≤ 5MB
   - File type: PDF only
   - Valid file extension (.pdf)

2. **Verify storage bucket:**
   - Bucket exists and is accessible
   - Storage policies allow uploads
   - Check Supabase Dashboard → Storage

3. **Test upload directly:**
   ```typescript
   const testFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
   const { data, error } = await supabase.storage
     .from('resumes')
     .upload('test.pdf', testFile);
   ```

4. **Check browser console:**
   - Look for specific error messages
   - Check network tab for failed requests

---

### Issue: Rate limiting too strict

**Symptoms:**
- Legitimate users blocked
- Rate limit errors for new users
- False positives

**Solutions:**

1. **Check rate limit settings:**
   - Email limit: 3 per hour
   - IP limit: 5 per hour
   - Verify these are appropriate

2. **Test rate limiting:**
   ```sql
   -- Check recent registrations
   SELECT email, ip_address, created_at 
   FROM registrations 
   ORDER BY created_at DESC 
   LIMIT 10;
   ```

3. **Adjust limits (if needed):**
   ```sql
   -- Edit migration file or create new migration
   -- Update rate limit function thresholds
   ```

4. **Clear rate limit (development only):**
   ```bash
   # Clear localStorage in browser
   localStorage.removeItem('jengahacks_rate_limit');
   ```

## Authentication & Security

### Issue: Admin portal not accessible

**Symptoms:**
- Admin page redirects
- Password prompt doesn't work
- Access denied errors

**Solutions:**

1. **Check admin password:**
   ```bash
   # Verify password in .env
   echo $VITE_ADMIN_PASSWORD
   ```

2. **Test password:**
   - Default: `admin123` (development)
   - Must match `VITE_ADMIN_PASSWORD` or Edge Function secret

3. **Check session storage:**
   ```javascript
   // In browser console
   sessionStorage.getItem('admin_authenticated')
   ```

4. **Clear and retry:**
   ```javascript
   // Clear admin session
   sessionStorage.removeItem('admin_authenticated');
   // Reload page and try again
   ```

---

### Issue: CORS errors

**Symptoms:**
- "CORS policy" errors in console
- API requests blocked
- Preflight requests fail

**Solutions:**

1. **Check Edge Function CORS headers:**
   - Verify `Access-Control-Allow-Origin` header
   - Ensure OPTIONS requests handled

2. **Check Supabase CORS:**
   - Supabase allows all origins by default
   - Verify no custom restrictions

3. **Test with curl:**
   ```bash
   curl -X OPTIONS https://project.supabase.co/functions/v1/function-name \
     -H "Origin: http://localhost:8080" \
     -v
   ```

---

### Issue: Security warnings in browser

**Symptoms:**
- Mixed content warnings
- Insecure connection warnings
- Security headers missing

**Solutions:**

1. **Use HTTPS:**
   - Ensure production uses HTTPS
   - Configure SSL certificate
   - Redirect HTTP to HTTPS

2. **Add security headers:**
   - Configure in hosting platform
   - Or via web server (Nginx/Apache)
   - See [Deployment Guide](./DEPLOYMENT.md) for examples

3. **Check mixed content:**
   - Ensure all resources use HTTPS
   - No HTTP links in production

## Performance Issues

### Issue: Slow page loads

**Symptoms:**
- Long initial load time
- Slow navigation
- High Time to Interactive (TTI)

**Solutions:**

1. **Check bundle size:**
   ```bash
   npm run build
   # Review dist/ directory sizes
   ```

2. **Enable code splitting:**
   ```typescript
   // Use React.lazy for routes
   const Blog = lazy(() => import('./pages/Blog'));
   ```

3. **Optimize images:**
   - Use WebP format
   - Compress images
   - Use appropriate sizes

4. **Check network:**
   - Verify CDN is working
   - Check hosting platform performance
   - Review network tab in DevTools

---

### Issue: High memory usage

**Symptoms:**
- Browser becomes slow
- High memory consumption
- Browser crashes

**Solutions:**

1. **Check for memory leaks:**
   - Use Chrome DevTools Memory Profiler
   - Look for detached DOM nodes
   - Check for event listener leaks

2. **Review component cleanup:**
   ```typescript
   useEffect(() => {
     // Setup
     return () => {
       // Cleanup - remove listeners, cancel requests
     };
   }, []);
   ```

3. **Limit data fetching:**
   - Use pagination
   - Limit query results
   - Cache data appropriately

## Browser Compatibility

### Issue: App doesn't work in older browsers

**Symptoms:**
- Features broken in IE11 or older browsers
- JavaScript errors
- Styling issues

**Solutions:**

1. **Check browser support:**
   - Review `.browserslistrc` configuration
   - Verify build target in `vite.config.ts`

2. **Add polyfills:**
   - Check `src/lib/polyfills.ts`
   - Ensure polyfills are imported in `main.tsx`

3. **Test in target browsers:**
   - Use BrowserStack or similar
   - Test on actual devices
   - Check console for errors

---

### Issue: Features not working on mobile

**Symptoms:**
- Touch events not working
- Layout broken on mobile
- Form inputs not accessible

**Solutions:**

1. **Check responsive design:**
   - Test on actual devices
   - Use browser DevTools device emulation
   - Verify Tailwind responsive classes

2. **Check viewport meta tag:**
   ```html
   <!-- Should be in index.html -->
   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
   ```

3. **Test touch interactions:**
   - Verify buttons are tappable
   - Check form inputs work
   - Test scrolling behavior

## Common Error Messages

### "Missing VITE_SUPABASE_URL environment variable"

**Cause:** Environment variable not set or incorrectly named.

**Solution:**
1. Check `.env` file exists in project root
2. Verify variable name: `VITE_SUPABASE_URL` (case-sensitive)
3. Ensure no trailing spaces
4. Restart dev server

---

### "Rate limit exceeded"

**Cause:** Too many registration attempts.

**Solution:**
1. Wait for rate limit window to expire (1 hour)
2. Clear client-side rate limit: `localStorage.removeItem('jengahacks_rate_limit')`
3. Check if legitimate limit or abuse
4. Adjust limits if needed (database migration)

---

### "This email is already registered"

**Cause:** Email address already exists in database.

**Solution:**
1. Use different email address
2. Check if duplicate is legitimate
3. Admin can verify in Supabase Dashboard
4. Cannot register same email twice

---

### "CAPTCHA verification failed"

**Cause:** reCAPTCHA token invalid or expired.

**Solution:**
1. Complete CAPTCHA again
2. Check reCAPTCHA site key is correct
3. Verify domain is in allowed domains
4. Check network connectivity to Google

---

### "Failed to submit registration"

**Cause:** Generic error - check specific error message.

**Solution:**
1. Check browser console for details
2. Verify all required fields filled
3. Check network connectivity
4. Verify Supabase connection
5. Check Edge Function logs (if using)

---

### "Resume upload failed"

**Cause:** File upload to storage failed.

**Solution:**
1. Check file size (must be ≤ 5MB)
2. Verify file is PDF format
3. Check storage bucket exists
4. Verify storage policies allow uploads
5. Check network connectivity

---

### "Unauthorized - Admin access required"

**Cause:** Admin password incorrect or missing.

**Solution:**
1. Verify `VITE_ADMIN_PASSWORD` is set correctly
2. Check password matches Edge Function secret
3. Clear session storage and retry
4. Use correct password when prompted

---

### "Cannot find name 'Deno'"

**Cause:** TypeScript error in Edge Function code.

**Solution:**
1. This is expected in Edge Functions
2. Use `@ts-expect-error` comment:
   ```typescript
   // @ts-expect-error - Deno global is available in Supabase Edge Functions runtime
   const secret = Deno.env.get("SECRET_NAME");
   ```

---

### "FunctionsFetchError"

**Cause:** Edge Function request failed.

**Solution:**
1. Verify Edge Function is deployed
2. Check function URL is correct
3. Verify `apikey` header is included
4. Check Edge Function logs for errors
5. Test function directly with curl

---

### "Policy violation" or "Permission denied"

**Cause:** Row Level Security (RLS) policy blocking operation.

**Solution:**
1. Check RLS policies in Supabase Dashboard
2. Verify policy conditions are correct
3. Check if using correct Supabase client (anon vs service role)
4. Review migration files for policy definitions

## Getting Help

### Before Asking for Help

1. ✅ Check this troubleshooting guide
2. ✅ Review [README.md](./README.md) for setup instructions
3. ✅ Check [API.md](./API.md) for API details
4. ✅ Review [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for configuration
5. ✅ Search existing issues on GitHub

### When Reporting Issues

Include the following information:

1. **Environment:**
   - OS and version
   - Node.js version (`node --version`)
   - Browser and version
   - Package manager (npm/yarn/bun)

2. **Error Details:**
   - Exact error message
   - Stack trace (if available)
   - Browser console errors
   - Network tab errors

3. **Steps to Reproduce:**
   - Clear steps to reproduce the issue
   - What you expected to happen
   - What actually happened

4. **Configuration:**
   - Environment variables (sanitized - no secrets!)
   - Supabase project status
   - Edge Functions deployment status

5. **Attempted Solutions:**
   - What you've already tried
   - Relevant troubleshooting steps attempted

### Resources

- **Documentation:**
  - [README.md](./README.md) - Setup and overview
  - [API.md](./API.md) - API reference
  - [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
  - [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) - Environment variables
  - [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

- **External Resources:**
  - [Supabase Documentation](https://supabase.com/docs)
  - [Vite Documentation](https://vitejs.dev)
  - [React Documentation](https://react.dev)
  - [TypeScript Documentation](https://www.typescriptlang.org/docs)

- **Community:**
  - GitHub Issues - Report bugs and request features
  - Discord Server - Community support (if available)

---

**Last Updated:** January 2026  
**Version:** 1.0.0



