import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import {
  cleanupMessages,
  handlerLogic as handleCleanupCommand,
} from '../../src/commands/cleanup.js';
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

describe('cleanup', () => {
  beforeAll(() => {
    process.env.DISCORD_BOT_TOKEN = 'test-token';
    process.env.CLIENT_ID = 'test-client';
  });

  afterAll(() => {
    delete process.env.DISCORD_BOT_TOKEN;
    delete process.env.CLIENT_ID;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('cleanupMessages', () => {
    it('should throw on invalid period format', async () => {
      await expect(cleanupMessages(null, 'ch1', 'invalid')).rejects.toThrow(
        'Invalid period format'
      );
    });

    it('should count messages in preview mode without deleting', async () => {
      mockGet
        .mockResolvedValueOnce([makeMessage('1', 120), makeMessage('2', 120), makeMessage('3', 10)])
        .mockResolvedValueOnce([]);

      const count = await cleanupMessages(
        { get: mockGet, post: mockPost, delete: mockDelete },
        'ch1',
        '1h',
        true
      );
      expect(count).toBe(2);
      expect(mockPost).not.toHaveBeenCalled();
      expect(mockDelete).not.toHaveBeenCalled();
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
          makeMessage('1', 120), // 2h old, eligible for bulk
          makeMessage('2', 121), // 2h old, eligible for bulk
          makeMessage('3', 15 * 24 * 60), // 15 days old, individual
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
  });

  describe('handleCleanupCommand', () => {
    it('should return immediate error for invalid period', async () => {
      const interaction = {
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: 'bad' },
          ],
        },
      };
      const result = await handleCleanupCommand(interaction);
      expect(result.type).toBe(InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE);
      expect(result.data.content).toContain('Invalid period format');
    });

    it('should return deferred response with background task', async () => {
      const interaction = {
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: '30m' },
          ],
        },
        token: 'interaction-token',
      };
      const result = await handleCleanupCommand(interaction);
      expect(typeof result.backgroundTask).toBe('function');
      expect(result.response.type).toBe(
        InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      );
    });

    it('should update original message on background task success', async () => {
      const interaction = {
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: '30m' },
          ],
        },
        token: 'interaction-token',
      };
      const result = await handleCleanupCommand(interaction);

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
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: '30m' },
          ],
        },
        token: 'interaction-token',
      };
      const result = await handleCleanupCommand(interaction);

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
