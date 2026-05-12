import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  setRecurringCleanupLogic as setRecurringCleanup,
  viewCleanupScheduleLogic as viewCleanupSchedule,
  cancelRecurringCleanupLogic as cancelRecurringCleanup,
  editRecurringCleanupLogic as editRecurringCleanup,
} from '../../src/commands/recurring-cleanup.js';

vi.mock('../../src/utils/db.js', () => ({
  saveRecurringCleanup: vi.fn(),
  getRecurringCleanups: vi.fn(),
  getRecurringCleanup: vi.fn(),
  deleteRecurringCleanup: vi.fn(),
}));

import {
  saveRecurringCleanup,
  getRecurringCleanups,
  getRecurringCleanup,
  deleteRecurringCleanup,
} from '../../src/utils/db.js';

describe('recurring-cleanup command handlers', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('setRecurringCleanup', () => {
    it('should reject invalid period format', async () => {
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: 'bad' },
            { name: 'interval', value: 5 },
          ],
        },
      };
      const result = await setRecurringCleanup(interaction);
      expect(result.data.content).toContain('Invalid period format');
    });

    it('should reject interval less than 1', async () => {
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: '1h' },
            { name: 'interval', value: 0 },
          ],
        },
      };
      const result = await setRecurringCleanup(interaction);
      expect(result.data.content).toContain('Interval must be at least 1 minute');
    });

    it('should return success when saved', async () => {
      saveRecurringCleanup.mockResolvedValue(true);
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: '1h' },
            { name: 'interval', value: 5 },
          ],
        },
      };
      const result = await setRecurringCleanup(interaction);
      expect(result.data.content).toContain('Recurring cleanup set');
      expect(saveRecurringCleanup).toHaveBeenCalledWith('ch1', 'g1', 5, '1h', false);
    });

    it('should return failure when save fails', async () => {
      saveRecurringCleanup.mockResolvedValue(false);
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'age', value: '1h' },
            { name: 'interval', value: 5 },
          ],
        },
      };
      const result = await setRecurringCleanup(interaction);
      expect(result.data.content).toContain('Failed to save');
    });
  });

  describe('viewCleanupSchedule', () => {
    it('should return empty message when no cleanups', async () => {
      getRecurringCleanups.mockResolvedValue([]);
      const result = await viewCleanupSchedule();
      expect(result.data.content).toContain('No active recurring cleanups');
    });

    it('should return embed with schedules', async () => {
      const now = Date.now();
      getRecurringCleanups.mockResolvedValue([
        { channel_id: 'ch1', interval_minutes: 5, period_input: '1h', last_run: now },
      ]);
      const result = await viewCleanupSchedule();
      expect(result.data.embeds).toBeDefined();
      expect(result.data.embeds[0].title).toBe('Active Recurring Cleanups');
      const fieldValue = result.data.embeds[0].fields[0].value;
      expect(fieldValue).toContain('5 minutes');
      expect(fieldValue).toContain('1h');
      expect(fieldValue).toContain('<t:');
    });

    it('should show Never for null last_run', async () => {
      getRecurringCleanups.mockResolvedValue([
        { channel_id: 'ch1', interval_minutes: 5, period_input: '1h', last_run: null },
      ]);
      const result = await viewCleanupSchedule();
      const fieldValue = result.data.embeds[0].fields[0].value;
      expect(fieldValue).toContain('Never');
      expect(fieldValue).not.toContain('<t:0:R>');
    });
  });

  describe('cancelRecurringCleanup', () => {
    it('should return success when cancelled', async () => {
      deleteRecurringCleanup.mockResolvedValue(true);
      const interaction = {
        data: { options: [{ name: 'channel', value: 'ch1' }] },
      };
      const result = await cancelRecurringCleanup(interaction);
      expect(result.data.content).toContain('cancelled');
    });

    it('should return not found when delete fails', async () => {
      deleteRecurringCleanup.mockResolvedValue(false);
      const interaction = {
        data: { options: [{ name: 'channel', value: 'ch1' }] },
      };
      const result = await cancelRecurringCleanup(interaction);
      expect(result.data.content).toContain('No recurring cleanup found');
    });
  });

  describe('editRecurringCleanup', () => {
    it('should reject interval less than 1', async () => {
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'interval', value: 0 },
          ],
        },
      };
      const result = await editRecurringCleanup(interaction);
      expect(result.data.content).toContain('Interval must be at least 1 minute');
    });

    it('should return not found when channel has no cleanup', async () => {
      getRecurringCleanup.mockResolvedValue(null);
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'interval', value: 10 },
          ],
        },
      };
      const result = await editRecurringCleanup(interaction);
      expect(result.data.content).toContain('No recurring cleanup found');
    });

    it('should update interval when found', async () => {
      saveRecurringCleanup.mockResolvedValue(true);
      getRecurringCleanup.mockResolvedValue({
        channel_id: 'ch1',
        interval_minutes: 5,
        period_input: '1h',
        last_run: Date.now(),
      });
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'interval', value: 10 },
          ],
        },
      };
      const result = await editRecurringCleanup(interaction);
      expect(result.data.content).toContain('updated to 10 minutes');
      expect(saveRecurringCleanup).toHaveBeenCalledWith('ch1', 'g1', 10, '1h', true);
    });

    it('should return failure when save fails', async () => {
      saveRecurringCleanup.mockResolvedValue(false);
      getRecurringCleanup.mockResolvedValue({
        channel_id: 'ch1',
        interval_minutes: 5,
        period_input: '1h',
        last_run: Date.now(),
      });
      const interaction = {
        guild_id: 'g1',
        data: {
          options: [
            { name: 'channel', value: 'ch1' },
            { name: 'interval', value: 10 },
          ],
        },
      };
      const result = await editRecurringCleanup(interaction);
      expect(result.data.content).toContain('Failed to update');
    });
  });
});
