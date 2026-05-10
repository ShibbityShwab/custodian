import { serve } from '@hono/node-server';
import cron from 'node-cron';
import app, { runScheduledTasks } from './index.js';
import { getPool, closePool } from './utils/db.js';
import { logger } from './utils/logger.js';

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'DISCORD_BOT_TOKEN', 'CLIENT_ID', 'PUBLIC_KEY'];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    console.error(errorMsg);
    process.exit(1);
  }
}

validateEnv();

// Eagerly initialize the pool so any connection errors surface early
getPool();

const PORT = process.env.PORT || 3000;

let running = false;
const task = cron.schedule('* * * * *', async () => {
  if (running) {
    logger.warn('Scheduled tasks still running; skipping this tick to prevent overlap');
    return;
  }
  running = true;
  try {
    await runScheduledTasks();
  } catch (err) {
    logger.error(err, 'Scheduled task error');
  } finally {
    running = false;
  }
});

const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
  logger.info(`Custodian listening on port ${info.port}`);
});

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  task.stop();
  server.close(async () => {
    await closePool();
    logger.info('Closed DB pool. Exiting.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
