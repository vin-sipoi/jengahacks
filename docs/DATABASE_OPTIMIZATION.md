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

## Future Optimizations

- [ ] Add full-text search index for better search performance
- [ ] Implement query result caching
- [ ] Add database connection pooling metrics
- [ ] Create additional materialized views for common queries
- [ ] Implement read replicas for analytics queries

