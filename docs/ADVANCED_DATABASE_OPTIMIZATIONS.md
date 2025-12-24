# Advanced Database Optimizations

This document describes the advanced database optimizations implemented for the JengaHacks application.

## Overview

The advanced optimizations include:

1. **Full-Text Search Indexes** - GIN indexes for fast text search with relevance ranking
2. **Query Result Caching** - Database-level caching for frequently accessed queries
3. **Connection Pooling Metrics** - Monitoring and tracking of database connection usage
4. **Additional Materialized Views** - Pre-computed views for common analytics queries
5. **Read Replica Support** - Functions optimized for read replica usage

## Full-Text Search

### Implementation

Full-text search uses PostgreSQL's GIN (Generalized Inverted Index) indexes for fast text searching:

```sql
-- Individual column indexes
CREATE INDEX idx_registrations_full_name_fts ON registrations 
USING gin(to_tsvector('english', coalesce(full_name, '')));

CREATE INDEX idx_registrations_email_fts ON registrations 
USING gin(to_tsvector('english', coalesce(email, '')));

-- Combined search index
CREATE INDEX idx_registrations_search_fts ON registrations 
USING gin(to_tsvector('english', 
  coalesce(full_name, '') || ' ' || 
  coalesce(email, '') || ' ' || 
  coalesce(linkedin_url, '')
));
```

### Usage

The `getPaginatedRegistrations` function automatically uses full-text search when a search term is provided:

```typescript
import { getPaginatedRegistrations } from '@/lib/dbQueries';

// Full-text search with relevance ranking
const result = await getPaginatedRegistrations({
  search: 'john doe',
  sortBy: 'rank', // Sort by relevance
  useFullTextSearch: true // default
});
```

### Benefits

- **Faster searches**: GIN indexes provide O(log n) search performance
- **Relevance ranking**: Results are ranked by relevance to search terms
- **Better accuracy**: Handles partial matches and word boundaries better than ILIKE

## Query Result Caching

### Implementation

Database-level caching stores query results in a dedicated table:

```sql
CREATE TABLE query_cache (
  cache_key TEXT PRIMARY KEY,
  cache_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  query_type TEXT NOT NULL,
  hit_count INTEGER DEFAULT 0
);
```

### Usage

```typescript
import { getCachedQuery, setCachedQuery } from '@/lib/dbQueries';

// Try cache first
let stats = await getCachedQuery<RegistrationStats>('stats:all', 'stats');
if (!stats) {
  // Fetch fresh data
  stats = await getRegistrationStats();
  // Cache for 5 minutes (300 seconds)
  await setCachedQuery('stats:all', stats, 300, 'stats');
}
```

### Cache Management

```typescript
// Clear expired cache entries manually
import { callRpc } from '@/lib/supabaseRpc';
await callRpc('clear_expired_cache', {});
```

### Benefits

- **Reduced database load**: Frequently accessed queries are cached
- **Faster response times**: Cached results return instantly
- **Hit tracking**: Monitor cache effectiveness via `hit_count`

## Connection Pooling Metrics

### Implementation

Connection pool metrics are tracked in a dedicated table:

```sql
CREATE TABLE connection_pool_metrics (
  timestamp TIMESTAMP WITH TIME ZONE,
  active_connections INTEGER,
  idle_connections INTEGER,
  waiting_connections INTEGER,
  max_connections INTEGER,
  utilization_percent NUMERIC(5, 2)
);
```

### Usage

```typescript
import { 
  recordConnectionPoolMetrics, 
  getConnectionPoolMetrics 
} from '@/lib/dbQueries';

// Record metrics (call periodically)
await recordConnectionPoolMetrics({
  active: 10,
  idle: 5,
  waiting: 0,
  max: 100,
  totalQueries: 1000,
  avgQueryTimeMs: 45.2,
  notes: 'Peak hours'
});

// Get metrics for last 24 hours
const metrics = await getConnectionPoolMetrics(24);
```

### Monitoring

Use metrics to:
- Identify connection pool bottlenecks
- Optimize pool size configuration
- Track query performance trends
- Plan capacity scaling

## Additional Materialized Views

### Views Created

1. **`registration_daily_trends`** - Daily registration counts for last 90 days
2. **`registration_hourly_patterns`** - Hourly registration patterns
3. **`registration_sources`** - Breakdown by source type (LinkedIn, Resume, Basic)

### Usage

```typescript
import { refreshAllMaterializedViews } from '@/lib/dbQueries';

// Refresh all views (call periodically or after bulk operations)
await refreshAllMaterializedViews();
```

### Querying Views

```sql
-- Get daily trends
SELECT * FROM registration_daily_trends 
ORDER BY date DESC 
LIMIT 30;

-- Get hourly patterns
SELECT * FROM registration_hourly_patterns 
ORDER BY hour;

-- Get source breakdown
SELECT * FROM registration_sources;
```

### Refresh Strategy

- **After bulk operations**: Refresh immediately after bulk inserts/updates
- **Periodic refresh**: Refresh every hour via scheduled job
- **On-demand**: Refresh when viewing analytics dashboard

## Read Replica Support

### Implementation

Analytics functions are optimized to use materialized views, making them ideal for read replicas:

```sql
-- Function optimized for read replicas
SELECT * FROM get_registration_stats_analytics();
```

### Usage

```typescript
import { getRegistrationStatsAnalytics } from '@/lib/dbQueries';

// Use analytics function (works efficiently on read replicas)
const stats = await getRegistrationStatsAnalytics();
```

### Benefits

- **Reduced load on primary**: Analytics queries run on read replicas
- **Better performance**: Read replicas handle read-heavy workloads
- **Scalability**: Can scale read capacity independently

### Configuration

Read replicas are configured at the Supabase project level. The functions automatically work efficiently on read replicas by using materialized views.

## Maintenance

### Cache Cleanup

Set up a scheduled job to clean expired cache entries:

```sql
-- Run daily (via cron or scheduled function)
SELECT cleanup_expired_cache();
```

Or via Supabase Edge Function or cron job:

```typescript
// Edge function or scheduled task
import { callRpc } from '@/lib/supabaseRpc';
await callRpc('cleanup_expired_cache', {});
```

### Materialized View Refresh

Refresh materialized views periodically:

```sql
-- Refresh all views
SELECT * FROM refresh_all_materialized_views();
```

Or via TypeScript:

```typescript
import { refreshAllMaterializedViews } from '@/lib/dbQueries';
await refreshAllMaterializedViews();
```

### Recommended Schedule

- **Cache cleanup**: Daily at 2 AM
- **Materialized view refresh**: Every hour
- **Connection pool metrics**: Record every 5 minutes

## Performance Impact

### Expected Improvements

- **Search Performance**: 70-90% faster with full-text search indexes
- **Cache Hit Rate**: 60-80% for frequently accessed queries
- **Analytics Queries**: 80-95% faster using materialized views
- **Read Replica Load**: 50-70% reduction on primary database

### Monitoring

Monitor optimization effectiveness:

```sql
-- Check cache hit rates
SELECT 
  query_type,
  COUNT(*) as total_entries,
  SUM(hit_count) as total_hits,
  AVG(hit_count) as avg_hits_per_entry
FROM query_cache
GROUP BY query_type;

-- Check connection pool utilization
SELECT 
  AVG(utilization_percent) as avg_utilization,
  MAX(utilization_percent) as max_utilization,
  COUNT(*) as metric_count
FROM connection_pool_metrics
WHERE timestamp >= now() - INTERVAL '24 hours';
```

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

## Troubleshooting

### Full-Text Search Not Working

1. Verify indexes exist:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'registrations' 
   AND indexname LIKE '%fts%';
   ```

2. Test search function:
   ```sql
   SELECT * FROM get_registrations_paginated_fts(10, 0, 'test', 'rank', 'DESC');
   ```

### Cache Not Working

1. Check cache table:
   ```sql
   SELECT COUNT(*) FROM query_cache;
   SELECT * FROM query_cache ORDER BY created_at DESC LIMIT 10;
   ```

2. Verify functions exist:
   ```sql
   SELECT proname FROM pg_proc 
   WHERE proname IN ('get_cached_query', 'set_cached_query');
   ```

### Materialized Views Not Refreshing

1. Check view exists:
   ```sql
   SELECT schemaname, matviewname 
   FROM pg_matviews 
   WHERE schemaname = 'public';
   ```

2. Test refresh:
   ```sql
   REFRESH MATERIALIZED VIEW registration_stats;
   ```

## Best Practices

1. **Use full-text search** for search queries with multiple words
2. **Cache expensive queries** that don't change frequently
3. **Refresh materialized views** after bulk operations
4. **Monitor connection pool** metrics to optimize pool size
5. **Use read replicas** for analytics and reporting queries

