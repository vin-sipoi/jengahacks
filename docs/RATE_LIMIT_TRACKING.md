# Rate Limit Violation Tracking

This document describes the rate limit violation tracking system implemented in the JengaHacks application.

## Overview

The application tracks rate limit violations across multiple layers:

1. **Client-Side** - Tracks violations in browser localStorage
2. **Server-Side (Edge Function)** - Logs violations to database
3. **Database** - Stores violation records for analysis

## Database Schema

### `rate_limit_violations` Table

```sql
CREATE TABLE rate_limit_violations (
  id UUID PRIMARY KEY,
  violation_type TEXT NOT NULL, -- 'email', 'ip', or 'client'
  identifier TEXT NOT NULL,    -- email address or IP address
  attempt_count INTEGER NOT NULL,
  limit_threshold INTEGER NOT NULL,
  retry_after_seconds INTEGER,
  user_agent TEXT,
  request_path TEXT,
  created_at TIMESTAMPTZ NOT NULL
);
```

### Indexes

- `idx_rate_limit_violations_type_created` - Fast queries by type and time
- `idx_rate_limit_violations_identifier_created` - Fast queries by identifier
- `idx_rate_limit_violations_created_at` - Time-based queries

## Tracking Points

### 1. Client-Side Tracking

**Location:** `src/lib/rateLimit.ts`

When a client-side rate limit is exceeded:

```typescript
trackClientRateLimitViolation('client-localStorage', attemptCount, retryAfter);
```

**What's tracked:**
- Violation type: `client`
- Identifier: `client-localStorage`
- Attempt count
- Retry after time
- Analytics event
- Monitoring metric

### 2. Server-Side Tracking (Edge Function)

**Location:** `supabase/functions/register-with-ip/index.ts`

When a database rate limit is exceeded:

```typescript
// Email limit exceeded
await supabase.rpc("log_email_rate_limit_violation", {
  p_email: email,
  p_attempt_count: attemptCount,
  p_user_agent: userAgent,
  p_request_path: "/functions/v1/register-with-ip",
});

// IP limit exceeded
await supabase.rpc("log_ip_rate_limit_violation", {
  p_ip_address: ipAddress,
  p_attempt_count: attemptCount,
  p_user_agent: userAgent,
  p_request_path: "/functions/v1/register-with-ip",
});
```

**What's tracked:**
- Violation type: `email` or `ip`
- Identifier: email address or IP address
- Attempt count
- User agent
- Request path
- Timestamp

### 3. Database Function Tracking

**Location:** `supabase/migrations/20251224000000_add_rate_limit_violation_tracking.sql`

The `check_registration_rate_limit` function automatically logs violations when limits are exceeded.

## Rate Limits

### Email-Based Limits
- **Limit:** 3 registrations per hour per email
- **Violation Type:** `email`
- **Threshold:** 3

### IP-Based Limits
- **Limit:** 5 registrations per hour per IP
- **Violation Type:** `ip`
- **Threshold:** 5

### Client-Side Limits
- **Limit:** 3 submissions per hour (localStorage)
- **Violation Type:** `client`
- **Threshold:** 3

## Querying Violations

### Get Violation Statistics

```typescript
import { getViolationStats } from '@/lib/rateLimitTracking';

const stats = await getViolationStats(24); // Last 24 hours
// Returns: [{ violation_type, total_count, unique_identifiers, recent_violations }]
```

### Get Top Violators

```typescript
import { getTopViolators } from '@/lib/rateLimitTracking';

const violators = await getTopViolators(10, 24); // Top 10, last 24 hours
// Returns: [{ violation_type, identifier, violation_count, first_violation, last_violation }]
```

### Database Functions

```sql
-- Get violation statistics
SELECT * FROM get_rate_limit_violation_stats(24);

-- Get top violators
SELECT * FROM get_top_rate_limit_violators(10, 24);
```

## Admin Dashboard

The admin dashboard includes a "Rate Limits" tab that displays:

1. **Statistics Cards** - Total violations by type
2. **Top Violators Table** - Most frequent violators
3. **Time Range Filter** - 24, 48, or 72 hours

**Access:** Admin Dashboard → Rate Limits tab

## Analytics Integration

Violations are tracked in:

1. **Google Analytics** - `rate_limit_violation` event
2. **Monitoring System** - `rate_limit_violation` metric
3. **Application Logs** - Warning-level logs

## Security Considerations

### Data Privacy

- **Email Addresses:** Partially masked in admin dashboard (e.g., `joh***@example.com`)
- **IP Addresses:** Last octet masked (e.g., `192.168.1.***`)
- **User Agents:** Stored but not displayed in full

### Access Control

- **RLS Policies:** Only service role can read violations
- **Admin Access:** Requires authenticated admin user
- **Public Access:** No public access to violation data

## Monitoring & Alerting

### Metrics Tracked

- `rate_limit_violation` - Count of violations
- Violation type breakdown
- Violation frequency trends

### Recommended Alerts

1. **High Violation Rate:** Alert if violations exceed threshold in short time
2. **Repeated Violators:** Alert on same identifier violating multiple times
3. **Suspicious Patterns:** Alert on unusual violation patterns

## Best Practices

### 1. Regular Review

Review violation logs regularly to:
- Identify abuse patterns
- Adjust rate limits if needed
- Block persistent violators

### 2. Privacy Compliance

- Mask sensitive data in displays
- Follow data retention policies
- Comply with privacy regulations

### 3. Performance

- Violation logging is non-blocking
- Database indexes optimize queries
- Materialized views can be added for heavy analytics

## Troubleshooting

### Violations Not Logging

1. Check database functions exist:
   ```sql
   SELECT * FROM pg_proc WHERE proname LIKE 'log_%_rate_limit_violation';
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'rate_limit_violations';
   ```

3. Check Edge Function logs for errors

### Missing Data

1. Verify migration was applied:
   ```sql
   SELECT * FROM rate_limit_violations LIMIT 1;
   ```

2. Check function permissions:
   ```sql
   SELECT * FROM pg_proc WHERE proname = 'log_email_rate_limit_violation';
   ```

## Future Enhancements

- [ ] Real-time violation alerts
- [ ] Automated blocking of persistent violators
- [ ] Violation pattern analysis
- [ ] Integration with security monitoring tools
- [ ] Export violation reports


