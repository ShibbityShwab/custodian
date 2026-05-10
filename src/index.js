import { Hono } from 'hono';
import { verifyKey } from 'discord-interactions';
import { commands } from './commands/registry.js';
import {
  getPendingReminders,
  getRecurringCleanups,
  deleteReminder,
  updateRecurringCleanupLastRun,
  getPool,
} from './utils/db.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { cleanupMessages } from './commands/cleanup.js';
import { InteractionType, InteractionResponseType, MessageFlags } from './constants.js';
import { logger } from './utils/logger.js';

const app = new Hono();

app.get('/health', async (c) => {
  let dbStatus = 'ok';
  try {
    await getPool().query('SELECT 1');
  } catch (error) {
    dbStatus = 'error';
    logger.error(error, 'Health check DB query failed');
  }
  const status = dbStatus === 'ok' ? 200 : 503;
  return c.json({ status: 'ok', db: dbStatus }, status);
});

app.use('/interactions', async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return c.text('Missing signature headers', 401);
  }

  const rawBody = await c.req.text();
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, process.env.PUBLIC_KEY);

  if (!isValidRequest) {
    return c.text('Invalid signature', 401);
  }

  c.set('rawBody', rawBody);
  await next();
});

app.post('/interactions', async (c) => {
  const rawBody = c.get('rawBody');
  const interaction = JSON.parse(rawBody);

  if (interaction.type === InteractionType.PING) {
    return c.json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name } = interaction.data;
    const handler = commands.get(name);

    try {
      if (!handler) {
        return c.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Unknown command.',
            flags: MessageFlags.EPHEMERAL,
          },
        });
      }

      const result = await handler(interaction);

      if (result && result._backgroundTask) {
        result._backgroundTask().catch((err) => logger.error(err, 'Background task error'));
        return c.json(result.response);
      }

      return c.json(result);
    } catch (error) {
      logger.error(error, 'Command Error');
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing the command. Please try again later.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }
  }

  return c.text('Unhandled interaction type', 400);
});

export async function runScheduledTasks() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

  try {
    const pendingReminders = await getPendingReminders();
    for (const reminder of pendingReminders) {
      try {
        await rest.post(Routes.channelMessages(reminder.channel_id), {
          body: {
            content: `\u23f0 Reminder: ${reminder.message}`,
          },
        });
        await deleteReminder(reminder.id);
      } catch (error) {
        logger.error(error, `Failed to send reminder to ${reminder.channel_id}`);
      }
    }

    const cleanups = await getRecurringCleanups();
    const now = Date.now();

    for (const cleanup of cleanups) {
      const lastRun = cleanup.last_run || 0;
      const intervalMs = cleanup.interval_minutes * 60 * 1000;

      if (now - lastRun >= intervalMs) {
        try {
          logger.info(`Running scheduled cleanup for channel ${cleanup.channel_id}`);
          await cleanupMessages(rest, cleanup.channel_id, cleanup.period_input, false);
          await updateRecurringCleanupLastRun(cleanup.channel_id, now);
        } catch (error) {
          logger.error(error, `Scheduled cleanup failed for channel ${cleanup.channel_id}`);
        }
      }
    }
  } catch (error) {
    logger.error(error, 'Scheduled tasks error');
  }
}

export default app;
