// src/repositories/reminderRepository.js
import {
  getPendingReminders as dbGetPendingReminders,
  saveReminder as dbSaveReminder,
  deleteReminder as dbDeleteReminder,
  getActiveRemindersByChannel as dbGetActiveRemindersByChannel,
} from '../utils/db.js';

export class ReminderRepository {
  async getPending() {
    return await dbGetPendingReminders();
  }

  async create(reminderData) {
    return await dbSaveReminder(reminderData);
  }

  async delete(id, userId) {
    return await dbDeleteReminder(id, userId);
  }

  async getActiveByChannel(channelId, userId) {
    return await dbGetActiveRemindersByChannel(channelId, userId);
  }
}
