# API Documentation

This document provides comprehensive documentation for the JengaHacks 2026 API endpoints, database schema, and client-side integrations.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Edge Functions](#edge-functions)
  - [Register with IP](#register-with-ip)
  - [Verify reCAPTCHA](#verify-recaptcha)
  - [Get Resume URL](#get-resume-url)
- [Database Schema](#database-schema)
  - [Registrations Table](#registrations-table)
  - [Storage Buckets](#storage-buckets)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Client-Side API](#client-side-api)
- [Examples](#examples)

## Base URL

All Edge Functions are hosted on Supabase and accessible at:

```
https://<your-project-ref>.supabase.co/functions/v1/<function-name>
```

For local development:
```
http://localhost:54321/functions/v1/<function-name>
```

## Authentication

### Edge Functions

Most Edge Functions use **Supabase API Key** authentication via the `apikey` header:

```http
apikey: <your-supabase-anon-key>
```

### Admin Functions

Some functions require admin authentication:

1. **Admin Password** (current implementation):
   ```json
   {
     "admin_password": "<admin-password>"
   }
   ```

2. **Supabase Auth Token** (future implementation):
   ```http
   Authorization: Bearer <supabase-auth-token>
   ```

## Edge Functions

### Register with IP

Registers a new participant and captures their IP address for rate limiting.

**Endpoint:** `POST /functions/v1/register-with-ip`

**Headers:**
```http
Content-Type: application/json
apikey: <your-supabase-anon-key>
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "whatsapp_number": "+254 712345678",  // Optional
  "linkedin_url": "https://linkedin.com/in/johndoe",  // Optional
  "resume_path": "1234567890-abc123.pdf"  // Optional
}
```

**Response (Success - 200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "full_name": "John Doe",
  "email": "john.doe@example.com",
  "whatsapp_number": "+254 712345678",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "resume_path": "1234567890-abc123.pdf",
  "ip_address": "192.168.1.1",
  "created_at": "2026-01-15T10:30:00Z"
}
```

**Response (Error - 400):**
```json
{
  "error": "full_name and email are required"
}
```

**Response (Error - 429 - Rate Limited):**
```json
{
  "error": "Rate limit exceeded. Maximum 3 registrations per email or 5 per IP per hour.",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

**Response (Error - 409 - Duplicate Email):**
```json
{
  "error": "This email is already registered",
  "code": "DUPLICATE_EMAIL"
}
```

**Rate Limiting:**
- **Email-based:** Maximum 3 registrations per email per hour
- **IP-based:** Maximum 5 registrations per IP address per hour
- Both limits are enforced simultaneously

**Validation:**
- `full_name`: Required, 2-100 characters, letters/spaces/apostrophes/hyphens only
- `email`: Required, valid email format, max 254 characters, unique
- `whatsapp_number`: Optional, E.164 format (+[country code][number])
- `linkedin_url`: Optional, valid LinkedIn URL format, max 500 characters
- `resume_path`: Optional, must exist in storage bucket

---

### Verify reCAPTCHA

Verifies a reCAPTCHA token server-side for additional security.

**Endpoint:** `POST /functions/v1/verify-recaptcha`

**Headers:**
```http
Content-Type: application/json
apikey: <your-supabase-anon-key>
```

**Request Body:**
```json
{
  "token": "<recaptcha-token-from-client>"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "score": 0.9,  // For reCAPTCHA v3 (0.0 = bot, 1.0 = human)
  "challenge_ts": "2026-01-15T10:30:00Z",
  "hostname": "jengahacks.com"
}
```

**Response (Error - 400):**
```json
{
  "error": "CAPTCHA token is required"
}
```

**Response (Error - 200 - Verification Failed):**
```json
{
  "success": false,
  "score": 0.1,
  "challenge_ts": "2026-01-15T10:30:00Z",
  "hostname": "jengahacks.com"
}
```

**Notes:**
- Uses Google reCAPTCHA v2 (checkbox) or v3 (invisible)
- Server-side verification prevents token manipulation
- Score indicates bot likelihood (v3 only)

---

### Get Resume URL

Generates a secure, time-limited signed URL for accessing resume files.

**Endpoint:** `POST /functions/v1/get-resume-url`

**Headers:**
```http
Content-Type: application/json
apikey: <your-supabase-anon-key>
Authorization: Bearer <supabase-auth-token>  // Optional, for future use
```

**Request Body:**
```json
{
  "resume_path": "1234567890-abc123.pdf",
  "admin_password": "<admin-password>"  // Required if no auth token
}
```

**Response (Success - 200):**
```json
{
  "signedUrl": "https://<project>.supabase.co/storage/v1/object/sign/resumes/1234567890-abc123.pdf?token=<signed-token>",
  "expiresIn": 3600  // Seconds until expiration
}
```

**Response (Error - 401):**
```json
{
  "error": "Unauthorized - Admin access required"
}
```

**Response (Error - 404):**
```json
{
  "error": "Resume not found"
}
```

**Security:**
- Requires admin authentication (password or auth token)
- Signed URLs expire after 1 hour
- Resumes are stored in private bucket (not publicly accessible)

---

## Database Schema

### Registrations Table

**Table:** `public.registrations`

**Columns:**

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique registration ID |
| `full_name` | TEXT | NOT NULL, CHECK (length >= 2 AND length <= 100) | Participant's full name |
| `email` | TEXT | NOT NULL, UNIQUE, CHECK (valid email format) | Participant's email address |
| `whatsapp_number` | TEXT | NULL, CHECK (E.164 format if provided) | WhatsApp number in E.164 format |
| `linkedin_url` | TEXT | NULL, CHECK (valid LinkedIn URL if provided) | LinkedIn profile URL |
| `resume_path` | TEXT | NULL | Path to resume file in storage |
| `ip_address` | INET | NULL | IP address for rate limiting |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Registration timestamp |

**Row Level Security (RLS):**

- **INSERT:** Allowed for anyone (public registration)
- **SELECT:** Denied for all users (admin access only via service role)
- **UPDATE:** Denied for all users (no modifications allowed)
- **DELETE:** Denied for all users (no deletions allowed)

**Indexes:**
- `idx_registrations_email_created_at` on `(email, created_at)` - For rate limiting queries
- `idx_registrations_ip_address_created_at` on `(ip_address, created_at)` - For IP rate limiting

**Database Functions:**

1. **`check_registration_rate_limit(p_email TEXT, p_ip_address INET)`**
   - Returns `BOOLEAN`
   - Checks if email (3/hour) or IP (5/hour) has exceeded rate limit
   - Used by RLS policies

2. **`get_rate_limit_info(p_email TEXT)`**
   - Returns `TABLE(allowed BOOLEAN, attempts INTEGER, retry_after_seconds INTEGER)`
   - Gets rate limit status for an email

3. **`check_ip_rate_limit(p_ip_address INET)`**
   - Returns `BOOLEAN`
   - Checks if IP has exceeded rate limit (5/hour)

4. **`get_ip_rate_limit_info(p_ip_address INET)`**
   - Returns `TABLE(allowed BOOLEAN, attempts INTEGER, retry_after_seconds INTEGER)`
   - Gets rate limit status for an IP

### Storage Buckets

**Bucket:** `resumes`

**Configuration:**
- **Public:** `false` (private bucket)
- **File Size Limit:** 5MB
- **Allowed MIME Types:** `application/pdf`

**Storage Policies:**

- **INSERT:** Anyone can upload resumes
- **SELECT:** No public access (admin-only via signed URLs)
- **UPDATE:** Denied for all users
- **DELETE:** Denied for all users

**File Naming:**
- Format: `<timestamp>-<random-string>.pdf`
- Example: `1705312800000-a1b2c3d.pdf`
- Filenames are sanitized to prevent path traversal

---

## Rate Limiting

### Limits

1. **Email-based:** 3 registrations per email per hour
2. **IP-based:** 5 registrations per IP address per hour

Both limits are enforced simultaneously. If either limit is exceeded, the request is rejected.

### Implementation

Rate limiting is implemented at multiple layers:

1. **Database Level (RLS Policies):**
   - Enforced via PostgreSQL functions
   - Checks both email and IP limits
   - Cannot be bypassed by client-side manipulation

2. **Client-Side (UX):**
   - Provides immediate feedback
   - Uses `localStorage` for client-side tracking
   - Not security-critical (server-side is authoritative)

3. **Edge Function Level:**
   - Additional validation before database insert
   - Returns structured error responses

### Rate Limit Headers

Future implementation may include standard rate limit headers:

```http
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1705316400
Retry-After: 3600
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": "Human-readable error message",
  "code": "ERROR_CODE",  // Optional
  "details": {}  // Optional, additional error details
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded |
| `DUPLICATE_EMAIL` | 409 | Email already registered |
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `NOT_FOUND` | 404 | Resource not found |
| `INTERNAL_ERROR` | 500 | Server error |

### Common Errors

**400 Bad Request:**
- Missing required fields
- Invalid input format
- Validation constraint violations

**401 Unauthorized:**
- Missing or invalid admin password
- Invalid authentication token

**404 Not Found:**
- Resume file not found
- Invalid resume path

**409 Conflict:**
- Duplicate email registration

**429 Too Many Requests:**
- Rate limit exceeded
- Retry after the specified time

**500 Internal Server Error:**
- Server-side errors
- Database connection issues
- External API failures

---

## Client-Side API

### Supabase Client

The application uses the Supabase JavaScript client for database operations.

**Initialization:**
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);
```

### Direct Database Insert (Fallback)

If Edge Functions are disabled, registrations can be inserted directly:

```typescript
const { data, error } = await supabase
  .from('registrations')
  .insert({
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    whatsapp_number: '+254 712345678',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    resume_path: '1234567890-abc123.pdf'
  });
```

**Note:** Direct inserts will have `ip_address` set to `NULL` (IP-based rate limiting won't apply).

### Storage Operations

**Upload Resume:**
```typescript
const { data, error } = await supabase.storage
  .from('resumes')
  .upload(fileName, file, {
    contentType: 'application/pdf',
    upsert: false
  });
```

**Get Signed URL (Admin):**
```typescript
const { data, error } = await supabase.storage
  .from('resumes')
  .createSignedUrl(resumePath, 3600); // Valid for 1 hour
```

---

## Examples

### Complete Registration Flow

```typescript
// 1. Upload resume (if provided)
let resumePath = null;
if (resumeFile) {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('resumes')
    .upload(fileName, resumeFile);
  
  if (!uploadError) {
    resumePath = fileName;
  }
}

// 2. Verify CAPTCHA
const { data: captchaData } = await supabase.functions.invoke('verify-recaptcha', {
  body: { token: captchaToken }
});

if (!captchaData?.success) {
  throw new Error('CAPTCHA verification failed');
}

// 3. Register with IP capture
const { data, error } = await supabase.functions.invoke('register-with-ip', {
  body: {
    full_name: 'John Doe',
    email: 'john.doe@example.com',
    whatsapp_number: '+254 712345678',
    linkedin_url: 'https://linkedin.com/in/johndoe',
    resume_path: resumePath
  }
});

if (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    console.error('Rate limit exceeded');
  } else if (error.code === 'DUPLICATE_EMAIL') {
    console.error('Email already registered');
  }
}
```

### Admin: Download Resume

```typescript
const { data, error } = await supabase.functions.invoke('get-resume-url', {
  body: {
    resume_path: '1234567890-abc123.pdf',
    admin_password: process.env.VITE_ADMIN_PASSWORD
  }
});

if (data?.signedUrl) {
  // Open signed URL in new tab for download
  window.open(data.signedUrl, '_blank');
}
```

### Error Handling Example

```typescript
try {
  const { data, error } = await supabase.functions.invoke('register-with-ip', {
    body: registrationData
  });

  if (error) {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        toast.error('Too many registration attempts. Please try again later.');
        break;
      case 'DUPLICATE_EMAIL':
        toast.error('This email is already registered.');
        break;
      default:
        toast.error('Registration failed. Please try again.');
    }
    return;
  }

  // Success
  toast.success('Registration successful!');
} catch (err) {
  console.error('Registration error:', err);
  toast.error('An unexpected error occurred.');
}
```

---

## Environment Variables

### Required

- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `VITE_RECAPTCHA_SITE_KEY` - Google reCAPTCHA site key

### Optional

- `VITE_USE_REGISTRATION_EDGE_FUNCTION` - Enable IP-based rate limiting (`true`/`false`)
- `VITE_GA_MEASUREMENT_ID` - Google Analytics 4 measurement ID
- `VITE_GA_ENABLED` - Enable/disable analytics (`true`/`false`)
- `VITE_ADMIN_PASSWORD` - Admin password for protected endpoints
- `VITE_DISCORD_URL` - Discord community server URL

### Server-Side (Edge Functions)

- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)
- `RECAPTCHA_SECRET_KEY` - Google reCAPTCHA secret key
- `ADMIN_PASSWORD` - Admin password for protected endpoints

---

## Security Considerations

1. **Input Validation:**
   - Client-side validation for UX
   - Server-side validation for security
   - Database-level CHECK constraints as final defense

2. **Rate Limiting:**
   - Multiple layers (client, server, database)
   - IP and email-based limits
   - Prevents abuse and spam

3. **File Uploads:**
   - File type validation (PDF only)
   - File size limits (5MB)
   - Filename sanitization
   - Private storage bucket

4. **Authentication:**
   - Admin endpoints require password or auth token
   - Service role key never exposed to client
   - Signed URLs for secure file access

5. **CORS:**
   - Configured for specific origins
   - Preflight requests handled

6. **Error Messages:**
   - Generic error messages to prevent information leakage
   - Detailed errors logged server-side only

---

## Support

For API issues or questions:
- Check the [README.md](./README.md) for setup instructions
- Review [TODO.md](./TODO.md) for known issues
- Open an issue on the repository

---

**Last Updated:** January 2026
**API Version:** 1.0.0

