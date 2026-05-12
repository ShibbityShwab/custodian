// src/server.js
import { serve } from '@hono/node-server';
import cron from 'node-cron';
import app, { runScheduledTasks } from './index.js';
import { getPool, closePool } from './utils/db.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './migrate.js';
import { deployCommands } from '../deploy-commands.js';
import { config } from './config.js';

const shutdown = (signal, task, server) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  task.stop();
  server.close(async () => {
    await closePool();
    logger.info('Closed DB pool. Exiting.');
    process.exit(0);
  });
};

async function start() {
  // Config validation happens automatically when importing config.js
  // If any required variables are missing or invalid, it will throw there

  try {
    // 1. Run Migrations
    await runMigrations();

    // 2. Deploy Commands (Idempotent)
    await deployCommands();

    // 3. Start DB pool
    getPool();

    const PORT = config.PORT || 3000;

    let runningScheduled = false;
    const task = cron.schedule('* * * * *', async () => {
      if (runningScheduled) {
        logger.warn('Scheduled tasks still running; skipping this tick');
        return;
      }
      runningScheduled = true;
      try {
        await runScheduledTasks();
      } catch (err) {
        logger.error(err, 'Scheduled task error');
      } finally {
        runningScheduled = false;
      }
    });

    const server = serve({ fetch: app.fetch, port: PORT }, (info) => {
      logger.info(`Custodian listening on port ${info.port}`);
    });

    process.on('SIGTERM', () => shutdown('SIGTERM', task, server));
    process.on('SIGINT', () => shutdown('SIGINT', task, server));
  } catch (error) {
    logger.error(error, 'Failed to start application');
    process.exit(1);
  }
}

start();
