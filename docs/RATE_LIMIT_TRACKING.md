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

## Enhanced Features (Implemented)

### Real-Time Violation Alerts

The system now automatically creates alerts when violations occur:

- **High Violation Rate Alerts**: Triggered when violations exceed thresholds in short time windows
- **Repeated Violator Alerts**: Triggered when the same identifier violates multiple times
- **Suspicious Pattern Alerts**: Triggered when unusual patterns are detected
- **Auto-Blocked Alerts**: Triggered when identifiers are automatically blocked

**Database Table:** `violation_alerts`

**Usage:**
```typescript
import { getViolationAlerts, checkHighViolationRate, checkRepeatedViolators } from '@/lib/rateLimitTracking';

// Get alerts
const alerts = await getViolationAlerts(false, 'high', 50); // Unresolved, high severity, limit 50

// Check for high violation rates
await checkHighViolationRate(10, 15); // Threshold: 10 violations in 15 minutes

// Check for repeated violators
await checkRepeatedViolators(3, 24); // Threshold: 3 violations in 24 hours
```

**Automatic Triggering:**
- Database trigger automatically creates alerts when violations are logged
- Alerts are integrated with the monitoring system
- Webhook notifications can be sent for critical alerts

### Automated Blocking of Persistent Violators

Persistent violators can be automatically blocked:

**Database Table:** `blocked_identifiers`

**Functions:**
- `is_identifier_blocked(identifier, violation_type)` - Check if blocked
- `block_identifier(...)` - Block an identifier
- `unblock_identifier(...)` - Unblock an identifier
- `auto_block_persistent_violators(...)` - Auto-block violators exceeding threshold

**Usage:**
```typescript
import { 
  isIdentifierBlocked, 
  blockIdentifier, 
  unblockIdentifier,
  autoBlockPersistentViolators 
} from '@/lib/rateLimitTracking';

// Check if blocked
const blocked = await isIdentifierBlocked('user@example.com', 'email');

// Manual block
await blockIdentifier('user@example.com', 'email', 5, 'Excessive violations', 'admin');

// Auto-block persistent violators
const blocked = await autoBlockPersistentViolators(5, 24); // 5+ violations in 24 hours
```

**Edge Function Integration:**
The registration Edge Function automatically checks for blocked identifiers before processing requests.

### Violation Pattern Analysis

The system detects and analyzes violation patterns:

**Pattern Types:**
- **Burst**: Many violations in short time period
- **Distributed**: Violations from many different identifiers
- **Repeated**: Same identifier violating multiple times
- **Suspicious UA**: Unusual user agent patterns
- **Time-Based**: Violations at specific times

**Database Table:** `violation_patterns`

**Usage:**
```typescript
import { detectViolationPatterns, getViolationPatterns } from '@/lib/rateLimitTracking';

// Detect patterns
const patterns = await detectViolationPatterns(24); // Last 24 hours

// Get detected patterns
const patterns = await getViolationPatterns(24, 0.5); // Last 24 hours, min confidence 0.5
```

**Pattern Detection:**
- Automatic pattern detection via database function
- Confidence scores (0.0 - 1.0) indicate pattern reliability
- High-confidence patterns trigger alerts

### Integration with Security Monitoring Tools

The system integrates with security monitoring tools:

**Monitoring System Integration:**
- Alerts automatically sent to monitoring system
- Metrics tracked for violation rates
- Health checks include violation status

**Webhook Integration:**
- Critical alerts can be sent to webhooks (Slack, Discord, etc.)
- Configure via `VITE_MONITORING_WEBHOOK_URL`
- Alert payload includes violation details

**Sentry Integration:**
- High and critical severity alerts sent to Sentry
- Includes violation context and metadata

**Usage:**
```typescript
// Alerts are automatically created and sent to monitoring system
// Configure webhooks via environment variables:
// VITE_MONITORING_WEBHOOK_URL=https://your-webhook-url
// VITE_MONITORING_ALERTS=true
```

### Export Violation Reports

Export violation data in multiple formats:

**Export Functions:**
- `exportViolationsCSV(...)` - Export as CSV
- `exportViolationsJSON(...)` - Export as JSON
- `exportViolationSummary(...)` - Export summary report

**Usage:**
```typescript
import { 
  exportViolationsCSV, 
  exportViolationsJSON, 
  exportViolationSummary,
  downloadViolationsCSV,
  downloadViolationsJSON
} from '@/lib/rateLimitTracking';

// Export CSV
const csv = await exportViolationsCSV(
  new Date('2025-01-01'), 
  new Date('2025-01-31'),
  'email',
  10000
);
downloadViolationsCSV(csv, 'violations_january.csv');

// Export JSON
const json = await exportViolationsJSON();
downloadViolationsJSON(json);

// Export summary
const summary = await exportViolationSummary();
// Summary includes: totals, top violators, patterns, alerts
```

**Export Data Includes:**
- Violation details (type, identifier, count, timestamps)
- Top violators
- Detected patterns
- Alert history
- Summary statistics

## Admin Dashboard

The enhanced admin dashboard (`RateLimitEnhancements` component) provides:

1. **Real-Time Alerts Display** - View active violation alerts
2. **Pattern Analysis** - View detected violation patterns
3. **Auto-Blocking** - Trigger automatic blocking of persistent violators
4. **Manual Blocking** - Block/unblock specific identifiers
5. **Export Tools** - Export violations in CSV, JSON, or summary format

**Access:** Admin Dashboard → Rate Limits → Enhancements tab

## Database Schema

### New Tables

**`blocked_identifiers`**
- Stores blocked identifiers (emails/IPs)
- Tracks blocking reason, duration, and status

**`violation_alerts`**
- Stores violation alerts for real-time monitoring
- Tracks alert type, severity, and resolution status

**`violation_patterns`**
- Stores detected violation patterns
- Includes confidence scores and pattern metadata

## Migration

The enhancements migration is located at:
`supabase/migrations/20251227000000_rate_limit_enhancements.sql`

To apply:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
# Copy and paste the migration SQL
```

## Maintenance

### Scheduled Tasks

Recommended scheduled tasks:

1. **Pattern Detection** (every hour):
   ```sql
   SELECT * FROM detect_violation_patterns(24);
   ```

2. **Auto-Blocking** (every 6 hours):
   ```sql
   SELECT * FROM auto_block_persistent_violators(5, 24);
   ```

3. **High Rate Checks** (every 15 minutes):
   ```sql
   SELECT * FROM check_high_violation_rate(10, 15);
   ```

4. **Repeated Violator Checks** (every hour):
   ```sql
   SELECT * FROM check_repeated_violators(3, 24);
   ```

### Monitoring

Monitor the following metrics:

- Alert count by severity
- Blocked identifier count
- Pattern detection rate
- Export usage
- Auto-block success rate


