/**
 * Development-only request/response logging utility
 * 
 * Automatically logs all Supabase client requests, Edge Function invocations, and responses.
 * Only active in development mode (when `import.meta.env.DEV` is true).
 * 
 * Usage:
 * - Logs are automatically displayed in the browser console
 * - Access logs programmatically: `window.requestLogger.getLogs()`
 * - Clear logs: `window.requestLogger.clearLogs()`
 * - Export logs: `window.requestLogger.exportLogs()`
 * 
 * Logged operations:
 * - Database queries (SELECT, INSERT, UPDATE, DELETE)
 * - Storage operations (UPLOAD, DOWNLOAD, CREATE_SIGNED_URL, REMOVE, LIST)
 * - Edge Function invocations
 * - RPC function calls
 * 
 * Sensitive data (passwords, tokens, API keys) is automatically redacted.
 * 
 * Note: This is separate from the main logger system. For general application logging,
 * use the logger from '@/lib/logger'.
 */

const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

interface LogEntry {
  timestamp: string;
  type: 'database' | 'storage' | 'function' | 'rpc' | 'auth';
  method: string;
  endpoint?: string;
  request?: unknown;
  response?: unknown;
  error?: unknown;
  duration?: number;
}

class RequestLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep last 100 logs in memory

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private sanitizeData(data: unknown): unknown {
    if (!data) return data;
    
    try {
      const str = JSON.stringify(data);
      // Remove sensitive data patterns
      return JSON.parse(
        str
          .replace(/password["\s]*:["\s]*[^,}\]]+/gi, '"password": "[REDACTED]"')
          .replace(/token["\s]*:["\s]*[^,}\]]+/gi, '"token": "[REDACTED]"')
          .replace(/apikey["\s]*:["\s]*[^,}\]]+/gi, '"apikey": "[REDACTED]"')
          .replace(/authorization["\s]*:["\s]*[^,}\]]+/gi, '"authorization": "[REDACTED]"')
      );
    } catch {
      return data;
    }
  }

  private getLogColor(type: LogEntry['type']): string {
    const colors: Record<LogEntry['type'], string> = {
      database: '#3b82f6', // blue
      storage: '#10b981', // green
      function: '#8b5cf6', // purple
      rpc: '#f59e0b', // amber
      auth: '#ef4444', // red
    };
    return colors[type] || '#6b7280';
  }

  log(entry: Omit<LogEntry, 'timestamp'>): void {
    if (!isDevelopment) return;

    const fullEntry: LogEntry = {
      ...entry,
      timestamp: this.formatTimestamp(),
    };

    this.logs.push(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    this.printLog(fullEntry);
  }

  private printLog(entry: LogEntry): void {
    const color = this.getLogColor(entry.type);
    const style = `color: ${color}; font-weight: bold;`;
    const resetStyle = 'color: inherit; font-weight: normal;';

    console.group(
      `%c[${entry.type.toUpperCase()}]%c ${entry.method} ${entry.endpoint || ''}`,
      style,
      resetStyle
    );

    console.log(`%cTimestamp:`, 'color: #6b7280;', entry.timestamp);
    
    if (entry.duration !== undefined) {
      const durationColor = entry.duration > 1000 ? '#ef4444' : entry.duration > 500 ? '#f59e0b' : '#10b981';
      console.log(`%cDuration:`, `color: ${durationColor};`, `${entry.duration}ms`);
    }

    if (entry.request) {
      console.log('%cRequest:', 'color: #3b82f6; font-weight: bold;', this.sanitizeData(entry.request));
    }

    if (entry.error) {
      console.error('%cError:', 'color: #ef4444; font-weight: bold;', entry.error);
    } else if (entry.response) {
      console.log('%cResponse:', 'color: #10b981; font-weight: bold;', this.sanitizeData(entry.response));
    }

    console.groupEnd();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
    if (isDevelopment) {
      console.log('%c[Request Logger] Logs cleared', 'color: #6b7280;');
    }
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const requestLogger = new RequestLogger();

// Expose logger to window for debugging (development only)
if (isDevelopment && typeof window !== 'undefined') {
  (window as unknown as { requestLogger: RequestLogger }).requestLogger = requestLogger;
  
  // Add console helper
  console.log(
    '%c[Request Logger]%c Available at window.requestLogger',
    'color: #8b5cf6; font-weight: bold;',
    'color: inherit;'
  );
  console.log(
    '%c  - requestLogger.getLogs() - View all logs',
    'color: #6b7280;'
  );
  console.log(
    '%c  - requestLogger.clearLogs() - Clear logs',
    'color: #6b7280;'
  );
  console.log(
    '%c  - requestLogger.exportLogs() - Export logs as JSON',
    'color: #6b7280;'
  );
}

