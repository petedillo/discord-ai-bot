// Logger utility with environment-based log levels

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

const LOG_LEVEL_MAP: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
  silent: LogLevel.SILENT,
};

export class Logger {
  private readonly level: LogLevel;
  private readonly timestamps: boolean;
  private readonly prefix: string;

  constructor(level: LogLevel, timestamps: boolean, prefix = '') {
    this.level = level;
    this.timestamps = timestamps;
    this.prefix = prefix;
  }

  /**
   * Format a log message with optional timestamp and prefix
   */
  private format(message: string): string {
    const parts: string[] = [];

    if (this.timestamps) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    parts.push(message);
    return parts.join(' ');
  }

  /**
   * Log debug-level message (dev-only verbose logging)
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(this.format(message), ...args);
    }
  }

  /**
   * Log info-level message (operational status)
   */
  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.format(message), ...args);
    }
  }

  /**
   * Log warning-level message (non-fatal issues)
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.format(message), ...args);
    }
  }

  /**
   * Log error-level message (errors and failures)
   */
  error(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.format(message), ...args);
    }
  }

  /**
   * Print raw, unformatted output (for banners, etc.)
   * Always prints regardless of log level
   */
  raw(message: string): void {
    console.log(message);
  }

  /**
   * Create a child logger with an additional prefix
   */
  child(prefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${prefix}` : prefix;
    return new Logger(this.level, this.timestamps, newPrefix);
  }

  /**
   * Get the current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }
}

/**
 * Parse log level from environment variable
 */
function parseLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();

  if (envLevel && envLevel in LOG_LEVEL_MAP) {
    return LOG_LEVEL_MAP[envLevel]!;
  }

  // Default based on NODE_ENV
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? LogLevel.INFO : LogLevel.DEBUG;
}

/**
 * Determine if timestamps should be shown
 */
function shouldShowTimestamps(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Singleton logger instance
export const logger = new Logger(parseLogLevel(), shouldShowTimestamps());

export default logger;
