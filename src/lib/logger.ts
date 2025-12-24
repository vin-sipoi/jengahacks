/**
 * Comprehensive logging system
 * 
 * Provides structured logging with multiple levels, Sentry integration,
 * and development/production modes.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   
 *   logger.debug('Debug message', { data });
 *   logger.info('Info message', { data });
 *   logger.warn('Warning message', { data });
 *   logger.error('Error message', error, { context });
 */

import * as Sentry from '@sentry/react';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: Error;
  stack?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableSentry: boolean;
  enablePersist: boolean;
  maxPersistedLogs: number;
}

class Logger {
  private config: LoggerConfig;
  private persistedLogs: LogEntry[] = [];
  private isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

  constructor() {
    // Determine log level from environment
    const envLevel = import.meta.env.VITE_LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
    const defaultLevel: LogLevel = this.isDevelopment ? 'debug' : 'warn';

    this.config = {
      level: envLevel || defaultLevel,
      enableConsole: this.isDevelopment || import.meta.env.VITE_LOG_CONSOLE === 'true',
      enableSentry: import.meta.env.VITE_SENTRY_ENABLED === 'true',
      enablePersist: this.isDevelopment || import.meta.env.VITE_LOG_PERSIST === 'true',
      maxPersistedLogs: parseInt(import.meta.env.VITE_LOG_MAX_PERSISTED || '100', 10),
    };

    // Expose logger to window for debugging (development only)
    if (this.isDevelopment && typeof window !== 'undefined') {
      (window as unknown as { logger: Logger }).logger = this;
      console.log(
        '%c[Logger]%c Initialized',
        'color: #8b5cf6; font-weight: bold;',
        'color: inherit;'
      );
      console.log(
        '%c  Level: %c' + this.config.level,
        'color: #6b7280;',
        'color: inherit; font-weight: bold;'
      );
      console.log(
        '%c  Console: %c' + (this.config.enableConsole ? 'enabled' : 'disabled'),
        'color: #6b7280;',
        'color: inherit;'
      );
      console.log(
        '%c  Sentry: %c' + (this.config.enableSentry ? 'enabled' : 'disabled'),
        'color: #6b7280;',
        'color: inherit;'
      );
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};
    const sensitiveKeys = ['password', 'token', 'apikey', 'authorization', 'secret', 'key', 'credential'];

    for (const [key, value] of Object.entries(context)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
        sanitized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        sanitized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    error?: Error,
    context?: LogContext
  ): LogEntry {
    // Only capture stack trace for actual errors or warnings
    // Don't capture stack for debug/info logs to avoid console noise
    let stack: string | undefined;
    if (error?.stack) {
      stack = error.stack;
    } else if (level === 'error' || level === 'warn') {
      // Only create Error for stack trace for errors/warnings
      // Use a try-catch to safely capture stack without throwing
      try {
        const stackError = new Error();
        // Access .stack property to trigger stack trace generation
        stack = stackError.stack;
      } catch {
        // Ignore if stack trace capture fails
        stack = undefined;
      }
    }

    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.sanitizeContext(context),
      error: error || undefined,
      stack,
    };
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const colors: Record<LogLevel, string> = {
      debug: '#6b7280', // gray
      info: '#3b82f6',  // blue
      warn: '#f59e0b',  // amber
      error: '#ef4444', // red
    };

    const color = colors[entry.level];
    const style = `color: ${color}; font-weight: bold;`;
    const resetStyle = 'color: inherit; font-weight: normal;';

    const consoleMethod = entry.level === 'error' ? 'error' : 
                         entry.level === 'warn' ? 'warn' : 
                         entry.level === 'info' ? 'info' : 'log';

    console[consoleMethod](
      `%c[${entry.level.toUpperCase()}]%c ${entry.message}`,
      style,
      resetStyle
    );

    if (entry.context && Object.keys(entry.context).length > 0) {
      console.log('%cContext:', 'color: #6b7280;', entry.context);
    }

    if (entry.error) {
      console.error(entry.error);
    }

    // Only show stack trace for errors/warnings, and only in development
    // Skip stack traces for debug/info logs to reduce console noise
    if (entry.stack && this.isDevelopment && (entry.level === 'error' || entry.level === 'warn')) {
      // Log stack as a string, not as an Error object
      // Use groupCollapsed to keep console clean
      console.groupCollapsed('%cStack Trace', 'color: #6b7280; font-size: 0.9em; cursor: pointer;');
      // Split stack into lines and log each line separately for better formatting
      const stackLines = entry.stack.split('\n');
      stackLines.forEach((line, index) => {
        if (index === 0) {
          console.log('%c' + line, 'color: #ef4444; font-weight: bold; font-family: monospace; font-size: 0.85em;');
        } else {
          console.log('%c' + line, 'color: #6b7280; font-family: monospace; font-size: 0.85em;');
        }
      });
      console.groupEnd();
    }
  }

  private logToSentry(entry: LogEntry): void {
    if (!this.config.enableSentry) return;

    // Only send errors and warnings to Sentry
    if (entry.level === 'error' && entry.error) {
      Sentry.captureException(entry.error, {
        level: 'error',
        tags: {
          logger: 'true',
        },
        extra: entry.context,
      });
    } else if (entry.level === 'warn') {
      Sentry.captureMessage(entry.message, {
        level: 'warning',
        tags: {
          logger: 'true',
        },
        extra: entry.context,
      });
    }
  }

  private persistLog(entry: LogEntry): void {
    if (!this.config.enablePersist) return;

    this.persistedLogs.push(entry);
    if (this.persistedLogs.length > this.config.maxPersistedLogs) {
      this.persistedLogs.shift();
    }
  }

  private log(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, error, context);

    this.logToConsole(entry);
    this.logToSentry(entry);
    this.persistLog(entry);
  }

  /**
   * Log debug messages (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, undefined, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, undefined, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, undefined, context);
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, error, context);
  }

  /**
   * Get all persisted logs
   */
  getLogs(): LogEntry[] {
    return [...this.persistedLogs];
  }

  /**
   * Clear persisted logs
   */
  clearLogs(): void {
    this.persistedLogs = [];
    if (this.isDevelopment) {
      console.log('%c[Logger]%c Logs cleared', 'color: #8b5cf6; font-weight: bold;', 'color: inherit;');
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.persistedLogs, null, 2);
  }

  /**
   * Download logs as a file
   */
  downloadLogs(filename = `logs-${new Date().toISOString()}.json`): void {
    const data = this.exportLogs();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Update logger configuration
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    if (this.isDevelopment) {
      console.log('%c[Logger]%c Configuration updated', 'color: #8b5cf6; font-weight: bold;', 'color: inherit;', this.config);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): Readonly<LoggerConfig> {
    return { ...this.config };
  }
}

// Create singleton instance
export const logger = new Logger();

// Integrate with log aggregation if enabled
if (import.meta.env.VITE_LOG_AGGREGATION_ENABLED === 'true') {
  // Dynamic import to avoid circular dependencies
  import('./logAggregation').then(({ integrateWithLogger }) => {
    integrateWithLogger(logger);
  }).catch((error) => {
    // Log to console to avoid circular dependency with logger
    // This is a non-critical failure - log aggregation is optional
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      console.warn('[Logger] Failed to integrate with log aggregation:', error);
    }
  });
}

// Export for testing
export { Logger };

