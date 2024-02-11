require('dotenv').config();
const db = require('./db');
const { Client, GatewayIntentBits, PermissionFlagsBits } = require('discord.js');
const winston = require('winston');
const { format } = require('winston');
const { colorize, combine, timestamp, printf } = format;

const logger = winston.createLogger({
  level: 'info',
  format: combine(
    timestamp(),
    colorize(),
    printf((info) => `${info.timestamp} [${info.level}]: [Guild ID: ${info.guildId}] ${info.message}`)
  ),
  transports: [new winston.transports.Console({ level: 'info' })]
});

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const recurringCleanupsMap = new Map(); // Fallback in-memory storage

async function isDbConnected() {
  try {
    await db.query('SELECT 1'); // Simple query to check database connection
    return true;
  } catch (error) {
    logger.error('Database connection failed:', error);
    return false;
  }
}

async function isCleanupTaskRunning(channelId) {
  if (await isDbConnected()) {
    // Check if cleanup task is running in the database
    const queryText = `
      SELECT channel_id FROM recurring_cleanups WHERE channel_id = $1 AND is_running = true
    `;
    const { rows } = await db.query(queryText, [channelId]);
    return rows.length > 0; // Return true if there are rows (i.e., task is running)
  } else {
    // Fallback to in-memory storage
    return recurringCleanupsMap.has(channelId) && recurringCleanupsMap.get(channelId).isRunning;
  }
}

function calculateThreshold(periodInput) {
  const periodRegex = /^(\d+)(s|m|h)$/;
  const match = periodInput.match(periodRegex);

  if (!match) return null;

  const [, amount, unit] = match;
  const amountNumber = parseInt(amount, 10);
  let multiplier;

  switch (unit) {
    case 's':
      multiplier = 1000;
      break;
    case 'm':
      multiplier = 1000 * 60;
      break;
    case 'h':
      multiplier = 1000 * 60 * 60;
      break;
    default:
      return null;
  }

  return Date.now() - amountNumber * multiplier;
}

async function isCleanupTaskRunningInDB(channelId) {
  if (await isDbConnected()) {
    // Check if cleanup task is running in the database
    const queryText = `
      SELECT channel_id FROM recurring_cleanups WHERE channel_id = $1 AND is_running = true
    `;
    const { rows } = await db.query(queryText, [channelId]);
    return rows.length > 0;
  } else {
    return false;
  }
}

async function updateCleanupTaskStateInDB(channelId, isRunning) {
  if (await isDbConnected()) {
    // Update the database to set the state of cleanup tasks for the channel
    const queryText = `
      UPDATE recurring_cleanups SET is_running = $1 WHERE channel_id = $2
    `;
    try {
      await db.query(queryText, [isRunning, channelId]);
    } catch (error) {
      logger.error(`Failed to update cleanup task state for channel ${channelId} in DB: ${error}`);
    }
  } else {
    // Fallback to in-memory storage
    if (isRunning) {
      recurringCleanupsMap.set(channelId, { isRunning });
    } else {
      recurringCleanupsMap.delete(channelId);
    }
  }
}

async function cleanupMessages(channel, periodInput, guildId) {
  const channelId = channel.id;
  const threshold = calculateThreshold(periodInput);
  if (threshold === null) {
    logger.warn({ message: `Invalid period input: ${periodInput} in channel: ${channel.name}`, guildId: guildId });
    return;
  }

  if (!channel.permissionsFor(client.user).has(PermissionFlagsBits.ManageMessages | PermissionFlagsBits.ReadMessageHistory)) {
    logger.warn({ message: `Permission denied for managing messages in channel: ${channel.name}`, guildId: guildId });
    return;
  }

  const isRunning = await isCleanupTaskRunning(channelId);
  if (isRunning) {
    logger.warn(`Cleanup task is already running for channel ${channelId}`);
    return; // Exit if a cleanup task is already running
  }
  
  await updateCleanupTaskStateInDB(channelId, true);
  logger.info({ message: `Initiating cleanup for messages older than ${periodInput} in ${channel.name}.`, guildId: guildId });

  try {
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      logger.info({ message: `Fetching messages in ${channel.name}.`, guildId: guildId });

      const messages = await channel.messages.fetch({ limit: 100 }).catch(error => {
        logger.error({ message: `Failed to fetch messages: ${error}`, guildId: guildId });
        hasMore = false;
      });

      if (!messages || messages.size === 0) {
        logger.info({ message: `No more messages to fetch in ${channel.name}.`, guildId: guildId });
        hasMore = false;
        break;
      }

      const oldMessages = messages.filter((message) => message.createdTimestamp < threshold);
      let pendingDeletions = oldMessages.size;

      if (oldMessages.size > 0) {
        logger.info({ message: `Starting deletion of ${pendingDeletions} messages in ${channel.name}.`, guildId: guildId });

        const deletePromises = oldMessages.map((message) => message.delete().catch((error) => {
          logger.error({ message: `Failed to delete message ${message.id}: ${error}`, guildId: guildId });
        }).finally(() => {
          pendingDeletions--;
          logger.info({ message: `${pendingDeletions} deletions remaining in ${channel.name}.`, guildId: guildId });
        }));

        await Promise.all(deletePromises);
        totalDeleted += oldMessages.size;
      } else {
        logger.info({ message: `No messages older than threshold found in the current batch in ${channel.name}.`, guildId: guildId });
      }

      if (oldMessages.size < 100) {
        hasMore = false;
      }
    }

    logger.info({ message: `Cleanup completed. Deleted a total of ${totalDeleted} messages in ${channel.name}.`, guildId: guildId });
  } catch (error) {
    logger.error(`Error occurred during cleanup for channel ${channelId}: ${error}`);
  } finally {
    await updateCleanupTaskStateInDB(channelId, false);
  }
}

async function setRecurringCleanup(channelId, guildId, intervalMinutes) {
  // Check if a cleanup task is already running for the specified channel
  const isRunning = await isCleanupTaskRunning(channelId);
  if (isRunning) {
    logger.warn(`Recurring cleanup task already exists for channel ${channelId}`);
    return;
  }

  if (await isDbConnected()) {
    // Insert or update recurring cleanup task in the database
    const queryText = `
      INSERT INTO recurring_cleanups (channel_id, guild_id, cleanup_interval)
      VALUES ($1, $2, $3)
      ON CONFLICT (channel_id) 
      DO UPDATE SET cleanup_interval = EXCLUDED.cleanup_interval, last_cleanup = CURRENT_TIMESTAMP
    `;
    try {
      await db.query(queryText, [channelId, guildId, intervalMinutes]);
      logger.info(`Recurring cleanup set for channel ${channelId} with interval ${intervalMinutes} minutes.`);
    } catch (error) {
      logger.error(`Failed to set recurring cleanup for channel ${channelId}: ${error}`);
    }
  } else {
    // Fallback to in-memory storage
    recurringCleanupsMap.set(channelId, { isRunning: true });

    // Start the recurring cleanup task
    const intervalId = setInterval(async () => {
      const channel = await client.channels.fetch(channelId).catch(logger.error);
      if (channel) {
        await cleanupMessages(channel, `${intervalMinutes}m`, guildId);
      }
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds

    // Save the interval ID for future reference (e.g., to clear the interval if needed)
    recurringCleanupsMap.set(channelId, { guildId, intervalMinutes, intervalId });

    logger.info(`Recurring cleanup set for channel ${channelId} with interval ${intervalMinutes} minutes (in-memory).`);
  }
}

client.once('ready', () => {
  logger.info('Discord bot is ready');
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, guildId } = interaction;
  const channel = options.getChannel('channel');
  const periodInput = options.getString('age');

  if (commandName === 'cleanup') {
    await interaction.reply({
      content: `Starting cleanup for messages older than ${periodInput} in ${channel.name}. This may take some time.`,
      ephemeral: true,
    });

    cleanupMessages(channel, periodInput, guildId).then(() => {
      interaction.followUp({
        content: `Cleanup completed for messages older than ${periodInput}.`,
        ephemeral: true,
      });
    });
  } else if (commandName === 'setrecurringcleanup') {
    const intervalMinutes = options.getInteger('interval');

    await setRecurringCleanup(channel.id, guildId, intervalMinutes);

    await interaction.reply({
      content: `Recurring cleanup set for every ${intervalMinutes} minutes in ${channel.name}.`,
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
