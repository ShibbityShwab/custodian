import { Hono } from 'hono';
import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType, MessageFlags } from './constants.js';
import { REST } from '@discordjs/rest';
import { commands } from './commands/registry.js';
import { cleanupMessages } from './commands/clean.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';

const recurringCleanups = new Map();

export function registerRecurringCleanup(channelId, guildId, intervalMinutes, olderThan) {
  const key = `${guildId}:${channelId}`;
  recurringCleanups.set(key, {
    channelId,
    guildId,
    intervalMinutes,
    olderThan,
    lastRun: Date.now() - intervalMinutes * 60 * 1000,
  });
  logger.info(`Registered recurring cleanup for channel ${channelId} every ${intervalMinutes}min`);
}

export function unregisterRecurringCleanup(channelId, guildId) {
  const key = `${guildId}:${channelId}`;
  const existed = recurringCleanups.has(key);
  recurringCleanups.delete(key);
  if (existed) {
    logger.info(`Unregistered recurring cleanup for channel ${channelId}`);
  }
  return existed;
}

export function getGuildSchedules(guildId) {
  const results = [];
  for (const [key, cleanup] of recurringCleanups) {
    if (key.startsWith(`${guildId}:`)) {
      results.push({
        channelId: cleanup.channelId,
        guildId: cleanup.guildId,
        intervalMinutes: cleanup.intervalMinutes,
        olderThan: cleanup.olderThan,
        lastRun: cleanup.lastRun,
      });
    }
  }
  return results;
}

export async function runRecurringCleanups() {
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);
  const now = Date.now();

  for (const [, cleanup] of recurringCleanups) {
    const intervalMs = cleanup.intervalMinutes * 60 * 1000;
    if (now - cleanup.lastRun < intervalMs) continue;

    try {
      logger.info(`Running recurring cleanup for channel ${cleanup.channelId}`);
      const deleted = await cleanupMessages(rest, cleanup.channelId, cleanup.olderThan);
      cleanup.lastRun = now;
      logger.info(`Recurring cleanup for ${cleanup.channelId} deleted ${deleted} messages`);
    } catch (error) {
      logger.error(error, `Recurring cleanup failed for channel ${cleanup.channelId}`);
    }
  }
}

const app = new Hono();

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.use('/interactions', async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return c.text('Missing signature headers', 401);
  }

  const rawBody = await c.req.text();
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, config.PUBLIC_KEY);

  if (!isValidRequest) {
    return c.text('Invalid signature', 401);
  }

  c.set('rawBody', rawBody);
  await next();
});

app.post('/interactions', async (c) => {
  const rawBody = c.get('rawBody');

  if (!rawBody) {
    logger.warn('Interactions request received without rawBody');
    return c.text('No body', 400);
  }

  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return c.json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name } = interaction.data;
    const handler = commands.get(name);

    if (!handler) {
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Unknown command.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }

    try {
      return await handler(c);
    } catch (error) {
      logger.error(error, 'Command Error');
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing the command.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }
  }

  return c.text('Unhandled interaction type', 400);
});

export default app;
