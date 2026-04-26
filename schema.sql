CREATE TABLE IF NOT EXISTS reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  message TEXT NOT NULL,
  reminder_time INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS recurring_cleanups (
  channel_id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL,
  period_input TEXT NOT NULL,
  last_run INTEGER,
  created_at INTEGER NOT NULL
);
