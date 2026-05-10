-- Initial schema
CREATE TABLE IF NOT EXISTS reminders (
  id SERIAL PRIMARY KEY,
  channel_id TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  message TEXT NOT NULL,
  reminder_time BIGINT NOT NULL,
  created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS recurring_cleanups (
  channel_id TEXT PRIMARY KEY,
  guild_id TEXT NOT NULL,
  interval_minutes INTEGER NOT NULL,
  period_input TEXT NOT NULL,
  last_run BIGINT,
  created_at BIGINT NOT NULL
);
