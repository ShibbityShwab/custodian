import pino from 'pino';

/**
 * Structured logger instance using pino.
 * In production, set LOG_LEVEL to control verbosity (default: info).
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
