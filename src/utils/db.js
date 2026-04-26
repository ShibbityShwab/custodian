export async function saveReminder(db, reminder) {
  try {
    const { success } = await db.prepare(
      'INSERT INTO reminders (channel_id, guild_id, message, reminder_time, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(reminder.channelId, reminder.guildId, reminder.message, reminder.time, Date.now()).run();
    return success;
  } catch (error) {
    console.error('Failed to save reminder:', error);
    return false;
  }
}

export async function getPendingReminders(db) {
  try {
    const { results } = await db.prepare(
      'SELECT * FROM reminders WHERE reminder_time <= ?'
    ).bind(Date.now()).all();
    return results || [];
  } catch (error) {
    console.error('Failed to get pending reminders:', error);
    return [];
  }
}

export async function deleteReminder(db, id) {
  try {
    const { success } = await db.prepare('DELETE FROM reminders WHERE id = ?').bind(id).run();
    return success;
  } catch (error) {
    console.error('Failed to delete reminder:', error);
    return false;
  }
}

export async function getActiveRemindersByChannel(db, channelId) {
  try {
    let query = 'SELECT * FROM reminders';
    let results;
    if (channelId) {
      query += ' WHERE channel_id = ?';
      const res = await db.prepare(query).bind(channelId).all();
      results = res.results;
    } else {
      const res = await db.prepare(query).all();
      results = res.results;
    }
    return results || [];
  } catch (error) {
    console.error('Failed to get active reminders:', error);
    return [];
  }
}

// Recurring cleanups
export async function getRecurringCleanups(db) {
  try {
    const { results } = await db.prepare('SELECT * FROM recurring_cleanups').all();
    return results || [];
  } catch (error) {
    console.error('Failed to get recurring cleanups:', error);
    return [];
  }
}

export async function getRecurringCleanup(db, channelId) {
  try {
    return await db.prepare('SELECT * FROM recurring_cleanups WHERE channel_id = ?').bind(channelId).first();
  } catch (error) {
    console.error('Failed to get recurring cleanup:', error);
    return null;
  }
}

export async function saveRecurringCleanup(db, channelId, guildId, intervalMinutes, periodInput) {
  try {
    const { success } = await db.prepare(
      'INSERT OR REPLACE INTO recurring_cleanups (channel_id, guild_id, interval_minutes, period_input, created_at, last_run) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(channelId, guildId, intervalMinutes, periodInput, Date.now(), Date.now()).run();
    return success;
  } catch (error) {
    console.error('Failed to save recurring cleanup:', error);
    return false;
  }
}

export async function updateRecurringCleanupLastRun(db, channelId, lastRun) {
  try {
    await db.prepare('UPDATE recurring_cleanups SET last_run = ? WHERE channel_id = ?').bind(lastRun, channelId).run();
  } catch (error) {
    console.error('Failed to update recurring cleanup last run:', error);
  }
}

export async function deleteRecurringCleanup(db, channelId) {
  try {
    const { success } = await db.prepare('DELETE FROM recurring_cleanups WHERE channel_id = ?').bind(channelId).run();
    return success;
  } catch (error) {
    console.error('Failed to delete recurring cleanup:', error);
    return false;
  }
}
