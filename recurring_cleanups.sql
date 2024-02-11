CREATE TABLE recurring_cleanups (
    channel_id VARCHAR(255) PRIMARY KEY,
    guild_id VARCHAR(255) NOT NULL,
    cleanup_interval INTEGER NOT NULL,
    last_cleanup TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
