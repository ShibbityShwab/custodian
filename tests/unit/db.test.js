import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  saveReminder,
  getPendingReminders,
  deleteReminder,
  getActiveRemindersByChannel,
  getRecurringCleanups,
  getRecurringCleanup,
  saveRecurringCleanup,
  updateRecurringCleanupLastRun,
  deleteRecurringCleanup,
  getPool,
  closePool,
} from '../../src/utils/db.js';

const mockQuery = vi.fn();
const mockConnect = vi.fn();
const mockEnd = vi.fn();
const mockOn = vi.fn();

vi.mock('pg', () => ({
  default: {
    Pool: vi.fn(() => ({
      query: mockQuery,
      connect: mockConnect,
      end: mockEnd,
      on: mockOn,
    })),
  },
}));

describe('db.js', () => {
  beforeEach(() => {
    vi.stubGlobal('process', {
      ...process,
      env: { ...process.env, DATABASE_URL: 'postgresql://localhost/test' },
    });
    mockQuery.mockReset();
    mockConnect.mockReset();
    mockEnd.mockReset();
    mockOn.mockReset();
    // Reset the module-level pool by calling closePool
    closePool();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getPool', () => {
    it('should throw if DATABASE_URL is missing', () => {
      vi.stubGlobal('process', {
        ...process,
        env: { ...process.env, DATABASE_URL: undefined },
      });
      closePool();
      expect(() => getPool()).toThrow('DATABASE_URL environment variable is not set');
    });
  });

  describe('saveReminder', () => {
    it('should return true on success', async () => {
      mockQuery.mockResolvedValue({});
      const result = await saveReminder({
        channelId: '123',
        guildId: '456',
        userId: '789',
        message: 'hello',
        time: 1_700_000_000_000,
      });
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO reminders'), [
        '123',
        '456',
        '789',
        'hello',
        1_700_000_000_000,
        expect.any(Number),
      ]);
    });

    it('should return false on error', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));
      const result = await saveReminder({
        channelId: '123',
        guildId: '456',
        userId: '789',
        message: 'hello',
        time: 1_700_000_000_000,
      });
      expect(result).toBe(false);
    });
  });

  describe('getPendingReminders', () => {
    it('should return rows', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1, message: 'test' }] });
      const result = await getPendingReminders();
      expect(result).toEqual([{ id: 1, message: 'test' }]);
    });

    it('should return empty array on error', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));
      const result = await getPendingReminders();
      expect(result).toEqual([]);
    });
  });

  describe('deleteReminder', () => {
    it('should return true if rowCount > 0 with userId', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });
      const result = await deleteReminder(1, 'user1');
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('user_id = $2'), [1, 'user1']);
    });

    it('should return true if rowCount > 0 without userId', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });
      const result = await deleteReminder(1);
      expect(result).toBe(true);
      expect(mockQuery).toHaveBeenCalledWith('DELETE FROM reminders WHERE id = $1', [1]);
    });

    it('should return false if rowCount is 0', async () => {
      mockQuery.mockResolvedValue({ rowCount: 0 });
      const result = await deleteReminder(1, 'user1');
      expect(result).toBe(false);
    });
  });

  describe('getActiveRemindersByChannel', () => {
    it('should filter by channel when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });
      const result = await getActiveRemindersByChannel('123');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('channel_id'),
        expect.any(Array)
      );
    });

    it('should filter by channel and user when provided', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });
      const result = await getActiveRemindersByChannel('123', 'user1');
      expect(result).toEqual([{ id: 1 }]);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('channel_id'), [
        '123',
        'user1',
      ]);
    });

    it('should filter by user when channel omitted', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });
      const result = await getActiveRemindersByChannel(undefined, 'user1');
      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('user_id'), ['user1']);
    });

    it('should return all rows when both omitted', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });
      const result = await getActiveRemindersByChannel();
      expect(result).toHaveLength(2);
      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM reminders', []);
    });
  });

  describe('getRecurringCleanups', () => {
    it('should return rows', async () => {
      mockQuery.mockResolvedValue({ rows: [{ channel_id: '1' }] });
      const result = await getRecurringCleanups();
      expect(result).toEqual([{ channel_id: '1' }]);
    });

    it('should return empty array on error', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));
      const result = await getRecurringCleanups();
      expect(result).toEqual([]);
    });
  });

  describe('getRecurringCleanup', () => {
    it('should return first row', async () => {
      mockQuery.mockResolvedValue({ rows: [{ channel_id: '1' }] });
      const result = await getRecurringCleanup('1');
      expect(result).toEqual({ channel_id: '1' });
    });

    it('should return null if no rows', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const result = await getRecurringCleanup('1');
      expect(result).toBeNull();
    });
  });

  describe('saveRecurringCleanup', () => {
    it('should return true on success', async () => {
      mockQuery.mockResolvedValue({});
      const result = await saveRecurringCleanup('ch1', 'g1', 5, '1h');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));
      const result = await saveRecurringCleanup('ch1', 'g1', 5, '1h');
      expect(result).toBe(false);
    });

    it('should use COALESCE for last_run when preserveLastRun is true', async () => {
      mockQuery.mockResolvedValue({});
      await saveRecurringCleanup('ch1', 'g1', 5, '1h', true);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('COALESCE(recurring_cleanups.last_run, EXCLUDED.last_run)'),
        expect.any(Array)
      );
    });
  });

  describe('updateRecurringCleanupLastRun', () => {
    it('should execute update without throwing', async () => {
      mockQuery.mockResolvedValue({});
      await expect(updateRecurringCleanupLastRun('ch1', Date.now())).resolves.not.toThrow();
    });
  });

  describe('deleteRecurringCleanup', () => {
    it('should return true if rowCount > 0', async () => {
      mockQuery.mockResolvedValue({ rowCount: 1 });
      const result = await deleteRecurringCleanup('ch1');
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      mockQuery.mockRejectedValue(new Error('DB error'));
      const result = await deleteRecurringCleanup('ch1');
      expect(result).toBe(false);
    });
  });

  describe('closePool', () => {
    it('should call pool.end and null the pool', async () => {
      getPool(); // initialize pool
      await closePool();
      expect(mockEnd).toHaveBeenCalled();
    });
  });
});
