// src/index.js
import { Hono } from 'hono';
import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType, MessageFlags } from './constants.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { commands } from './commands/registry.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';
import { getPool } from './utils/db.js';
import { reminderService } from './services/index.js';
import { cleanupService } from './services/index.js';

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
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, config.PUBLIC_KEY);

  if (!isValidRequest) {
    return c.text('Invalid signature', 401);
  }

  c.set('rawBody', rawBody);
  await next();
});

app.post('/interactions', async (c) => {
  const rawBody = c.get('rawBody');
  logger.info(`Received interaction: ${rawBody}`);
  console.log('DEBUG: Received request at /interactions');

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
      // The handler (wrapped by createCommandHandler) already:
      // 1. Extracts interaction from context
      // 2. Calls the plain handler function
      // 3. Calls c.json() and returns the Hono Response
      return await handler(c);
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
  const rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);

  try {
    // Handle pending reminders
    const pendingReminders = await reminderService.getPending();
    for (const reminder of pendingReminders) {
      try {
        await rest.post(Routes.channelMessages(reminder.channel_id), {
          body: {
            content: `\u23f0 Reminder: ${reminder.message}`,
          },
        });
        await reminderService.delete(reminder.id);
      } catch (error) {
        logger.error(error, `Failed to send reminder to ${reminder.channel_id}`);
      }
    }

    // Handle scheduled cleanups
    await cleanupService.runScheduledCleanups(rest);
  } catch (error) {
    logger.error(error, 'Scheduled tasks error');
  }
}

export default app;
