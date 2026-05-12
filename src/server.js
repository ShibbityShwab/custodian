// src/server.js
import { serve } from '@hono/node-server';
import cron from 'node-cron';
import app, { runScheduledTasks } from './index.js';
import { getPool, closePool } from './utils/db.js';
import { logger } from './utils/logger.js';
import { runMigrations } from './migrate.js';
import { deployCommands } from '../deploy-commands.js';
import { config } from './config.js';
import { startDiscordClient, stopDiscordClient } from './discordClient.js';

let serverInstance = null;
let cronTask = null;

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopDiscordClient().catch((err) => {
    logger.error(err, 'Error stopping Discord client');
  });
  if (cronTask) cronTask.stop();
  if (serverInstance) {
    serverInstance.close(async () => {
      await closePool();
      logger.info('Closed DB pool. Exiting.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

async function start() {
  // Config validation happens automatically when importing config.js
  // If any required variables are missing or invalid, it will throw there.

  try {
    // 1. Run Migrations
    await runMigrations();

    // 2. Start DB pool (needed for health checks)
    getPool();
  } catch (error) {
    logger.error(error, 'Failed to initialize application');
    process.exit(1);
  }

  // 3. Deploy Commands (best-effort — don't crash if Discord API is unavailable)
  try {
    await deployCommands();
  } catch (error) {
    logger.error(error, 'Failed to deploy Discord commands; continuing anyway...');
  }

  const PORT = config.PORT || 3000;

  // 4. Start cron job for scheduled tasks
  let runningScheduled = false;
  cronTask = cron.schedule('* * * * *', async () => {
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

  // 5. Start HTTP server
  serverInstance = serve({ fetch: app.fetch, port: PORT }, (info) => {
    logger.info(`Custodian listening on port ${info.port}`);
  });

  // 6. Start Discord client for online presence
  try {
    await startDiscordClient();
  } catch (error) {
    logger.error(error, 'Failed to start Discord client; continuing anyway...');
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
