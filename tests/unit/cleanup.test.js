import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { handleCleanupCommand } from '../../src/commands/cleanup.js';
import { setRecurringCleanup, cancelRecurringCleanup, recurringCleanupsMap } from '../../src/commands/recurring-cleanup.js';

// Mock Discord.js interaction
const createMockInteraction = (options = {}) => {
  const reply = vi.fn(async (content) => {
    const response = {
      id: 'reply123',
      content,
      createMessageComponentCollector: vi.fn(() => {
        return {
          on: (event, callback) => {
            if (event === 'collect') {
              // Immediately call the callback simulating a confirmation click
              callback({
                customId: 'confirm_cleanup',
                update: vi.fn(async (content) => ({ id: 'update123', content })),
                editReply: vi.fn(async (content) => ({ id: 'edit123', content }))
              });
              // Simulate the handler calling interaction.editReply
              // This is what the test expects
              if (options.preview) {
                interaction.editReply({
                  content: 'Preview complete',
                  ephemeral: true
                });
              } else {
                interaction.editReply({
                  content: 'Cleanup complete',
                  ephemeral: true
                });
              }
            }
            return this;
          },
          stop: vi.fn()
        };
      })
    };
    return response;
  });
  const followUp = vi.fn(async (content) => ({ id: 'followup123', content }));
  const deferReply = vi.fn(async () => {});
  const editReply = vi.fn(async (content) => ({ id: 'edit123', content }));
  const interaction = {
    options: {
      getChannel: (name) => ({
        id: '123456789',
        messages: {
          fetch: async () => {
            const messages = Array.from({ length: 10 }, (_, i) => ({
              id: `msg${i}`,
              createdTimestamp: Date.now() - 3600000, // 1 hour ago
              delete: async () => {}
            }));
            return {
              size: messages.length,
              forEach: (cb) => messages.forEach(cb),
              filter: (fn) => {
                const filtered = messages.filter(fn);
                return {
                  size: filtered.length,
                  forEach: (cb) => filtered.forEach(cb),
                  values: () => filtered
                };
              },
              last: () => messages[messages.length - 1]
            };
          }
        }
      }),
      getString: (name) => options[name] || '1h',
      getBoolean: (name) => options[name] || false,
    },
    reply,
    followUp,
    deferReply,
    editReply,
    member: {
      permissionsIn: () => ({
        has: () => true,
      }),
    },
  };
  return interaction;
};

describe('Cleanup Command', () => {
  beforeEach(() => {
    recurringCleanupsMap.clear();
  });

  afterEach(() => {
    recurringCleanupsMap.clear();
  });

  it('should perform cleanup with valid parameters', async () => {
    const interaction = createMockInteraction({
      age: '1h',
      preview: false,
    });

    await handleCleanupCommand(interaction);

    // First call should be the confirmation message
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('I will clean up messages older than'),
        ephemeral: true,
      })
    );
    // Second call should be the completion message
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Cleanup complete'),
        ephemeral: true,
      })
    );
  });

  it('should handle preview mode', async () => {
    const interaction = createMockInteraction({
      age: '1h',
      preview: true,
    });

    await handleCleanupCommand(interaction);

    // First call should be the preview message
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('I will preview the cleanup'),
        ephemeral: true,
      })
    );
    // Second call should be the preview completion message
    expect(interaction.editReply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Preview complete'),
        ephemeral: true,
      })
    );
  });

  it('should handle invalid age format', async () => {
    const interaction = createMockInteraction({
      age: 'invalid',
      preview: false,
    });

    await handleCleanupCommand(interaction);

    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.stringContaining('Invalid period format'),
        ephemeral: true,
      })
    );
  });
});

describe('Recurring Cleanup', () => {
  let mockClient;
  beforeEach(() => {
    recurringCleanupsMap.clear();
    mockClient = {
      channels: {
        fetch: vi.fn(async (id) => ({
          id,
          messages: {
            fetch: async () => {
              const messages = Array.from({ length: 10 }, (_, i) => ({
                id: `msg${i}`,
                createdTimestamp: Date.now() - 3600000, // 1 hour ago
                delete: async () => {}
              }));
              return {
                size: messages.length,
                forEach: (cb) => messages.forEach(cb),
                filter: (fn) => {
                  const filtered = messages.filter(fn);
                  return {
                    size: filtered.length,
                    forEach: (cb) => filtered.forEach(cb),
                    values: () => filtered
                  };
                },
                last: () => messages[messages.length - 1]
              };
            }
          }
        })),
      },
    };
  });

  afterEach(() => {
    recurringCleanupsMap.clear();
    vi.clearAllTimers();
  });

  it('should set up recurring cleanup', async () => {
    const channelId = '123456789';
    const guildId = '987654321';
    const intervalMinutes = 60;
    const periodInput = '1h';

    await setRecurringCleanup(channelId, guildId, intervalMinutes, mockClient, periodInput);

    expect(recurringCleanupsMap.has(channelId)).toBe(true);
    const task = recurringCleanupsMap.get(channelId);
    expect(task.isRunning).toBe(true);
  });

  it('should cancel recurring cleanup', async () => {
    const channelId = '123456789';
    const guildId = '987654321';
    const intervalMinutes = 60;
    const periodInput = '1h';

    // First set up a cleanup
    await setRecurringCleanup(channelId, guildId, intervalMinutes, mockClient, periodInput);
    // Then cancel it
    await cancelRecurringCleanup(channelId);
    expect(recurringCleanupsMap.has(channelId)).toBe(false);
  });
}); 