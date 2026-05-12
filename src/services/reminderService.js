// src/services/reminderService.js
import { ReminderRepository } from '../repositories/reminderRepository.js';

class ReminderService {
  constructor() {
    this.repository = new ReminderRepository();
  }

  async getPending() {
    return await this.repository.getPending();
  }

  async create({ channelId, userId, message, expiresAt }) {
    return await this.repository.create({
      channel_id: channelId,
      user_id: userId,
      message,
      expires_at: expiresAt,
    });
  }

  async delete(id, userId) {
    return await this.repository.delete(id, userId);
  }

  async getActiveByChannel(channelId, userId) {
    return await this.repository.getActiveByChannel(channelId, userId);
  }
}

export const reminderService = new ReminderService();
