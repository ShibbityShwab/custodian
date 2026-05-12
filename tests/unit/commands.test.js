import { describe, it, expect, vi } from 'vitest';
import { handlerLogic as handleReminderCommand } from '../../src/commands/reminder.js';
import { handlerLogic as handleListRemindersCommand } from '../../src/commands/list-reminders.js';
import { handlerLogic as handleDeleteReminderCommand } from '../../src/commands/delete-reminder.js';
import { handlerLogic as handleHelpCommand } from '../../src/commands/help.js';
import { InteractionResponseType, MessageFlags } from '../../src/constants.js';

vi.mock('../../src/utils/db.js', () => ({
  saveReminder: vi.fn(),
  getActiveRemindersByChannel: vi.fn(),
  deleteReminder: vi.fn(),
}));

import { saveReminder, getActiveRemindersByChannel, deleteReminder } from '../../src/utils/db.js';

describe('Command handlers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleReminderCommand', () => {
    const baseInteraction = {
      guild_id: 'guild1',
      member: { user: { id: 'user1' } },
      data: {
        options: [
          { name: 'channel', value: 'channel1' },
          { name: 'time', value: '5m' },
          { name: 'message', value: 'Hello!' },
        ],
      },
    };

    it('should return error if message is empty', async () => {
      const interaction = {
        ...baseInteraction,
        data: {
          options: [
            { name: 'channel', value: 'channel1' },
            { name: 'time', value: '5m' },
            { name: 'message', value: '   ' },
          ],
        },
      };
      const result = await handleReminderCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.flags).toBe(MessageFlags.EPHEMERAL);
      expect(result.data.content).toContain('Please provide a message');
    });

    it('should return error on invalid time format', async () => {
      const interaction = {
        ...baseInteraction,
        data: {
          options: [
            { name: 'channel', value: 'channel1' },
            { name: 'time', value: 'invalid' },
            { name: 'message', value: 'Hello!' },
          ],
        },
      };
      const result = await handleReminderCommand(interaction);
      expect(result.data.content).toContain('Invalid time format');
    });

    it('should return success when saved', async () => {
      saveReminder.mockResolvedValue({ id: 1 });
      const result = await handleReminderCommand(baseInteraction);
      expect(saveReminder).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user1' }));
      expect(result.data.content).toContain('Reminder set for <#channel1>');
    });

    it('should return error when save fails', async () => {
      saveReminder.mockRejectedValue(new Error('DB error'));
      const result = await handleReminderCommand(baseInteraction);
      expect(result.data.content).toContain('Failed to save');
    });
  });

  describe('handleListRemindersCommand', () => {
    it('should return empty message when no reminders', async () => {
      getActiveRemindersByChannel.mockResolvedValue([]);
      const result = await handleListRemindersCommand({
        data: { options: [{ name: 'channel', value: 'ch1' }] },
        member: { user: { id: 'user1' } },
      });
      expect(result.data.content).toContain('No active reminders');
      expect(getActiveRemindersByChannel).toHaveBeenCalledWith('ch1', 'user1');
    });

    it('should return embed with reminders', async () => {
      getActiveRemindersByChannel.mockResolvedValue([
        { id: 1, channel_id: 'ch1', message: 'test', reminder_time: Date.now() + 60000 },
      ]);
      const result = await handleListRemindersCommand({
        data: { options: [] },
        member: { user: { id: 'user1' } },
      });
      expect(getActiveRemindersByChannel).toHaveBeenCalledWith(undefined, 'user1');
      expect(result.data.embeds).toBeDefined();
      expect(result.data.embeds[0].title).toBe('Active Reminders');
    });
  });

  describe('handleDeleteReminderCommand', () => {
    it('should return success when deleted', async () => {
      deleteReminder.mockResolvedValue(true);
      const result = await handleDeleteReminderCommand({
        data: { options: [{ name: 'id', value: 1 }] },
        member: { user: { id: 'user1' } },
      });
      expect(deleteReminder).toHaveBeenCalledWith(1, 'user1');
      expect(result.data.content).toContain('Successfully deleted');
    });

    it('should return failure when not found', async () => {
      deleteReminder.mockResolvedValue(false);
      const result = await handleDeleteReminderCommand({
        data: { options: [{ name: 'id', value: 99 }] },
        member: { user: { id: 'user1' } },
      });
      expect(deleteReminder).toHaveBeenCalledWith(99, 'user1');
      expect(result.data.content).toContain('Failed to delete');
    });
  });

  describe('handleHelpCommand', () => {
    it('should return help embed', async () => {
      const result = await handleHelpCommand();
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.embeds).toBeDefined();
      expect(result.data.embeds[0].title).toBe('Custodian Bot Commands');
    });
  });
});
