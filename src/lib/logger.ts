/**
 * Logger utility for structured logging with automatic sensitive data sanitization.
 *
 * **ALWAYS use this logger instead of `console` for all logging.**
 *
 * ## Usage Philosophy
 * - **Only log problems** (errors/warnings), not success states
 * - `error` and `warn` are visible in production
 * - `info` and `debug` are development-only
 * - Logger automatically sanitizes sensitive data (passwords, tokens, emails, API keys)
 *
 * ## Examples
 *
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * // ✅ Good - only log errors
 * try {
 *   return await saveData();
 * } catch (error) {
 *   logger.error('Failed to save', {
 *     error: error instanceof Error ? error.message : String(error)
 *   });
 * }
 *
 * // ❌ Bad - don't log success (creates noise)
 * logger.info('Data saved successfully');
 *
 * // ✅ Good - contextual error logging
 * logger.error('API request failed', {
 *   endpoint: '/api/generate',
 *   statusCode: response.status
 * });
 *
 * // ✅ Good - development debugging (dev-only)
 * logger.debug('Processing state', { state, userId });
 *
 * // ✅ Good - warnings for recoverable issues
 * logger.warn('Invalid input received', { field: 'email', value });
 * ```
 *
 * ## Log Levels
 * - `error()` - Actual errors requiring attention (visible in prod)
 * - `warn()` - Data validation issues, recoverable errors (visible in prod)
 * - `info()` - Operation flow tracking (dev-only)
 * - `debug()` - Detailed debugging information (dev-only)
 *
 * @module logger
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      // Remove sensitive keys
      if (this.isSensitiveKey(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize string values that might contain sensitive data
      if (typeof value === 'string') {
        sanitized[key] = this.sanitizeString(value);
      } else if (value && typeof value === 'object') {
        sanitized[key] = this.sanitizeContext(value as LogContext);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'token',
      'authorization',
      'apikey',
      'api_key',
      'secret',
      'key',
      'auth',
      'bearer',
      'credential',
      'cookie',
      'session',
      'email',
      'username',
      'user',
    ];

    return sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive));
  }

  private sanitizeString(str: string): string {
    // Remove common patterns that might be sensitive
    return str
      .replace(/Bearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
      .replace(/sk-[a-zA-Z0-9]{48}/g, '[API_KEY_REDACTED]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]')
      .replace(/password[=:]\s*[^\s&]+/gi, 'password=[REDACTED]');
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    // Only log in development or for errors in production
    if (!this.isDevelopment && level !== 'error') {
      return;
    }

    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? this.sanitizeContext(context) : {};

    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...(Object.keys(sanitizedContext).length > 0 && { context: sanitizedContext }),
    };

    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry));
        break;
      case 'warn':
        console.warn(JSON.stringify(logEntry));
        break;
      case 'info':
        console.info(JSON.stringify(logEntry));
        break;
      case 'debug':
        console.log(JSON.stringify(logEntry));
        break;
    }
  }

  /**
   * Log an error that requires attention.
   * Visible in both development and production.
   *
   * @param message - Human-readable error description
   * @param context - Additional context (auto-sanitizes sensitive data)
   *
   * @example
   * logger.error('Failed to generate content', {
   *   error: error.message,
   *   endpoint: '/api/generate'
   * });
   */
  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  /**
   * Log a warning for recoverable issues or data validation problems.
   * Visible in both development and production.
   *
   * @param message - Warning description
   * @param context - Additional context (auto-sanitizes sensitive data)
   *
   * @example
   * logger.warn('Invalid prompt length', { length: prompt.length, maxLength: 5000 });
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * Log informational messages about operation flow.
   * Development-only (silent in production).
   *
   * @param message - Info description
   * @param context - Additional context (auto-sanitizes sensitive data)
   *
   * @example
   * logger.info('Starting content generation', { mode: 'prompt' });
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * Log detailed debugging information.
   * Development-only (silent in production).
   *
   * @param message - Debug description
   * @param context - Additional context (auto-sanitizes sensitive data)
   *
   * @example
   * logger.debug('API response received', { statusCode: 200, bodyLength: 1234 });
   */
  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }
}

export const logger = new Logger();
