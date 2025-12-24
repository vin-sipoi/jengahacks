import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  formatViolationType,
  formatIdentifier,
  trackClientRateLimitViolation,
} from './rateLimitTracking';
import { monitor } from './monitoring';
import { trackEvent } from './analytics';
import { logger } from './logger';

// Mock dependencies
vi.mock('./monitoring', () => ({
  monitor: {
    trackMetric: vi.fn(),
  },
}));

vi.mock('./analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('./logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

describe('rateLimitTracking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatViolationType', () => {
    it('should format email type correctly', () => {
      expect(formatViolationType('email')).toBe('Email');
    });

    it('should format ip type correctly', () => {
      expect(formatViolationType('ip')).toBe('IP Address');
    });

    it('should format client type correctly', () => {
      expect(formatViolationType('client')).toBe('Client-Side');
    });

    it('should return original value for unknown types', () => {
      expect(formatViolationType('unknown')).toBe('unknown');
      expect(formatViolationType('custom_type')).toBe('custom_type');
    });
  });

  describe('formatIdentifier', () => {
    describe('email formatting', () => {
      it('should mask email addresses correctly', () => {
        expect(formatIdentifier('john.doe@example.com', 'email')).toBe('joh***@example.com');
        expect(formatIdentifier('test@domain.org', 'email')).toBe('tes***@domain.org');
      });

      it('should handle short local parts', () => {
        expect(formatIdentifier('ab@example.com', 'email')).toBe('ab***@example.com');
        expect(formatIdentifier('a@example.com', 'email')).toBe('a***@example.com');
      });

      it('should return original if email format is invalid', () => {
        expect(formatIdentifier('invalid-email', 'email')).toBe('invalid-email');
        expect(formatIdentifier('@example.com', 'email')).toBe('@example.com');
      });
    });

    describe('IP address formatting', () => {
      it('should mask IPv4 addresses correctly', () => {
        expect(formatIdentifier('192.168.1.100', 'ip')).toBe('192.168.1.***');
        expect(formatIdentifier('10.0.0.1', 'ip')).toBe('10.0.0.***');
        expect(formatIdentifier('172.16.0.1', 'ip')).toBe('172.16.0.***');
      });

      it('should mask IPv6 addresses correctly', () => {
        expect(formatIdentifier('2001:0db8:85a3:0000:0000:8a2e:0370:7334', 'ip')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:***');
        expect(formatIdentifier('::1', 'ip')).toBe('::***');
      });

      it('should return original if IP format is invalid', () => {
        expect(formatIdentifier('not-an-ip', 'ip')).toBe('not-an-ip');
        expect(formatIdentifier('192.168', 'ip')).toBe('192.168');
      });
    });

    describe('other types', () => {
      it('should return original identifier for non-email/IP types', () => {
        expect(formatIdentifier('some-identifier', 'client')).toBe('some-identifier');
        expect(formatIdentifier('user123', 'unknown')).toBe('user123');
      });
    });
  });

  describe('trackClientRateLimitViolation', () => {
    it('should track violation with correct parameters', () => {
      trackClientRateLimitViolation('test-identifier', 3, 3600);

      expect(monitor.trackMetric).toHaveBeenCalledWith(
        'rate_limit_violation',
        1,
        expect.objectContaining({
          type: 'client',
          identifier: 'test-identifier',
          attempt_count: '3',
        })
      );

      expect(trackEvent).toHaveBeenCalledWith('rate_limit_violation', {
        violation_type: 'client',
        attempt_count: 3,
        retry_after: 3600,
      });

      expect(logger.warn).toHaveBeenCalledWith(
        'Rate limit violation (client-side)',
        expect.objectContaining({
          identifier: 'test-identifier',
          attempt_count: 3,
          retry_after: 3600,
        })
      );
    });

    it('should truncate long identifiers', () => {
      const longIdentifier = 'a'.repeat(100);
      trackClientRateLimitViolation(longIdentifier, 5);

      expect(monitor.trackMetric).toHaveBeenCalledWith(
        'rate_limit_violation',
        1,
        expect.objectContaining({
          identifier: 'a'.repeat(50), // Truncated to 50 chars
        })
      );
    });

    it('should handle missing retryAfter parameter', () => {
      trackClientRateLimitViolation('test-id', 2);

      expect(trackEvent).toHaveBeenCalledWith('rate_limit_violation', {
        violation_type: 'client',
        attempt_count: 2,
        retry_after: undefined,
      });
    });

    it('should not throw on tracking errors', () => {
      vi.spyOn(monitor, 'trackMetric').mockImplementation(() => {
        throw new Error('Tracking failed');
      });

      // Should not throw
      expect(() => {
        trackClientRateLimitViolation('test-id', 1);
      }).not.toThrow();
    });
  });
});

