import { describe, it, expect, vi } from 'vitest';

const mockUnregister = vi.fn();
const mockGetGuild = vi.fn();

vi.mock('../../src/index.js', () => ({
  unregisterRecurringCleanup: (...args) => mockUnregister(...args),
  getGuildSchedules: (...args) => mockGetGuild(...args),
}));

vi.mock('../../src/config.js', () => ({
  config: {
    DISCORD_BOT_TOKEN: 'test-token',
    CLIENT_ID: 'test-client',
    PUBLIC_KEY: 'test-public-key',
    NODE_ENV: 'test',
  },
}));

import { handlerLogic as handleScheduleCommand } from '../../src/commands/schedule.js';
import { InteractionResponseType } from '../../src/constants.js';

const mockGet = vi.fn();
const mockPost = vi.fn();
const mockDelete = vi.fn();
const mockPatch = vi.fn();

vi.mock('@discordjs/rest', () => ({
  REST: vi.fn(() => {
    const instance = {
      setToken: vi.fn(() => instance),
      get: mockGet,
      post: mockPost,
      delete: mockDelete,
      patch: mockPatch,
    };
    return instance;
  }),
}));

function makeMessage(id, minutesAgo) {
  const timestamp = new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
  return { id, timestamp };
}

function subOptions(name, opts) {
  return [{ name, type: 1, options: opts }];
}

describe('schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('unknown subcommand', () => {
    it('should return usage hint for empty options', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: { options: [] },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Use `/schedule set`');
    });
  });

  describe('set', () => {
    it('should return immediate error for invalid period', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [
            { name: 'every', value: 60 },
            { name: 'older_than', value: 'bad' },
          ]),
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Invalid period format');
    });

    it('should return error for every below 1', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [{ name: 'every', value: 0 }]),
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Recurring interval');
    });

    it('should return error for every above 525600', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [{ name: 'every', value: 525601 }]),
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Recurring interval');
    });

    it('should return deferred response with background task', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [{ name: 'every', value: 60 }]),
        },
        token: 'interaction-token',
      };
      const result = await handleScheduleCommand(interaction);
      expect(typeof result.backgroundTask).toBe('function');
      expect(result.response.type).toBe(
        InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      );
    });

    it('should return recurring data', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [
            { name: 'every', value: 60 },
            { name: 'older_than', value: '30m' },
          ]),
        },
        token: 'interaction-token',
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.recurring).toEqual({
        channelId: 'ch1',
        guildId: 'g1',
        intervalMinutes: 60,
        olderThan: '30m',
      });
    });

    it('should update original message on background task success', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [
            { name: 'every', value: 60 },
            { name: 'older_than', value: '30m' },
          ]),
        },
        token: 'interaction-token',
      };
      const result = await handleScheduleCommand(interaction);

      mockGet.mockResolvedValueOnce([makeMessage('1', 60)]).mockResolvedValueOnce([]);

      await result.backgroundTask();
      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.objectContaining({
            content: expect.stringContaining('Scheduled cleanup every 60 minute(s)'),
          }),
        })
      );
    });

    it('should send sanitized error on background task failure', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: subOptions('set', [{ name: 'every', value: 60 }]),
        },
        token: 'interaction-token',
      };
      const result = await handleScheduleCommand(interaction);

      mockGet.mockRejectedValueOnce(new Error('boom'));

      await result.backgroundTask();
      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.objectContaining({
            content: 'Cleanup failed. Check permissions and try again.',
          }),
        })
      );
    });
  });

  describe('list', () => {
    it('should show empty message when no schedules', async () => {
      mockGetGuild.mockReturnValue([]);
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'list', type: 1 }],
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toBe('No active schedules in this server.');
      expect(mockGetGuild).toHaveBeenCalledWith('g1');
    });

    it('should list active schedules', async () => {
      const now = Date.now();
      mockGetGuild.mockReturnValue([
        {
          channelId: 'ch1',
          guildId: 'g1',
          intervalMinutes: 60,
          olderThan: '30m',
          lastRun: now - 30 * 60 * 1000,
        },
        {
          channelId: 'ch2',
          guildId: 'g1',
          intervalMinutes: 120,
          olderThan: null,
          lastRun: now,
        },
      ]);
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'list', type: 1 }],
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      const content = result.data.content;
      expect(content).toContain('Active Schedules in this server');
      expect(content).toContain('<#ch1>');
      expect(content).toContain('every 60min');
      expect(content).toContain('`older_than:30m`');
      expect(content).toContain('<#ch2>');
      expect(content).toContain('every 120min');

      const ch2Line = content.split('\n').find((l) => l.includes('<#ch2>'));
      expect(ch2Line).not.toContain('`older_than');
      expect(content).toContain('next run');
    });
  });

  describe('cancel', () => {
    it('should cancel existing schedule', async () => {
      mockUnregister.mockReturnValue(true);
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'cancel', type: 1 }],
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Schedule cancelled');
      expect(mockUnregister).toHaveBeenCalledWith('ch1', 'g1');
    });

    it('should report no schedule when nothing to cancel', async () => {
      mockUnregister.mockReturnValue(false);
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'cancel', type: 1 }],
        },
      };
      const result = await handleScheduleCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('No active schedule');
    });
  });
});
