import 'dotenv/config';
import { serve } from '@hono/node-server';
import cron from 'node-cron';
import app, { runRecurringCleanups, getScheduledEntries } from './index.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';
import { startDiscordClient, stopDiscordClient } from './discordClient.js';
import { rest } from './restClient.js';
import { Routes } from 'discord-api-types/v10';
import { commands } from './commands/definitions.js';

let serverInstance = null;
let cronTask = null;

function shutdown(signal) {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  stopDiscordClient().catch((err) => {
    logger.error(err, 'Error stopping Discord client');
  });
  if (cronTask) cronTask.stop();
  if (serverInstance) {
    serverInstance.close(() => {
      logger.info('Server closed. Exiting.');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

async function deployCommands() {
  try {
    logger.info('Registering slash commands...');

    const currentNames = new Set(commands.map((c) => c.name));

    // Fetch currently registered commands and delete any stale ones
    const existingCommands = await rest.get(Routes.applicationCommands(config.CLIENT_ID));
    const staleCommands = existingCommands.filter((cmd) => !currentNames.has(cmd.name));

    if (staleCommands.length > 0) {
      logger.info(
        `Cleaning up ${staleCommands.length} stale command(s): ${staleCommands.map((c) => c.name).join(', ')}`
      );
      await Promise.all(
        staleCommands.map((cmd) =>
          rest.delete(`${Routes.applicationCommands(config.CLIENT_ID)}/${cmd.id}`)
        )
      );
    }

    await rest.put(Routes.applicationCommands(config.CLIENT_ID), { body: commands });
    logger.info('Slash commands registered.');
  } catch (error) {
    logger.error(error, 'Failed to register commands; continuing anyway...');
  }
}

async function start() {
  await deployCommands();

  const PORT = config.PORT || 3000;

  let runningScheduled = false;
  cronTask = cron.schedule('* * * * *', async () => {
    if (getScheduledEntries().size === 0) return;
    if (runningScheduled) {
      logger.warn('Scheduled tasks still running; skipping this tick');
      return;
    }
    runningScheduled = true;
    try {
      await runRecurringCleanups();
    } catch (err) {
      logger.error(err, 'Scheduled task error');
    } finally {
      runningScheduled = false;
    }
  });

  serverInstance = serve({ fetch: app.fetch, port: PORT }, (info) => {
    logger.info(`Custodian listening on port ${info.port}`);
  });

  try {
    await startDiscordClient();
  } catch (error) {
    logger.error(error, 'Failed to start Discord client; continuing anyway...');
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule || process.argv[1]?.endsWith('server.js')) {
  start();
}

export { start, deployCommands };
