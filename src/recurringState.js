import { logger } from './utils/logger.js';

const recurringCleanups = new Map();

export function registerRecurringCleanup(channelId, guildId, intervalMinutes, olderThan) {
  const key = `${guildId}:${channelId}`;
  recurringCleanups.set(key, {
    channelId,
    guildId,
    intervalMinutes,
    olderThan,
    lastRun: Date.now() - intervalMinutes * 60 * 1000,
  });
  logger.info(`Registered recurring cleanup for channel ${channelId} every ${intervalMinutes}min`);
}

export function unregisterRecurringCleanup(channelId, guildId) {
  const key = `${guildId}:${channelId}`;
  const existed = recurringCleanups.has(key);
  recurringCleanups.delete(key);
  if (existed) {
    logger.info(`Unregistered recurring cleanup for channel ${channelId}`);
  }
  return existed;
}

export function getGuildSchedules(guildId) {
  const results = [];
  for (const [key, cleanup] of recurringCleanups) {
    if (key.startsWith(`${guildId}:`)) {
      results.push({
        channelId: cleanup.channelId,
        guildId: cleanup.guildId,
        intervalMinutes: cleanup.intervalMinutes,
        olderThan: cleanup.olderThan,
        lastRun: cleanup.lastRun,
      });
    }
  }
  return results;
}

export function getScheduledEntries() {
  return recurringCleanups;
}
