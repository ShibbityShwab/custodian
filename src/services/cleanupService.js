// src/services/cleanupService.js
import { CleanupRepository } from '../repositories/cleanupRepository.js';
import { logger } from '../utils/logger.js';
import { cleanupMessages } from '../commands/cleanup.js';

class CleanupService {
  constructor() {
    this.repository = new CleanupRepository();
  }

  async getRecurring() {
    return await this.repository.getRecurring();
  }

  async updateLastRun(channelId, lastRun) {
    return await this.repository.updateLastRun(channelId, lastRun);
  }

  async runScheduledCleanups(rest) {
    const cleanups = await this.getRecurring();
    const now = Date.now();

    for (const cleanup of cleanups) {
      const lastRun = cleanup.last_run || 0;
      const intervalMs = cleanup.interval_minutes * 60 * 1000;

      if (now - lastRun >= intervalMs) {
        try {
          logger.info(`Running scheduled cleanup for channel ${cleanup.channel_id}`);
          await cleanupMessages(rest, cleanup.channel_id, cleanup.period_input, false);
          await this.updateLastRun(cleanup.channel_id, now);
        } catch (error) {
          logger.error(error, `Scheduled cleanup failed for channel ${cleanup.channel_id}`);
        }
      }
    }
  }

  // For on-demand cleanup (from command)
  async runCleanup(channelId, periodInput, preview = false, rest) {
    logger.info(`Running cleanup for channel ${channelId} (preview: ${preview})`);
    await cleanupMessages(rest, channelId, periodInput, preview);
    // Note: We do not update last run for manual cleanups
  }
}

export const cleanupService = new CleanupService();
