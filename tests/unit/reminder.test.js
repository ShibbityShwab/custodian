import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleReminderCommand } from '../../src/commands/reminder.js';
import { getPendingReminders } from '../../src/utils/db.js';

// Mock Discord.js interaction
const createMockInteraction = (options = {}) => {
  const reply = vi.fn(async (content) => ({ id: 'reply123', content }));
  const followUp = vi.fn(async (content) => ({ id: 'followup123', content }));
  const deferReply = vi.fn(async () => {});
  const editReply = vi.fn(async (content) => ({ id: 'edit123', content }));
  return {
    options: {
      getChannel: (name) => ({
        id: '123456789',
        send: async (message) => ({ id: 'msg123', content: message }),
      }),
      getString: (name) => {
        if (name === 'message') {
          return options.message || '';
        }
        return options[name] || '1h';
      },
      getInteger: (name) => options[name] || 60,
    },
    reply,
    followUp,
    deferReply,
    editReply,
  };
};

describe('Reminder Command', () => {
  beforeEach(() => {
    // Reset any global state
    global.reminders = new Map();
  });

  afterEach(() => {
    // Clean up after each test
    global.reminders.clear();
  });

  it('should create a reminder with valid time input', async () => {
    const interaction = createMockInteraction({
      time: '1h',
      message: 'Test reminder',
    });

    await handleReminderCommand(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Reminder set'),
        ephemeral: true,
      })
    );
  });

  it('should handle invalid time format', async () => {
    const interaction = createMockInteraction({
      time: 'invalid',
      message: 'Test reminder',
    });

    await handleReminderCommand(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Invalid time format. Please use format like "30s", "5m", or "2h"'),
        ephemeral: true,
      })
    );
  });

  it('should handle empty message', async () => {
    const interaction = createMockInteraction({
      time: '1h',
      message: '',
    });

    await handleReminderCommand(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Please provide a message for the reminder'),
        ephemeral: true,
      })
    );
  });

  it('should handle very long time periods', async () => {
    const interaction = createMockInteraction({
      time: '1000d',
      message: 'Test reminder',
    });

    await handleReminderCommand(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Invalid time format. Please use format like "30s", "5m", or "2h"'),
        ephemeral: true,
      })
    );
  });
}); 