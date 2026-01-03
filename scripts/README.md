# Backup Scripts

Automated backup scripts for JengaHacks Hub database and storage.

## Scripts

### `backup_database.sh`

Automated database backup script using Supabase CLI.

**Usage:**
```bash
./scripts/backup_database.sh
```

**Requirements:**
- Supabase CLI installed (`npm install -g supabase`)
- Logged in to Supabase (`supabase login`)
- `SUPABASE_PROJECT_REF` set in `.env` or `supabase/config.toml`

**Features:**
- Creates compressed SQL dump
- Automatic cleanup of old backups (30 days retention)
- Integrity verification
- Logging to `backups/backup.log`

**Schedule with cron:**
```bash
# Daily at 2 AM
0 2 * * * cd /path/to/project && ./scripts/backup_database.sh
```

### `backup_storage.py`

Automated storage bucket backup script.

**Usage:**
```bash
python3 scripts/backup_storage.py
```

**Requirements:**
- Python 3.7+
- `supabase-py` installed (`pip install supabase`)
- `VITE_SUPABASE_URL` or `SUPABASE_URL` environment variable
- `SUPABASE_SERVICE_ROLE_KEY` environment variable

**Features:**
- Downloads all files from `resumes` bucket
- Creates compressed tar.gz archive
- Generates manifest.json with backup metadata
- Automatic cleanup of old backups (90 days retention)
- Logging to `backups/backup.log`

**Schedule with cron:**
```bash
# Weekly on Sundays at 3 AM
0 3 * * 0 cd /path/to/project && python3 scripts/backup_storage.py
```

### `restore_database.sh`

Database restore script (use with caution).

**Usage:**
```bash
# Dry run (no changes)
./scripts/restore_database.sh db_backup_20250101_020000.sql.gz --dry-run

# Actual restore
./scripts/restore_database.sh db_backup_20250101_020000.sql.gz
```

**Warning:** This will overwrite your current database. Always test with `--dry-run` first.

**Note:** Direct restore via Supabase CLI is limited. For production restores, use:
- Supabase Dashboard → Database → Backups (point-in-time recovery)
- `psql` with connection string

### `backup_all.sh`

Comprehensive backup script that backs up database, storage, and configuration.

**Usage:**
```bash
./scripts/backup_all.sh
```

**Features:**
- Database backup (compressed)
- Storage backup (if Python available)
- Configuration backup (migrations, workflows, config files)
- Creates backup manifest (JSON)
- Automatic cleanup of old backups
- Detailed logging

**Schedule with cron:**
```bash
# Weekly full backup on Sundays at 4 AM
0 4 * * 0 cd /path/to/project && ./scripts/backup_all.sh
```

### `setup-backup-cron.sh`

Interactive script to set up automated backup cron jobs.

**Usage:**
```bash
./scripts/setup-backup-cron.sh
```

**What it does:**
- Sets up daily database backup (2 AM)
- Sets up weekly storage backup (Sundays 3 AM)
- Sets up weekly full backup (Sundays 4 AM)
- Backs up existing crontab before making changes

### `backup_all.sh`

Comprehensive backup script that backs up database, storage, and configuration.

**Usage:**
```bash
./scripts/backup_all.sh
```

**Features:**
- Database backup (compressed)
- Storage backup (if Python available)
- Configuration backup (migrations, workflows, config files)
- Creates backup manifest (JSON)
- Automatic cleanup of old backups
- Detailed logging

**Schedule with cron:**
```bash
# Weekly full backup on Sundays at 4 AM
0 4 * * 0 cd /path/to/project && ./scripts/backup_all.sh
```

### `setup-backup-cron.sh`

Interactive script to set up automated backup cron jobs.

**Usage:**
```bash
./scripts/setup-backup-cron.sh
```

**What it does:**
- Sets up daily database backup (2 AM)
- Sets up weekly storage backup (Sundays 3 AM)
- Sets up weekly full backup (Sundays 4 AM)
- Backs up existing crontab before making changes

### `check-backup-health.sh`

Monitor backup health and alert on issues.

**Usage:**
```bash
./scripts/check-backup-health.sh
```

**Checks:**
- Backup age (alerts if > 25 hours old)
- Backup size (alerts if suspiciously small)
- Backup integrity (gzip test)
- Table count
- Critical tables presence

**Schedule with cron:**
```bash
# Check backup health daily at 3 AM (after backup runs)
0 3 * * * cd /path/to/project && ./scripts/check-backup-health.sh
```

### `verify_backup.sh`

Verify backup file integrity and contents.

**Usage:**
```bash
./scripts/verify_backup.sh db_backup_20250101_020000.sql.gz
```

**Checks:**
- File integrity (gzip test)
- Table count
- Record count estimates
- File size

## Setup

### 1. Install Dependencies

```bash
# Supabase CLI
npm install -g supabase

# Python dependencies
pip install supabase
```

### 2. Configure Environment

Create `.env` file with:
```bash
SUPABASE_PROJECT_REF=your-project-ref
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Login to Supabase

```bash
supabase login
```

### 4. Make Scripts Executable

```bash
chmod +x scripts/*.sh
```

## Backup Storage

Backups are stored in:
- Database: `backups/database/`
- Storage: `backups/storage/`

**Important:** These directories are in `.gitignore`. Do not commit backups to Git.

## Cloud Storage Integration

### Upload to AWS S3

```bash
# Install AWS CLI
pip install awscli

# Configure
aws configure

# Upload backup
aws s3 cp backups/database/db_backup_20250101.sql.gz \
  s3://jengahacks-backups/database/
```

### Upload to Google Cloud Storage

```bash
# Install gsutil
pip install gsutil

# Upload backup
gsutil cp backups/database/db_backup_20250101.sql.gz \
  gs://jengahacks-backups/database/
```

## Monitoring

Check backup logs:
```bash
tail -f backups/backup.log
```

Set up alerts for backup failures (see `BACKUP_STRATEGY.md`).

## Troubleshooting

### Backup Script Fails

1. Check Supabase CLI is installed and logged in
2. Verify `SUPABASE_PROJECT_REF` is set correctly
3. Check disk space: `df -h`
4. Review logs: `tail -20 backups/backup.log`

### Storage Backup Fails

1. Verify `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)
2. Check Python dependencies: `pip list | grep supabase`
3. Verify bucket name is correct (`resumes`)
4. Check network connectivity

### Restore Fails

1. Verify backup file integrity: `gzip -t backup.sql.gz`
2. Check database connection
3. Ensure sufficient disk space
4. Review restore logs

### `create_admin_user.sql`

SQL script to grant admin role to a Supabase user.

**Usage:**
1. First, create a user in Supabase Auth (Dashboard → Authentication → Users)
2. Open Supabase SQL Editor
3. Edit `scripts/create_admin_user.sql` and replace `'admin@example.com'` with your admin email
4. Run the script in SQL Editor

**Options:**
- Grant admin by email (recommended)
- Grant admin by user ID
- List all users and their roles
- Remove admin role from a user

**Example:**
```sql
-- Grant admin role to user@example.com
DO $$
DECLARE
  admin_user_id UUID;
  admin_email TEXT := 'user@example.com';
BEGIN
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
```

### `create_admin_user.sh`

Interactive shell script to guide you through admin user creation.

**Usage:**
```bash
./scripts/create_admin_user.sh <project-ref>
```

**What it does:**
- Prompts for admin email and password
- Provides step-by-step instructions
- Generates SQL to grant admin role

**Note:** This script provides guidance. You still need to:
1. Create the user in Supabase Dashboard
2. Run the generated SQL in Supabase SQL Editor

## Admin Portal Setup

### Initial Setup

1. **Run the migration:**
   ```bash
   supabase migration up
   ```
   This creates the `user_roles` table and `app_role` enum.

2. **Create admin user:**
   - Go to Supabase Dashboard → Authentication → Users
   - Click "Add User" → "Create new user"
   - Enter email and password
   - Click "Create User"

3. **Grant admin role:**
   - Go to Supabase Dashboard → SQL Editor
   - Run `scripts/create_admin_user.sql` (edit email first)
   - Or use the interactive script: `./scripts/create_admin_user.sh`

4. **Access admin portal:**
   - Navigate to `/admin/login` on your site
   - Log in with the email and password you created
   - You'll be redirected to `/admin` dashboard

### Verify Admin Access

Run this SQL to see all users and their roles:
```sql
SELECT 
  u.email,
  array_agg(ur.role::text) as roles
FROM auth.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.email;
```

## Related Documentation

- [Backup Strategy](../BACKUP_STRATEGY.md) - Comprehensive backup documentation
- [Deployment Guide](../DEPLOYMENT.md) - Deployment procedures
- [Troubleshooting Guide](../TROUBLESHOOTING.md) - Common issues and solutions

