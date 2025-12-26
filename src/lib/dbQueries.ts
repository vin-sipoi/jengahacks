/**
 * Optimized database query utilities
 * Provides efficient query patterns and pagination support
 */

import { supabase } from "@/integrations/supabase/client";
import { callRpc } from "./supabaseRpc";

export interface PaginatedRegistrations {
  data: Array<{
    id: string;
    full_name: string;
    email: string;
    linkedin_url: string | null;
    resume_path: string | null;
    created_at: string;
    rank?: number; // Full-text search ranking
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface RegistrationStats {
  total: number;
  withLinkedIn: number;
  withResume: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
  dailyTrends: Array<{ date: string; count: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
}

/**
 * Get paginated registrations with optional search and sorting
 * Uses database function for optimal performance with full-text search support
 */
export async function getPaginatedRegistrations(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: "created_at" | "full_name" | "email" | "rank";
    sortOrder?: "ASC" | "DESC";
    useFullTextSearch?: boolean;
  } = {}
): Promise<PaginatedRegistrations> {
  const {
    limit = 50,
    offset = 0,
    search,
    sortBy = "created_at",
    sortOrder = "DESC",
    useFullTextSearch = true,
  } = options;

  try {
    // Use full-text search function if search term provided and enabled
    const functionName = search && useFullTextSearch 
      ? "get_registrations_paginated_fts" 
      : "get_registrations_paginated";

    const { data, error } = await callRpc<
      Array<{
        id: string;
        full_name: string;
        email: string;
        linkedin_url: string | null;
        resume_path: string | null;
        created_at: string;
        total_count: number;
        rank?: number;
      }>
    >(functionName, {
      p_limit: limit,
      p_offset: offset,
      p_search: search || null,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return {
        data: [],
        total: 0,
        limit,
        offset,
      };
    }

    // Extract total count from first row (all rows have same total_count)
    const total = data[0]?.total_count || 0;

    // Remove total_count from data, keep rank if present
    const registrations = data.map(({ total_count, ...rest }) => rest);

    return {
      data: registrations,
      total,
      limit,
      offset,
    };
  } catch (error) {
    // Fallback to direct query if RPC function fails
    // Only log warnings in development
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.warn("RPC function failed, falling back to direct query", error);
    }
    return getPaginatedRegistrationsFallback(options);
  }
}

/**
 * Fallback function using direct Supabase queries
 * Less efficient but more compatible
 */
async function getPaginatedRegistrationsFallback(
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: "created_at" | "full_name" | "email" | "rank";
    sortOrder?: "ASC" | "DESC";
  } = {}
): Promise<PaginatedRegistrations> {
  const {
    limit = 50,
    offset = 0,
    search,
    sortBy = "created_at",
    sortOrder = "DESC",
  } = options;

  // Build query
  let query = supabase
    .from("registrations")
    .select("*", { count: "exact" })
    .order(sortBy, { ascending: sortOrder === "ASC" })
    .range(offset, offset + limit - 1);

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    query = query.or(
      `full_name.ilike.%${searchLower}%,email.ilike.%${searchLower}%,linkedin_url.ilike.%${searchLower}%`
    );
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    data: data || [],
    total: count || 0,
    limit,
    offset,
  };
}

/**
 * Get registration statistics efficiently
 * Uses database function for optimal performance
 */
export async function getRegistrationStats(): Promise<RegistrationStats> {
  try {
    const { data, error } = await callRpc<RegistrationStats>("get_registration_stats", {});

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("No stats data returned");
    }

    return data;
  } catch (error) {
    // Fallback to direct query if RPC function fails
    // Only log warnings in development
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.warn("RPC function failed, falling back to direct query", error);
    }
    return getRegistrationStatsFallback();
  }
}

/**
 * Fallback function using direct Supabase queries
 * Less efficient but more compatible
 */
async function getRegistrationStatsFallback(): Promise<RegistrationStats> {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const thisWeek = new Date(now);
  thisWeek.setDate(thisWeek.getDate() - 7);

  const thisMonth = new Date(now);
  thisMonth.setMonth(thisMonth.getMonth() - 1);

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get all registrations (unfortunately, we need them for stats)
  // In production, consider using the materialized view or RPC function
  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("created_at, linkedin_url, resume_path")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!registrations) {
    return {
      total: 0,
      withLinkedIn: 0,
      withResume: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      dailyTrends: [],
      hourlyDistribution: [],
    };
  }

  // Calculate stats
  const stats: RegistrationStats = {
    total: registrations.length,
    withLinkedIn: registrations.filter((r) => r.linkedin_url).length,
    withResume: registrations.filter((r) => r.resume_path).length,
    today: registrations.filter((r) => new Date(r.created_at) >= today).length,
    thisWeek: registrations.filter((r) => new Date(r.created_at) >= thisWeek).length,
    thisMonth: registrations.filter((r) => new Date(r.created_at) >= thisMonth).length,
    dailyTrends: [],
    hourlyDistribution: [],
  };

  // Calculate daily trends
  const dailyTrendsMap = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split("T")[0];
    dailyTrendsMap.set(dateKey, 0);
  }

  registrations.forEach((r) => {
    const regDate = new Date(r.created_at);
    if (regDate >= thirtyDaysAgo) {
      const dateKey = regDate.toISOString().split("T")[0];
      dailyTrendsMap.set(dateKey, (dailyTrendsMap.get(dateKey) || 0) + 1);
    }
  });

  stats.dailyTrends = Array.from(dailyTrendsMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculate hourly distribution
  const hourlyMap = new Map<number, number>();
  for (let i = 0; i < 24; i++) {
    hourlyMap.set(i, 0);
  }

  registrations.forEach((r) => {
    const regDate = new Date(r.created_at);
    const hour = regDate.getHours();
    hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1);
  });

  stats.hourlyDistribution = Array.from(hourlyMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour);

  return stats;
}

/**
 * Refresh materialized view for stats (admin only)
 * Call this periodically or after bulk operations
 */
export async function refreshStatsView(): Promise<void> {
  // Materialized view refresh is not implemented - this is a no-op
  // The feature can be added later via database migration if needed
}

/**
 * Refresh all materialized views (admin only)
 * Call this periodically to keep views up to date
 */
export async function refreshAllMaterializedViews(): Promise<void> {
  // Materialized view refresh is not implemented - this is a no-op
  // The feature can be added later via database migration if needed
}

/**
 * Get cached query result from database cache
 */
export async function getCachedQuery<T>(
  cacheKey: string,
  queryType: string = 'general'
): Promise<T | null> {
  try {
    const { data, error } = await callRpc<T | null>("get_cached_query", {
      p_cache_key: cacheKey,
      p_query_type: queryType,
    });

    if (error) {
      return null;
    }

    return data || null;
  } catch (error) {
    return null;
  }
}

/**
 * Set cached query result in database cache
 */
export async function setCachedQuery<T>(
  cacheKey: string,
  cacheData: T,
  ttlSeconds: number = 300,
  queryType: string = 'general'
): Promise<void> {
  try {
    await callRpc("set_cached_query", {
      p_cache_key: cacheKey,
      p_cache_data: cacheData as any,
      p_ttl_seconds: ttlSeconds,
      p_query_type: queryType,
    });
  } catch (error) {
    // Cache setting failures are non-critical
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.warn("Could not set cached query", error);
    }
  }
}

/**
 * Get registration stats optimized for analytics (uses read replicas if available)
 */
export async function getRegistrationStatsAnalytics(): Promise<RegistrationStats | null> {
  try {
    const { data, error } = await callRpc<RegistrationStats>("get_registration_stats_analytics", {});

    if (error) {
      throw error;
    }

    return data || null;
  } catch (error) {
    // Fallback to regular stats function
    return getRegistrationStats();
  }
}

/**
 * Record connection pool metrics (for monitoring)
 */
export async function recordConnectionPoolMetrics(
  metrics: {
    active: number;
    idle: number;
    waiting: number;
    max: number;
    totalQueries?: number;
    avgQueryTimeMs?: number;
    notes?: string;
  }
): Promise<void> {
  try {
    await callRpc("record_connection_pool_metrics", {
      p_active: metrics.active,
      p_idle: metrics.idle,
      p_waiting: metrics.waiting,
      p_max: metrics.max,
      p_total_queries: metrics.totalQueries || 0,
      p_avg_query_time_ms: metrics.avgQueryTimeMs || null,
      p_notes: metrics.notes || null,
    });
  } catch (error) {
    // Metrics recording failures are non-critical
    const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
    if (isDevelopment) {
      console.warn("Could not record connection pool metrics", error);
    }
  }
}

/**
 * Get connection pool metrics for monitoring
 */
export interface ConnectionPoolMetrics {
  timestamp: string;
  active_connections: number;
  idle_connections: number;
  waiting_connections: number;
  max_connections: number;
  utilization_percent: number;
  total_queries: number;
  avg_query_time_ms: number | null;
}

export async function getConnectionPoolMetrics(
  hours: number = 24
): Promise<ConnectionPoolMetrics[]> {
  try {
    const { data, error } = await callRpc<ConnectionPoolMetrics[]>("get_connection_pool_metrics", {
      p_hours: hours,
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    return [];
  }
}

