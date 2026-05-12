// src/config.js
import { z } from 'zod';

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform(Number),
  DATABASE_URL: z.string().url(),
  DISCORD_BOT_TOKEN: z.string(),
  CLIENT_ID: z.string(),
  PUBLIC_KEY: z.string(),
});

const _config = configSchema.parse(process.env);

export const config = Object.freeze(_config);
