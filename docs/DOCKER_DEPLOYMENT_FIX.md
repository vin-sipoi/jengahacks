# Fix Docker Permission Issue for Edge Function Deployment

## Problem
When deploying Supabase Edge Functions, you may encounter this error:
```
failed to start docker container: Error response from daemon: error while creating mount source path '/host_mnt/Users/...': mkdir /host_mnt/Users/...: operation not permitted
```

## Solution: Fix Docker Desktop File Sharing

### Step 1: Open Docker Desktop Settings
1. Open **Docker Desktop** application
2. Click the **Settings** (gear icon) in the top right
3. Navigate to **Resources** → **File Sharing**

### Step 2: Add Your Project Directory
1. Click **"+"** or **"Add"** button
2. Add one of the following:
   - `/Users/katekuehl/Documents` (parent directory)
   - `/Users/katekuehl/Documents/Code` (Code directory)
   - `/Users/katekuehl/Documents/Code/jengahacks-hub` (project directory)

### Step 3: Apply and Restart
1. Click **"Apply & Restart"**
2. Wait for Docker Desktop to restart

### Step 4: Retry Deployment
```bash
supabase functions deploy register-with-ip --project-ref <your-project-ref>
```

## Alternative: Deploy via Supabase Dashboard

If Docker issues persist, you can deploy Edge Functions via the Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Edge Functions** in the sidebar
4. Click **"Deploy a new function"** or **"Upload"**
5. Upload the function code from `supabase/functions/register-with-ip/`

## Alternative: Use GitHub Actions

You can also deploy via GitHub Actions (which runs on Linux and doesn't have Docker permission issues):

1. Push your code to GitHub
2. The workflow in `.github/workflows/deploy-staging.yml` will automatically deploy Edge Functions

## Verify Deployment

After deployment, verify the function is available:

```bash
# List deployed functions
supabase functions list --project-ref <your-project-ref>

# Check function logs
supabase functions logs register-with-ip --project-ref <your-project-ref>
```

## Troubleshooting

### If file sharing still doesn't work:
1. **Check Docker Desktop is running**: Ensure Docker Desktop is fully started
2. **Restart Docker Desktop**: Quit and restart Docker Desktop completely
3. **Check macOS permissions**: Go to System Settings → Privacy & Security → Full Disk Access, ensure Docker Desktop has access
4. **Try a different path**: Sometimes adding a parent directory works better than the exact project path

### If you need to deploy immediately:
- Use the Supabase Dashboard to upload the function manually
- Or use GitHub Actions for automated deployment


