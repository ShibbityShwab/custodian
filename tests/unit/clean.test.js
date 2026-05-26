import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/config.js', () => ({
  config: {
    DISCORD_BOT_TOKEN: 'test-token',
    CLIENT_ID: 'test-client',
    PUBLIC_KEY: 'test-public-key',
    NODE_ENV: 'test',
  },
}));

import { cleanupMessages, handlerLogic as handleCleanCommand } from '../../src/commands/clean.js';
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

describe('clean', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanupMessages', () => {
    it('should throw on invalid period format', async () => {
      await expect(cleanupMessages(null, 'ch1', 'invalid')).rejects.toThrow(
        'Invalid period format'
      );
    });

    it('should filter messages by threshold', async () => {
      mockGet
        .mockResolvedValueOnce([makeMessage('1', 120), makeMessage('2', 30)])
        .mockResolvedValueOnce([]);

      const rest = { get: mockGet, post: mockPost, delete: mockDelete };
      const count = await cleanupMessages(rest, 'ch1', '1h');
      expect(count).toBe(1);
      expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('1'));
    });

    it('should use bulk delete for recent messages and individual for old', async () => {
      mockGet
        .mockResolvedValueOnce([
          makeMessage('1', 120),
          makeMessage('2', 121),
          makeMessage('3', 15 * 24 * 60),
        ])
        .mockResolvedValueOnce([]);

      const rest = { get: mockGet, post: mockPost, delete: mockDelete };
      const count = await cleanupMessages(rest, 'ch1', '1h');
      expect(count).toBe(3);
      expect(mockPost).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith(expect.stringContaining('3'));
    });

    it('should return 0 for empty channel', async () => {
      mockGet.mockResolvedValueOnce([]);
      const rest = { get: mockGet, post: mockPost, delete: mockDelete };
      const count = await cleanupMessages(rest, 'ch1', '1h');
      expect(count).toBe(0);
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should use individual delete for a single bulk-eligible message', async () => {
      mockGet.mockResolvedValueOnce([makeMessage('1', 120)]).mockResolvedValueOnce([]);

      const rest = { get: mockGet, post: mockPost, delete: mockDelete };
      const count = await cleanupMessages(rest, 'ch1', '1h');
      expect(count).toBe(1);
      expect(mockPost).not.toHaveBeenCalled();
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });

    it('should delete all messages when no older_than provided', async () => {
      mockGet
        .mockResolvedValueOnce([makeMessage('1', 1), makeMessage('2', 1)])
        .mockResolvedValueOnce([]);

      const rest = { get: mockGet, post: mockPost, delete: mockDelete };
      const count = await cleanupMessages(rest, 'ch1', null);
      expect(count).toBe(2);
    });
  });

  describe('handleCleanCommand', () => {
    it('should return immediate error for invalid period', async () => {
      const interaction = {
        channel_id: 'ch1',
        data: {
          options: [{ name: 'older_than', value: 'bad' }],
        },
      };
      const result = await handleCleanCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Invalid period format');
    });

    it('should return deferred response with background task for valid older_than', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'older_than', value: '30m' }],
        },
        token: 'interaction-token',
      };
      const result = await handleCleanCommand(interaction);
      expect(typeof result.backgroundTask).toBe('function');
      expect(result.response.type).toBe(
        InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      );
    });

    it('should update original message on background task success', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'older_than', value: '30m' }],
        },
        token: 'interaction-token',
      };
      const result = await handleCleanCommand(interaction);

      mockGet.mockResolvedValueOnce([makeMessage('1', 60)]).mockResolvedValueOnce([]);

      await result.backgroundTask();
      expect(mockPatch).toHaveBeenCalledTimes(1);
      expect(mockPatch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.objectContaining({ content: expect.stringContaining('Cleanup complete') }),
        })
      );
    });

    it('should send sanitized error on background task failure', async () => {
      const interaction = {
        channel_id: 'ch1',
        guild_id: 'g1',
        data: {
          options: [{ name: 'older_than', value: '30m' }],
        },
        token: 'interaction-token',
      };
      const result = await handleCleanCommand(interaction);

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
});
