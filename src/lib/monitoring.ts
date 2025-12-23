/**
 * Comprehensive monitoring and alerting system
 * 
 * Provides:
 * - Custom metrics tracking
 * - Performance monitoring
 * - Health checks
 * - Alerting mechanisms
 * - Uptime monitoring
 * 
 * Usage:
 *   import { monitor } from '@/lib/monitoring';
 *   
 *   monitor.trackMetric('api_response_time', 150);
 *   monitor.checkHealth();
 *   monitor.alert('error_rate_high', { rate: 0.15 });
 */

import { logger } from './logger';
import * as Sentry from '@sentry/react';
import {
  DEFAULT_MONITORING_RESPONSE_TIME_THRESHOLD_MS,
  DEFAULT_MONITORING_ERROR_RATE_THRESHOLD,
  DEFAULT_MONITORING_MEMORY_THRESHOLD_MB,
  DEFAULT_MONITORING_API_ERROR_RATE_THRESHOLD,
} from './constants';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: string;
  context?: Record<string, unknown>;
  resolved?: boolean;
}

export interface HealthCheck {
  name: string;
  status: HealthStatus;
  message?: string;
  timestamp: string;
  duration?: number;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableAlerts: boolean;
  enableHealthChecks: boolean;
  enableSentry: boolean;
  enableWebhooks: boolean;
  webhookUrl?: string;
  alertThresholds: {
    errorRate: number; // percentage (0-1)
    responseTime: number; // milliseconds
    memoryUsage: number; // megabytes
    apiErrorRate: number; // percentage (0-1)
  };
  healthCheckInterval: number; // milliseconds
  metricsRetention: number; // number of metrics to keep
}

class Monitoring {
  private config: MonitoringConfig;
  private metrics: Metric[] = [];
  private alerts: Alert[] = [];
  private healthChecks: Map<string, HealthCheck> = new Map();
  private healthCheckIntervalId: number | null = null;
  private isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  // Performance tracking
  private performanceMetrics: {
    pageLoadTime?: number;
    apiResponseTimes: number[];
    errorCount: number;
    requestCount: number;
    memoryUsage: number[];
  } = {
    apiResponseTimes: [],
    errorCount: 0,
    requestCount: 0,
    memoryUsage: [],
  };

  constructor() {
    this.config = {
      enableMetrics: this.isDevelopment || import.meta.env.VITE_MONITORING_ENABLED === 'true',
      enableAlerts: import.meta.env.VITE_MONITORING_ALERTS === 'true',
      enableHealthChecks: this.isDevelopment || import.meta.env.VITE_MONITORING_HEALTH === 'true',
      enableSentry: import.meta.env.VITE_SENTRY_ENABLED === 'true',
      enableWebhooks: import.meta.env.VITE_MONITORING_WEBHOOK_URL !== undefined,
      webhookUrl: import.meta.env.VITE_MONITORING_WEBHOOK_URL,
      alertThresholds: {
        errorRate: parseFloat(import.meta.env.VITE_MONITORING_ERROR_RATE_THRESHOLD || String(DEFAULT_MONITORING_ERROR_RATE_THRESHOLD)),
        responseTime: parseInt(import.meta.env.VITE_MONITORING_RESPONSE_TIME_THRESHOLD || String(DEFAULT_MONITORING_RESPONSE_TIME_THRESHOLD_MS), 10),
        memoryUsage: parseInt(import.meta.env.VITE_MONITORING_MEMORY_THRESHOLD || String(DEFAULT_MONITORING_MEMORY_THRESHOLD_MB), 10),
        apiErrorRate: parseFloat(import.meta.env.VITE_MONITORING_API_ERROR_RATE_THRESHOLD || String(DEFAULT_MONITORING_API_ERROR_RATE_THRESHOLD)),
      },
      healthCheckInterval: parseInt(import.meta.env.VITE_MONITORING_HEALTH_CHECK_INTERVAL || '60000', 10), // 60s
      metricsRetention: parseInt(import.meta.env.VITE_MONITORING_METRICS_RETENTION || '1000', 10),
    };

    // Initialize performance monitoring
    if (typeof window !== 'undefined' && this.config.enableMetrics) {
      this.initializePerformanceMonitoring();
      this.startHealthChecks();
    }

    // Expose to window for debugging
    if (this.isDevelopment && typeof window !== 'undefined') {
      (window as unknown as { monitor: Monitoring }).monitor = this;
      logger.info('Monitoring system initialized', { config: this.config });
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Track page load time
    if (document.readyState === 'complete') {
      this.trackPageLoad();
    } else {
      window.addEventListener('load', () => this.trackPageLoad());
    }

    // Track memory usage (if available)
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        this.performanceMetrics.memoryUsage.push(usedMB);
        this.trackMetric('memory_usage', usedMB, { unit: 'MB' });
        
        // Keep only last 100 measurements
        if (this.performanceMetrics.memoryUsage.length > 100) {
          this.performanceMetrics.memoryUsage.shift();
        }
      }, 30000); // Every 30 seconds
    }

    // Track Core Web Vitals
    this.trackWebVitals();
  }

  /**
   * Track page load time
   */
  private trackPageLoad(): void {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      this.performanceMetrics.pageLoadTime = loadTime;
      this.trackMetric('page_load_time', loadTime, { unit: 'ms' });
    }

    // Use Navigation Timing API v2 if available
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.trackMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart, { unit: 'ms' });
            }
          }
        });
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        logger.debug('PerformanceObserver not supported', { error: e });
      }
    }
  }

  /**
   * Track Core Web Vitals
   */
  private trackWebVitals(): void {
    if (!('PerformanceObserver' in window)) return;

    // Largest Contentful Paint (LCP)
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { 
          renderTime?: number; 
          loadTime?: number;
        };
        const lcp = lastEntry.renderTime || lastEntry.loadTime || 0;
        this.trackMetric('lcp', lcp, { unit: 'ms' });
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      logger.debug('LCP tracking not supported', { error: e });
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number;
            startTime?: number;
          };
          if (fidEntry.processingStart && fidEntry.startTime) {
            this.trackMetric('fid', fidEntry.processingStart - fidEntry.startTime, { unit: 'ms' });
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      logger.debug('FID tracking not supported', { error: e });
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as PerformanceEntry & {
            hadRecentInput?: boolean;
            value?: number;
          };
          if (!layoutShiftEntry.hadRecentInput && layoutShiftEntry.value) {
            clsValue += layoutShiftEntry.value;
            this.trackMetric('cls', clsValue, { unit: 'score' });
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      logger.debug('CLS tracking not supported', { error: e });
    }
  }

  /**
   * Track a custom metric
   */
  trackMetric(name: string, value: number, tags?: Record<string, string>): void {
    if (!this.config.enableMetrics) return;

    const metric: Metric = {
      name,
      type: 'gauge',
      value,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.metrics.push(metric);

    // Enforce retention limit
    if (this.metrics.length > this.config.metricsRetention) {
      this.metrics.shift();
    }

    // Check thresholds and alert if needed
    this.checkThresholds(name, value);

    // Send to Sentry if enabled
    if (this.config.enableSentry) {
      Sentry.setMeasurement(name, value, 'none');
    }

    logger.debug('Metric tracked', { name, value, tags });
  }

  /**
   * Track API response time
   */
  trackApiResponseTime(endpoint: string, duration: number, success: boolean): void {
    this.performanceMetrics.requestCount++;
    this.performanceMetrics.apiResponseTimes.push(duration);
    
    // Keep only last 100 measurements
    if (this.performanceMetrics.apiResponseTimes.length > 100) {
      this.performanceMetrics.apiResponseTimes.shift();
    }

    if (!success) {
      this.performanceMetrics.errorCount++;
    }

    this.trackMetric('api_response_time', duration, {
      endpoint,
      success: success.toString(),
    });

    // Calculate and track error rate
    const errorRate = this.performanceMetrics.errorCount / this.performanceMetrics.requestCount;
    this.trackMetric('api_error_rate', errorRate, { unit: 'ratio' });

    // Alert if thresholds exceeded
    if (duration > this.config.alertThresholds.responseTime) {
      this.alert('slow_api_response', 'high', `API response time exceeded threshold: ${duration}ms`, {
        endpoint,
        duration,
        threshold: this.config.alertThresholds.responseTime,
      });
    }

    if (errorRate > this.config.alertThresholds.apiErrorRate) {
      this.alert('high_api_error_rate', 'critical', `API error rate exceeded threshold: ${(errorRate * 100).toFixed(2)}%`, {
        errorRate,
        threshold: this.config.alertThresholds.apiErrorRate,
      });
    }
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: Record<string, unknown>): void {
    this.performanceMetrics.errorCount++;
    
    const errorRate = this.performanceMetrics.errorCount / Math.max(this.performanceMetrics.requestCount, 1);
    this.trackMetric('error_count', this.performanceMetrics.errorCount);
    this.trackMetric('error_rate', errorRate, { unit: 'ratio' });

    // Alert if error rate exceeds threshold
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.alert('high_error_rate', 'critical', `Error rate exceeded threshold: ${(errorRate * 100).toFixed(2)}%`, {
        errorRate,
        threshold: this.config.alertThresholds.errorRate,
        error: error.message,
        ...context,
      });
    }
  }

  /**
   * Check metric thresholds and alert if exceeded
   */
  private checkThresholds(metricName: string, value: number): void {
    if (!this.config.enableAlerts) return;

    // Memory usage threshold
    if (metricName === 'memory_usage' && value > this.config.alertThresholds.memoryUsage) {
      this.alert('high_memory_usage', 'high', `Memory usage exceeded threshold: ${value.toFixed(2)}MB`, {
        metric: metricName,
        value,
        threshold: this.config.alertThresholds.memoryUsage,
      });
    }

    // Response time threshold
    if (metricName === 'api_response_time' && value > this.config.alertThresholds.responseTime) {
      this.alert('slow_response_time', 'medium', `Response time exceeded threshold: ${value}ms`, {
        metric: metricName,
        value,
        threshold: this.config.alertThresholds.responseTime,
      });
    }
  }

  /**
   * Create an alert
   */
  alert(
    id: string,
    severity: AlertSeverity,
    message: string,
    context?: Record<string, unknown>
  ): void {
    if (!this.config.enableAlerts) return;

    const alert: Alert = {
      id,
      severity,
      message,
      timestamp: new Date().toISOString(),
      context,
      resolved: false,
    };

    // Check if alert already exists and unresolved
    const existingAlert = this.alerts.find(a => a.id === id && !a.resolved);
    if (existingAlert) {
      // Update existing alert
      existingAlert.message = message;
      existingAlert.timestamp = alert.timestamp;
      existingAlert.context = { ...existingAlert.context, ...context };
      return;
    }

    this.alerts.push(alert);

    // Log alert with correct method signatures
    if (severity === 'critical') {
      // error() accepts (message, error?, context?)
      logger.error(`Alert: ${message}`, new Error(message), context);
    } else if (severity === 'high') {
      // warn() only accepts (message, context?)
      logger.warn(`Alert: ${message}`, {
        ...context,
        alertId: id,
        severity,
      });
    } else {
      // info() only accepts (message, context?)
      logger.info(`Alert: ${message}`, {
        ...context,
        alertId: id,
        severity,
      });
    }

    // Send to Sentry
    if (this.config.enableSentry && (severity === 'critical' || severity === 'high')) {
      Sentry.captureMessage(message, {
        level: severity === 'critical' ? 'error' : 'warning',
        tags: {
          alert_id: id,
          severity,
        },
        extra: context,
      });
    }

    // Send webhook if configured
    if (this.config.enableWebhooks && this.config.webhookUrl) {
      this.sendWebhook(alert).catch(err => {
        logger.error('Failed to send webhook alert', err);
      });
    }

    logger.info('Alert created', { id, severity, message });
  }

  /**
   * Send alert to webhook
   */
  private async sendWebhook(alert: Alert): Promise<void> {
    if (!this.config.webhookUrl) return;

    try {
      await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alert: {
            id: alert.id,
            severity: alert.severity,
            message: alert.message,
            timestamp: alert.timestamp,
            context: alert.context,
          },
          source: 'jengahacks-monitoring',
        }),
      });
    } catch (error) {
      logger.error('Webhook alert failed', error as Error);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(id: string): void {
    const alert = this.alerts.find(a => a.id === id && !a.resolved);
    if (alert) {
      alert.resolved = true;
      alert.timestamp = new Date().toISOString();
      logger.info('Alert resolved', { id });
    }
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    if (!this.config.enableHealthChecks) return;

    // Run initial health check
    this.checkHealth();

    // Schedule periodic health checks
    this.healthCheckIntervalId = window.setInterval(() => {
      this.checkHealth();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health check
   */
  checkHealth(): HealthCheck[] {
    const checks: HealthCheck[] = [];

    // Check memory usage
    if ('memory' in performance) {
      const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const status: HealthStatus = usedMB > this.config.alertThresholds.memoryUsage ? 'degraded' : 'healthy';
      
      checks.push({
        name: 'memory_usage',
        status,
        message: `Memory usage: ${usedMB.toFixed(2)}MB`,
        timestamp: new Date().toISOString(),
      });
    }

    // Check error rate
    const errorRate = this.performanceMetrics.errorCount / Math.max(this.performanceMetrics.requestCount, 1);
    const errorRateStatus: HealthStatus = 
      errorRate > this.config.alertThresholds.errorRate ? 'unhealthy' :
      errorRate > this.config.alertThresholds.errorRate * 0.7 ? 'degraded' : 'healthy';
    
    checks.push({
      name: 'error_rate',
      status: errorRateStatus,
      message: `Error rate: ${(errorRate * 100).toFixed(2)}%`,
      timestamp: new Date().toISOString(),
    });

    // Check API response times
    if (this.performanceMetrics.apiResponseTimes.length > 0) {
      const avgResponseTime = this.performanceMetrics.apiResponseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.apiResponseTimes.length;
      const responseTimeStatus: HealthStatus = 
        avgResponseTime > this.config.alertThresholds.responseTime ? 'degraded' : 'healthy';
      
      checks.push({
        name: 'api_response_time',
        status: responseTimeStatus,
        message: `Average response time: ${avgResponseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString(),
      });
    }

    // Store health checks
    checks.forEach(check => {
      this.healthChecks.set(check.name, check);
    });

    return checks;
  }

  /**
   * Get overall health status
   */
  getHealthStatus(): HealthStatus {
    const checks = Array.from(this.healthChecks.values());
    
    if (checks.some(c => c.status === 'unhealthy')) {
      return 'unhealthy';
    }
    if (checks.some(c => c.status === 'degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }

  /**
   * Get metrics
   */
  getMetrics(filter?: { name?: string; since?: Date }): Metric[] {
    let filtered = [...this.metrics];

    if (filter?.name) {
      filtered = filtered.filter(m => m.name === filter.name);
    }

    if (filter?.since) {
      filtered = filtered.filter(m => new Date(m.timestamp) >= filter.since!);
    }

    return filtered;
  }

  /**
   * Get alerts
   */
  getAlerts(resolved?: boolean): Alert[] {
    if (resolved === undefined) {
      return [...this.alerts];
    }
    return this.alerts.filter(a => a.resolved === resolved);
  }

  /**
   * Get health checks
   */
  getHealthChecks(): HealthCheck[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(): {
    pageLoadTime?: number;
    avgApiResponseTime?: number;
    errorRate: number;
    memoryUsage?: number;
    requestCount: number;
  } {
    const avgResponseTime = this.performanceMetrics.apiResponseTimes.length > 0
      ? this.performanceMetrics.apiResponseTimes.reduce((a, b) => a + b, 0) / this.performanceMetrics.apiResponseTimes.length
      : undefined;

    const avgMemory = this.performanceMetrics.memoryUsage.length > 0
      ? this.performanceMetrics.memoryUsage.reduce((a, b) => a + b, 0) / this.performanceMetrics.memoryUsage.length
      : undefined;

    const errorRate = this.performanceMetrics.requestCount > 0
      ? this.performanceMetrics.errorCount / this.performanceMetrics.requestCount
      : 0;

    return {
      pageLoadTime: this.performanceMetrics.pageLoadTime,
      avgApiResponseTime: avgResponseTime,
      errorRate,
      memoryUsage: avgMemory,
      requestCount: this.performanceMetrics.requestCount,
    };
  }

  /**
   * Update configuration
   */
  configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Monitoring configuration updated', { config: this.config });
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.healthCheckIntervalId !== null) {
      window.clearInterval(this.healthCheckIntervalId);
      this.healthCheckIntervalId = null;
    }
  }
}

// Create singleton instance
export const monitor = new Monitoring();

