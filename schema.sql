CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  user_id TEXT,
  message TEXT NOT NULL,
  reminder_time BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_reminder_time ON reminders(reminder_time);
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);

CREATE TABLE IF NOT EXISTS recurring_cleanups (
  channel_id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL,
  period_input TEXT NOT NULL,
  last_run BIGINT,
  created_at BIGINT NOT NULL
);