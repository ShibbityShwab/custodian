import { logger } from './utils/logger.js';
import { getScheduledEntries } from './recurringState.js';
import { cleanupMessages } from './commands/clean.js';
import { rest } from './restClient.js';

export async function runRecurringCleanups() {
  const now = Date.now();

  for (const [, cleanup] of getScheduledEntries()) {
    const intervalMs = cleanup.intervalMinutes * 60 * 1000;
    if (now - cleanup.lastRun < intervalMs) continue;

    try {
      logger.info(`Running recurring cleanup for channel ${cleanup.channelId}`);
      const deleted = await cleanupMessages(rest, cleanup.channelId, cleanup.olderThan);
      cleanup.lastRun = now;
      logger.info(`Recurring cleanup for ${cleanup.channelId} deleted ${deleted} messages`);
    } catch (error) {
      logger.error(error, `Recurring cleanup failed for channel ${cleanup.channelId}`);
    }
  }
}
