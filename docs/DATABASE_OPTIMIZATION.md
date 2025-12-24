# Database Query Optimization

This document outlines the database query optimization strategies implemented in the JengaHacks application.

## Overview

The application uses PostgreSQL (via Supabase) and implements several optimization strategies:

1. **Database Indexes** - Fast lookups for common query patterns
2. **Pagination** - Limit data transfer and improve response times
3. **Database Functions** - Server-side aggregations and filtering
4. **Materialized Views** - Pre-computed statistics for fast access
5. **Selective Column Queries** - Fetch only needed data

## Database Indexes

### Created Indexes

```sql
-- Index for sorting by created_at (most common query pattern)
CREATE INDEX idx_registrations_created_at_desc 
ON public.registrations(created_at DESC);

-- Index for filtering by linkedin_url
CREATE INDEX idx_registrations_linkedin_url 
ON public.registrations(linkedin_url) 
WHERE linkedin_url IS NOT NULL;

-- Index for filtering by resume_path
CREATE INDEX idx_registrations_resume_path 
ON public.registrations(resume_path) 
WHERE resume_path IS NOT NULL;

-- Composite index for common admin queries
CREATE INDEX idx_registrations_created_resume 
ON public.registrations(created_at DESC, resume_path) 
WHERE resume_path IS NOT NULL;
```

### Index Benefits

- **Faster Sorting**: `created_at DESC` index enables O(log n) sorting instead of O(n log n)
- **Faster Filtering**: Partial indexes on nullable columns reduce index size
- **Composite Indexes**: Support multiple query patterns efficiently

## Pagination

### Implementation

The application uses database-level pagination instead of loading all records:

```typescript
import { getPaginatedRegistrations } from '@/lib/dbQueries';

const result = await getPaginatedRegistrations({
  limit: 50,
  offset: 0,
  search: 'search term',
  sortBy: 'created_at',
  sortOrder: 'DESC',
});
```

### Benefits

- **Reduced Memory Usage**: Only loads requested page of data
- **Faster Response Times**: Less data to transfer and process
- **Better UX**: Faster page loads, especially with large datasets
- **Scalability**: Performance doesn't degrade with dataset size

## Database Functions

### `get_registrations_paginated`

Optimized function for paginated registration queries with search and sorting:

```sql
SELECT * FROM get_registrations_paginated(
  p_limit := 50,
  p_offset := 0,
  p_search := 'john',
  p_sort_by := 'created_at',
  p_sort_order := 'DESC'
);
```

**Features:**
- Server-side search filtering
- Server-side sorting
- Total count included
- SQL injection protection via parameterized queries

### `get_registration_stats`

Efficient statistics aggregation:

```sql
SELECT * FROM get_registration_stats();
```

**Returns:**
- Total registrations
- Counts by category (LinkedIn, Resume, etc.)
- Time-based counts (today, this week, this month)
- Daily trends (last 30 days)
- Hourly distribution

**Benefits:**
- Single query instead of multiple
- Database-level aggregation (faster)
- Consistent results

## Materialized Views

### `registration_stats`

Pre-computed statistics view for fast access:

```sql
CREATE MATERIALIZED VIEW registration_stats AS
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL) as with_linkedin,
  -- ... more aggregations
FROM public.registrations;
```

**Usage:**
- Refresh periodically: `REFRESH MATERIALIZED VIEW registration_stats;`
- Fast reads for dashboard statistics
- Reduces load on main table

## Query Patterns

### Before Optimization

```typescript
// ❌ Loads ALL registrations
const { data } = await supabase
  .from('registrations')
  .select('*')
  .order('created_at', { ascending: false });

// ❌ Client-side filtering
const filtered = data.filter(r => r.email.includes(search));

// ❌ Client-side sorting
const sorted = filtered.sort((a, b) => ...);
```

### After Optimization

```typescript
// ✅ Loads only requested page
const result = await getPaginatedRegistrations({
  limit: 50,
  offset: 0,
  search: search,  // Server-side filtering
  sortBy: 'created_at',  // Server-side sorting
  sortOrder: 'DESC',
});
```

## Performance Metrics

### Expected Improvements

- **Query Time**: 50-90% reduction for large datasets
- **Memory Usage**: 80-95% reduction (pagination)
- **Network Transfer**: 80-95% reduction (pagination)
- **Database Load**: 60-80% reduction (indexes + functions)

### Monitoring

Monitor query performance using:

1. **Supabase Dashboard**: Query performance metrics
2. **Application Logs**: Query execution times
3. **Database EXPLAIN**: Analyze query plans

```sql
EXPLAIN ANALYZE
SELECT * FROM get_registrations_paginated(50, 0, NULL, 'created_at', 'DESC');
```

## Best Practices

### 1. Use Pagination

Always paginate large result sets:

```typescript
// ✅ Good
const result = await getPaginatedRegistrations({ limit: 50, offset: 0 });

// ❌ Bad
const { data } = await supabase.from('registrations').select('*');
```

### 2. Select Only Needed Columns

```typescript
// ✅ Good - only select needed columns
const { data } = await supabase
  .from('registrations')
  .select('id, full_name, email, created_at');

// ❌ Bad - selects all columns
const { data } = await supabase.from('registrations').select('*');
```

### 3. Use Database Functions for Aggregations

```typescript
// ✅ Good - database-level aggregation
const stats = await getRegistrationStats();

// ❌ Bad - client-side aggregation
const { data } = await supabase.from('registrations').select('*');
const stats = calculateStats(data); // Slow for large datasets
```

### 4. Leverage Indexes

Ensure queries use indexes:

```typescript
// ✅ Good - uses created_at index
.order('created_at', { ascending: false })

// ✅ Good - uses linkedin_url index
.filter('linkedin_url', 'not.is', null)
```

### 5. Cache Statistics

Use materialized views or caching for frequently accessed statistics:

```typescript
// Refresh materialized view periodically
await refreshStatsView();
```

## Migration

The optimization migration is located at:
`supabase/migrations/20251223000000_optimize_database_queries.sql`

To apply:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
# Copy and paste the migration SQL
```

## Troubleshooting

### Slow Queries

1. **Check Index Usage**:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM registrations ORDER BY created_at DESC;
   ```

2. **Verify Indexes Exist**:
   ```sql
   SELECT indexname, indexdef 
   FROM pg_indexes 
   WHERE tablename = 'registrations';
   ```

3. **Check Query Plan**:
   - Look for "Seq Scan" (bad)
   - Look for "Index Scan" (good)

### Missing Indexes

If queries are slow, check if indexes exist:

```sql
-- List all indexes on registrations table
SELECT * FROM pg_indexes WHERE tablename = 'registrations';
```

### Function Errors

If RPC functions fail, the application falls back to direct queries. Check:

1. Function exists: `SELECT * FROM pg_proc WHERE proname = 'get_registrations_paginated';`
2. Permissions: `GRANT EXECUTE ON FUNCTION get_registrations_paginated TO authenticated;`

## Advanced Optimizations (Implemented)

### Full-Text Search Indexes

Full-text search indexes have been added for improved search performance:

```sql
-- GIN indexes for full-text search
CREATE INDEX idx_registrations_full_name_fts ON registrations 
USING gin(to_tsvector('english', coalesce(full_name, '')));

CREATE INDEX idx_registrations_email_fts ON registrations 
USING gin(to_tsvector('english', coalesce(email, '')));

CREATE INDEX idx_registrations_search_fts ON registrations 
USING gin(to_tsvector('english', 
  coalesce(full_name, '') || ' ' || 
  coalesce(email, '') || ' ' || 
  coalesce(linkedin_url, '')
));
```

**Benefits:**
- Faster text searches using PostgreSQL's full-text search
- Relevance ranking for search results
- Better performance for complex search queries

**Usage:**
```typescript
// Use full-text search (default when search term provided)
const result = await getPaginatedRegistrations({
  search: 'john doe',
  useFullTextSearch: true, // default
  sortBy: 'rank' // Sort by relevance
});
```

### Query Result Caching

Database-level query result caching has been implemented:

```sql
-- Cache table for query results
CREATE TABLE query_cache (
  cache_key TEXT PRIMARY KEY,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  query_type TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0
);
```

**Functions:**
- `get_cached_query(cache_key, query_type)` - Retrieve cached result
- `set_cached_query(cache_key, cache_data, ttl_seconds, query_type)` - Store cached result
- `clear_expired_cache()` - Cleanup expired entries

**Usage:**
```typescript
import { getCachedQuery, setCachedQuery } from '@/lib/dbQueries';

// Try to get from cache first
let data = await getCachedQuery<RegistrationStats>('stats:all', 'stats');
if (!data) {
  // Fetch fresh data
  data = await getRegistrationStats();
  // Cache for 5 minutes
  await setCachedQuery('stats:all', data, 300, 'stats');
}
```

### Connection Pooling Metrics

Connection pool monitoring has been added:

```sql
-- Metrics table
CREATE TABLE connection_pool_metrics (
  timestamp TIMESTAMP WITH TIME ZONE,
  active_connections INTEGER,
  idle_connections INTEGER,
  waiting_connections INTEGER,
  max_connections INTEGER,
  utilization_percent NUMERIC(5, 2)
);
```

**Functions:**
- `record_connection_pool_metrics(...)` - Record current pool state
- `get_connection_pool_metrics(hours)` - Get metrics for last N hours

**Usage:**
```typescript
import { recordConnectionPoolMetrics, getConnectionPoolMetrics } from '@/lib/dbQueries';

// Record metrics periodically
await recordConnectionPoolMetrics({
  active: 10,
  idle: 5,
  waiting: 0,
  max: 100,
  totalQueries: 1000,
  avgQueryTimeMs: 45.2
});

// Get recent metrics
const metrics = await getConnectionPoolMetrics(24); // Last 24 hours
```

### Additional Materialized Views

New materialized views for common analytics queries:

1. **`registration_daily_trends`** - Daily trends for last 90 days
2. **`registration_hourly_patterns`** - Hourly registration patterns
3. **`registration_sources`** - Breakdown by source type (LinkedIn, Resume, etc.)

**Refresh Function:**
```sql
-- Refresh all views at once
SELECT * FROM refresh_all_materialized_views();
```

**Usage:**
```typescript
import { refreshAllMaterializedViews } from '@/lib/dbQueries';

// Refresh all views (call periodically)
await refreshAllMaterializedViews();
```

### Read Replica Support

Functions optimized for read replicas:

```sql
-- Analytics function that uses materialized views (can run on read replica)
SELECT * FROM get_registration_stats_analytics();
```

**Usage:**
```typescript
import { getRegistrationStatsAnalytics } from '@/lib/dbQueries';

// Use analytics function (optimized for read replicas)
const stats = await getRegistrationStatsAnalytics();
```

**Note:** Read replica configuration is done at the Supabase project level. The functions are designed to work efficiently on read replicas by using materialized views.

## Migration

The advanced optimizations migration is located at:
`supabase/migrations/20251226000000_advanced_database_optimizations.sql`

To apply:

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor
# Copy and paste the migration SQL
```

## Maintenance

### Cache Cleanup

Set up a scheduled job to clean expired cache entries:

```sql
-- Run daily (via cron or scheduled function)
SELECT cleanup_expired_cache();
```

### Materialized View Refresh

Refresh materialized views periodically:

```sql
-- Refresh all views (run every hour or after bulk operations)
SELECT * FROM refresh_all_materialized_views();
```

Or via TypeScript:
```typescript
await refreshAllMaterializedViews();
```


