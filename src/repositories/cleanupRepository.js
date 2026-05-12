// src/repositories/cleanupRepository.js
import {
  getRecurringCleanups as dbGetRecurringCleanups,
  saveRecurringCleanup as dbSaveRecurringCleanup,
  deleteRecurringCleanup as dbDeleteRecurringCleanup,
  getRecurringCleanup as dbGetRecurringCleanup,
  updateRecurringCleanupLastRun as dbUpdateRecurringCleanupLastRun,
} from '../utils/db.js';

export class CleanupRepository {
  async getRecurring() {
    return await dbGetRecurringCleanups();
  }

  async getRecurringCleanup(channelId) {
    return await dbGetRecurringCleanup(channelId);
  }

  async saveRecurringCleanup(
    channelId,
    guildId,
    intervalMinutes,
    periodInput,
    preserveLastRun = false
  ) {
    return await dbSaveRecurringCleanup(
      channelId,
      guildId,
      intervalMinutes,
      periodInput,
      preserveLastRun
    );
  }

  async updateLastRun(channelId, lastRun) {
    return await dbUpdateRecurringCleanupLastRun(channelId, lastRun);
  }

  async deleteRecurringCleanup(channelId) {
    return await dbDeleteRecurringCleanup(channelId);
  }
}
