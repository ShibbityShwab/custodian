import pg from 'pg';
import { logger } from './logger.js';

let pool = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
    });
    pool.on('error', (err) => {
      logger.error(err, 'Unexpected PostgreSQL pool error');
    });
  }
  return pool;
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export async function saveReminder(reminder) {
  try {
    await getPool().query(
      'INSERT INTO reminders (channel_id, guild_id, user_id, message, reminder_time, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [
        reminder.channelId,
        reminder.guildId,
        reminder.userId,
        reminder.message,
        reminder.time,
        Date.now(),
      ]
    );
    return true;
  } catch (error) {
    logger.error(error, 'Failed to save reminder');
    return false;
  }
}

export async function getPendingReminders() {
  try {
    const { rows } = await getPool().query('SELECT * FROM reminders WHERE reminder_time <= $1', [
      Date.now(),
    ]);
    return rows || [];
  } catch (error) {
    logger.error(error, 'Failed to get pending reminders');
    return [];
  }
}

export async function deleteReminder(id, userId) {
  try {
    let query = 'DELETE FROM reminders WHERE id = $1';
    const params = [id];
    if (userId) {
      query += ' AND (user_id = $2 OR user_id IS NULL)';
      params.push(userId);
    }
    const { rowCount } = await getPool().query(query, params);
    return rowCount > 0;
  } catch (error) {
    logger.error(error, 'Failed to delete reminder');
    return false;
  }
}

export async function getActiveRemindersByChannel(channelId, userId) {
  try {
    const conditions = [];
    const params = [];
    if (channelId) {
      conditions.push(`channel_id = $${conditions.length + 1}`);
      params.push(channelId);
    }
    if (userId) {
      conditions.push(`(user_id = $${conditions.length + 1} OR user_id IS NULL)`);
      params.push(userId);
    }
    let query = 'SELECT * FROM reminders';
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    const { rows } = await getPool().query(query, params);
    return rows || [];
  } catch (error) {
    logger.error(error, 'Failed to get active reminders');
    return [];
  }
}

export async function getRecurringCleanups() {
  try {
    const { rows } = await getPool().query('SELECT * FROM recurring_cleanups');
    return rows || [];
  } catch (error) {
    logger.error(error, 'Failed to get recurring cleanups');
    return [];
  }
}

export async function getRecurringCleanup(channelId) {
  try {
    const { rows } = await getPool().query(
      'SELECT * FROM recurring_cleanups WHERE channel_id = $1',
      [channelId]
    );
    return rows[0] || null;
  } catch (error) {
    logger.error(error, 'Failed to get recurring cleanup');
    return null;
  }
}

export async function saveRecurringCleanup(
  channelId,
  guildId,
  intervalMinutes,
  periodInput,
  preserveLastRun = false
) {
  try {
    const now = Date.now();
    await getPool().query(
      `INSERT INTO recurring_cleanups (channel_id, guild_id, interval_minutes, period_input, created_at, last_run)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (channel_id) DO UPDATE SET
         guild_id = EXCLUDED.guild_id,
         interval_minutes = EXCLUDED.interval_minutes,
         period_input = EXCLUDED.period_input,
         created_at = EXCLUDED.created_at,
         last_run = ${preserveLastRun ? 'COALESCE(recurring_cleanups.last_run, EXCLUDED.last_run)' : 'EXCLUDED.last_run'}`,
      [channelId, guildId, intervalMinutes, periodInput, now, preserveLastRun ? null : now]
    );
    return true;
  } catch (error) {
    logger.error(error, 'Failed to save recurring cleanup');
    return false;
  }
}

export async function updateRecurringCleanupLastRun(channelId, lastRun) {
  try {
    await getPool().query('UPDATE recurring_cleanups SET last_run = $1 WHERE channel_id = $2', [
      lastRun,
      channelId,
    ]);
  } catch (error) {
    logger.error(error, 'Failed to update recurring cleanup last run');
  }
}

export async function deleteRecurringCleanup(channelId) {
  try {
    const { rowCount } = await getPool().query(
      'DELETE FROM recurring_cleanups WHERE channel_id = $1',
      [channelId]
    );
    return rowCount > 0;
  } catch (error) {
    logger.error(error, 'Failed to delete recurring cleanup');
    return false;
  }
}
