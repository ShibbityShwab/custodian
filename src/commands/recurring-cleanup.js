import { cleanupMessages } from './cleanup.js';
import { isValidTimeFormat } from '../utils/parseTime.js';
import logger from '../utils/logger.js';

const recurringCleanupsMap = new Map();

function isCleanupTaskRunning(channelId) {
  return recurringCleanupsMap.has(channelId) && recurringCleanupsMap.get(channelId).isRunning;
}

export async function setRecurringCleanup(channelId, guildId, intervalMinutes, client, periodInput) {
  if (!channelId || !guildId || !intervalMinutes || !client || !periodInput) {
    throw new Error('Missing required parameters for recurring cleanup');
  }

  if (intervalMinutes < 1) {
    throw new Error('Interval must be at least 1 minute');
  }

  if (!isValidTimeFormat(periodInput)) {
    throw new Error('Invalid period format. Use format like "30s", "15m", or "1h"');
  }

  if (isCleanupTaskRunning(channelId)) {
    throw new Error('A recurring cleanup task is already running for this channel');
  }

  const channel = await client.channels.fetch(channelId).catch(error => {
    logger.error(`Failed to fetch channel ${channelId}:`, error);
    throw new Error('Failed to fetch channel');
  });

  if (!channel) {
    throw new Error('Channel not found');
  }

  // Start the recurring cleanup task
  const intervalId = setInterval(async () => {
    try {
      await cleanupMessages(channel, periodInput, guildId);
      const task = recurringCleanupsMap.get(channelId);
      if (task) {
        task.lastRun = Date.now();
        recurringCleanupsMap.set(channelId, task);
      }
    } catch (error) {
      logger.error(`Error in recurring cleanup for channel ${channelId}:`, error);
      // If the channel is deleted or inaccessible, cancel the cleanup
      if (error.code === 10003 || error.code === 50001) {
        logger.info(`Cancelling recurring cleanup for channel ${channelId} due to channel access error`);
        cancelRecurringCleanup(channelId);
      }
    }
  }, intervalMinutes * 60 * 1000);

  // Save the task details
  recurringCleanupsMap.set(channelId, {
    guildId,
    intervalMinutes,
    intervalId,
    periodInput,
    isRunning: true,
    lastRun: null,
    client,
    startTime: Date.now()
  });

  logger.info(`Recurring cleanup set for channel ${channelId} with interval ${intervalMinutes} minutes`);
}

export function viewCleanupSchedule() {
  if (recurringCleanupsMap.size === 0) {
    return 'No active recurring cleanups.';
  }

  const schedule = [];
  recurringCleanupsMap.forEach((value, channelId) => {
    if (value.intervalId) {
      const uptime = Math.floor((Date.now() - value.startTime) / 1000 / 60); // in minutes
      schedule.push(
        `Channel: <#${channelId}>\n` +
        `• Interval: ${value.intervalMinutes} minutes\n` +
        `• Age threshold: ${value.periodInput}\n` +
        `• Last run: ${value.lastRun ? new Date(value.lastRun).toLocaleString() : 'Never'}\n` +
        `• Running for: ${uptime} minutes\n`
      );
    }
  });

  return '**Active Recurring Cleanups:**\n\n' + schedule.join('\n');
}

export function cancelRecurringCleanup(channelId) {
  const task = recurringCleanupsMap.get(channelId);
  if (!task) {
    throw new Error('No recurring cleanup task found for this channel');
  }

  if (task.intervalId) {
    clearInterval(task.intervalId);
    recurringCleanupsMap.delete(channelId);
    logger.info(`Recurring cleanup cancelled for channel ${channelId}`);
    return true;
  }
  return false;
}

export function editRecurringCleanup(channelId, newIntervalMinutes) {
  if (newIntervalMinutes < 1) {
    throw new Error('Interval must be at least 1 minute');
  }

  const task = recurringCleanupsMap.get(channelId);
  if (!task) {
    throw new Error('No recurring cleanup task found for this channel');
  }

  if (task.intervalId) {
    clearInterval(task.intervalId);
    recurringCleanupsMap.delete(channelId);

    // Restart the task with the new interval
    setRecurringCleanup(
      channelId,
      task.guildId,
      newIntervalMinutes,
      task.client,
      task.periodInput
    );

    logger.info(`Recurring cleanup edited for channel ${channelId} to interval ${newIntervalMinutes} minutes`);
    return true;
  }
  return false;
}

// Cleanup function to be called on bot shutdown
export function cleanupAllRecurringTasks() {
  recurringCleanupsMap.forEach((task, channelId) => {
    if (task.intervalId) {
      clearInterval(task.intervalId);
      logger.info(`Cleaned up recurring task for channel ${channelId}`);
    }
  });
  recurringCleanupsMap.clear();
}
