import pino from 'pino';
import { config } from '../config.js';

const tokenRedactor = () => {
  const token = config?.DISCORD_BOT_TOKEN;
  if (!token) return (value) => value;
  return (value) => {
    if (typeof value === 'string') {
      return value.replaceAll(token, '[REDACTED]');
    }
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.parse(JSON.stringify(value).replaceAll(token, '[REDACTED]'));
      } catch {
        return value;
      }
    }
    return value;
  };
};

const redactToken = tokenRedactor();

const serializers = {
  err: (err) => {
    const base = pino.stdSerializers.err(err);
    return redactToken(base);
  },
  msg: redactToken,
};

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  serializers,
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});
