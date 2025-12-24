import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getCacheHeaders,
  isResponseFresh,
  cachedFetch,
  CACHE_DURATIONS,
  CACHE_KEYS,
} from './cache';

describe('cache', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCacheHeaders', () => {
    it('should return static asset cache headers', () => {
      const headers = getCacheHeaders('static');
      expect(headers['Cache-Control']).toBe('public, max-age=31536000, immutable');
    });

    it('should return API cache headers', () => {
      const headers = getCacheHeaders('api');
      expect(headers['Cache-Control']).toBe('public, max-age=300, must-revalidate');
    });

    it('should return dynamic content cache headers', () => {
      const headers = getCacheHeaders('dynamic');
      expect(headers['Cache-Control']).toBe('no-cache, no-store, must-revalidate');
      expect(headers['Pragma']).toBe('no-cache');
      expect(headers['Expires']).toBe('0');
    });

    it('should default to API cache headers', () => {
      const headers = getCacheHeaders();
      expect(headers['Cache-Control']).toBe('public, max-age=300, must-revalidate');
    });
  });

  describe('isResponseFresh', () => {
    it('should return false if no cache headers present', () => {
      const response = new Response('', {
        headers: {},
      });
      expect(isResponseFresh(response)).toBe(false);
    });

    it('should return true for fresh responses with max-age', () => {
      const now = Date.now();
      const response = new Response('', {
        headers: {
          'Cache-Control': 'max-age=3600',
          'Date': new Date(now - 1000).toUTCString(), // 1 second ago
        },
      });
      expect(isResponseFresh(response)).toBe(true);
    });

    it('should return false for stale responses with max-age', () => {
      const now = Date.now();
      const response = new Response('', {
        headers: {
          'Cache-Control': 'max-age=1',
          'Date': new Date(now - 2000).toUTCString(), // 2 seconds ago
        },
      });
      expect(isResponseFresh(response)).toBe(false);
    });

    it('should return true for fresh responses with Expires header', () => {
      const futureDate = new Date(Date.now() + 3600000); // 1 hour from now
      const response = new Response('', {
        headers: {
          'Expires': futureDate.toUTCString(),
        },
      });
      expect(isResponseFresh(response)).toBe(true);
    });

    it('should return false for expired responses with Expires header', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const response = new Response('', {
        headers: {
          'Expires': pastDate.toUTCString(),
        },
      });
      expect(isResponseFresh(response)).toBe(false);
    });

    it('should prioritize max-age over Expires', () => {
      const now = Date.now();
      const pastDate = new Date(now - 3600000);
      const response = new Response('', {
        headers: {
          'Cache-Control': 'max-age=3600',
          'Date': new Date(now - 1000).toUTCString(),
          'Expires': pastDate.toUTCString(),
        },
      });
      // Should use max-age, which is fresh
      expect(isResponseFresh(response)).toBe(true);
    });
  });

  describe('cachedFetch', () => {
    const mockFetch = vi.fn();

    beforeEach(() => {
      global.fetch = mockFetch;
    });

    it('should return cached response if available and fresh', async () => {
      const url = 'https://api.example.com/data';
      const cacheKey = `fetch:${url}`;
      const cachedData = { data: 'cached' };
      
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: cachedData,
        timestamp: Date.now() - 1000, // 1 second ago
      }));

      const response = await cachedFetch(url, undefined, CACHE_DURATIONS.MEDIUM);
      const data = await response.json();

      expect(data).toEqual(cachedData);
      expect(response.headers.get('X-Cache')).toBe('HIT');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should fetch fresh data if cache is stale', async () => {
      const url = 'https://api.example.com/data';
      const cacheKey = `fetch:${url}`;
      
      // Set stale cache
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: { data: 'old' },
        timestamp: Date.now() - CACHE_DURATIONS.MEDIUM - 1000, // Older than cache duration
      }));

      const freshData = { data: 'fresh' };
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => freshData,
      } as Response);

      const response = await cachedFetch(url, undefined, CACHE_DURATIONS.MEDIUM);
      const data = await response.json();

      expect(data).toEqual(freshData);
      expect(mockFetch).toHaveBeenCalledWith(url, undefined);
    });

    it('should fetch and cache new data if no cache exists', async () => {
      const url = 'https://api.example.com/data';
      const freshData = { data: 'new' };
      
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => freshData,
      } as Response);

      const response = await cachedFetch(url, undefined, CACHE_DURATIONS.MEDIUM);
      const data = await response.json();

      expect(data).toEqual(freshData);
      expect(mockFetch).toHaveBeenCalledWith(url, undefined);

      // Verify cache was set
      const cacheKey = `fetch:${url}`;
      const cached = sessionStorage.getItem(cacheKey);
      expect(cached).toBeTruthy();
      
      const { data: cachedData } = JSON.parse(cached!);
      expect(cachedData).toEqual(freshData);
    });

    it('should not cache failed responses', async () => {
      const url = 'https://api.example.com/data';
      
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'failed' }),
      } as Response);

      await cachedFetch(url, undefined, CACHE_DURATIONS.MEDIUM);

      // Verify cache was not set
      const cacheKey = `fetch:${url}`;
      const cached = sessionStorage.getItem(cacheKey);
      expect(cached).toBeNull();
    });

    it('should use custom cache duration', async () => {
      const url = 'https://api.example.com/data';
      const customDuration = 1000; // 1 second
      const cacheKey = `fetch:${url}`;
      
      // Set cache that's fresh for custom duration but stale for default
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: { data: 'cached' },
        timestamp: Date.now() - 2000, // 2 seconds ago
      }));

      // Should fetch fresh because custom duration is shorter
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'fresh' }),
      } as Response);

      await cachedFetch(url, undefined, customDuration);
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe('CACHE_DURATIONS', () => {
    it('should have correct duration values', () => {
      expect(CACHE_DURATIONS.SHORT).toBe(5 * 60 * 1000); // 5 minutes
      expect(CACHE_DURATIONS.MEDIUM).toBe(15 * 60 * 1000); // 15 minutes
      expect(CACHE_DURATIONS.LONG).toBe(60 * 60 * 1000); // 1 hour
      expect(CACHE_DURATIONS.VERY_LONG).toBe(24 * 60 * 60 * 1000); // 24 hours
      expect(CACHE_DURATIONS.STATIC).toBe(365 * 24 * 60 * 60 * 1000); // 1 year
    });
  });

  describe('CACHE_KEYS', () => {
    it('should generate correct cache keys', () => {
      expect(CACHE_KEYS.blog.posts).toBe('blog:posts');
      expect(CACHE_KEYS.blog.post('123')).toBe('blog:post:123');
      expect(CACHE_KEYS.registration.waitlistStatus).toBe('registration:waitlist');
      expect(CACHE_KEYS.registration.stats).toBe('registration:stats');
      expect(CACHE_KEYS.admin.registrations).toBe('admin:registrations');
      expect(CACHE_KEYS.admin.stats).toBe('admin:stats');
    });
  });
});

