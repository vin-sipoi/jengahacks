/**
 * Health Check Endpoint
 * 
 * This page provides a health check endpoint that can be monitored by external
 * uptime monitoring services (UptimeRobot, Pingdom, etc.).
 * 
 * Returns JSON with application health status, performance metrics, and system information.
 */

import { useEffect, useState } from 'react';
import { monitor } from '@/lib/monitoring';
import type { HealthStatus, HealthCheck } from '@/lib/monitoring';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  health: {
    overall: HealthStatus;
    checks: HealthCheck[];
  };
  performance?: {
    pageLoadTime?: number;
    avgApiResponseTime?: number;
    errorRate: number;
    memoryUsage?: number;
  };
}

const Health = () => {
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);

  useEffect(() => {
    // Get health status
    const overallStatus = monitor.getHealthStatus();
    const healthChecks = monitor.getHealthChecks();
    const performanceSummary = monitor.getPerformanceSummary();

    // Calculate uptime (time since page load)
    const startTime = performance.timing?.navigationStart || Date.now();
    const uptime = Date.now() - startTime;

    const response: HealthResponse = {
      status: overallStatus === 'healthy' ? 'ok' : overallStatus === 'degraded' ? 'degraded' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime / 1000), // in seconds
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      health: {
        overall: overallStatus,
        checks: healthChecks,
      },
      performance: performanceSummary ? {
        pageLoadTime: performanceSummary.pageLoadTime,
        avgApiResponseTime: performanceSummary.avgApiResponseTime,
        errorRate: performanceSummary.errorRate,
        memoryUsage: performanceSummary.memoryUsage,
      } : undefined,
    };

    setHealthData(response);

    // Expose JSON data globally for programmatic access and monitoring services
    if (typeof window !== 'undefined') {
      (window as unknown as { healthData?: HealthResponse }).healthData = response;
      
      // Also inject as JSON-LD script tag for easy extraction
      const scriptId = 'health-data-json';
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.type = 'application/json';
        document.body.appendChild(script);
      }
      script.textContent = JSON.stringify(response);
    }
  }, []);

  // If healthData is null, show loading
  if (!healthData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking health status...</p>
        </div>
      </div>
    );
  }

  const statusColor = {
    ok: 'text-green-500',
    degraded: 'text-yellow-500',
    error: 'text-red-500',
  }[healthData.status];

  const statusBg = {
    ok: 'bg-green-500/10 border-green-500/20',
    degraded: 'bg-yellow-500/10 border-yellow-500/20',
    error: 'bg-red-500/10 border-red-500/20',
  }[healthData.status];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className={`border-2 rounded-lg p-6 mb-6 ${statusBg}`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Health Check</h1>
            <div className={`text-lg font-semibold ${statusColor}`}>
              {healthData.status.toUpperCase()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>{' '}
              <span className="font-medium">{healthData.health.overall}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Uptime:</span>{' '}
              <span className="font-medium">{healthData.uptime}s</span>
            </div>
            <div>
              <span className="text-muted-foreground">Version:</span>{' '}
              <span className="font-medium">{healthData.version}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Timestamp:</span>{' '}
              <span className="font-medium">
                {new Date(healthData.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {healthData.health.checks.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Health Checks</h2>
            <div className="space-y-2">
              {healthData.health.checks.map((check) => (
                <div
                  key={check.name}
                  className="border rounded-lg p-4 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium capitalize">
                      {check.name.replace(/_/g, ' ')}
                    </div>
                    {check.message && (
                      <div className="text-sm text-muted-foreground">
                        {check.message}
                      </div>
                    )}
                  </div>
                  <div
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      check.status === 'healthy'
                        ? 'bg-green-500/10 text-green-500'
                        : check.status === 'degraded'
                        ? 'bg-yellow-500/10 text-yellow-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {check.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {healthData.performance && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {healthData.performance.pageLoadTime !== undefined && (
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    Page Load Time
                  </div>
                  <div className="text-2xl font-bold">
                    {(healthData.performance.pageLoadTime / 1000).toFixed(2)}s
                  </div>
                </div>
              )}
              {healthData.performance.avgApiResponseTime !== undefined && (
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    Avg API Response
                  </div>
                  <div className="text-2xl font-bold">
                    {healthData.performance.avgApiResponseTime.toFixed(0)}ms
                  </div>
                </div>
              )}
              <div className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-1">
                  Error Rate
                </div>
                <div className="text-2xl font-bold">
                  {(healthData.performance.errorRate * 100).toFixed(2)}%
                </div>
              </div>
              {healthData.performance.memoryUsage !== undefined && (
                <div className="border rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">
                    Memory Usage
                  </div>
                  <div className="text-2xl font-bold">
                    {healthData.performance.memoryUsage.toFixed(0)}MB
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">API Endpoint</h3>
          <p className="text-sm text-muted-foreground mb-2">
            For programmatic access, the health data is available as JSON:
          </p>
          <div className="space-y-2">
            <code className="text-xs bg-background p-2 rounded block">
              GET /health
            </code>
            <p className="text-xs text-muted-foreground">
              Access JSON data: <code className="bg-background px-1 rounded">window.healthData</code> or check the page source for embedded JSON.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium">View JSON Data</summary>
              <pre className="mt-2 text-xs bg-background p-2 rounded overflow-auto max-h-64">
                {JSON.stringify(healthData, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Health;

