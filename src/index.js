import { Hono } from 'hono';
import { verifyKey } from 'discord-interactions';
import { handleCleanupCommand } from './commands/cleanup.js';
import {
  setRecurringCleanup,
  viewCleanupSchedule,
  cancelRecurringCleanup,
  editRecurringCleanup
} from './commands/recurring-cleanup.js';
import { handleReminderCommand } from './commands/reminder.js';
import { handleListRemindersCommand } from './commands/list-reminders.js';
import { handleDeleteReminderCommand } from './commands/delete-reminder.js';
import { handleHelpCommand } from './commands/help.js';
import { getPendingReminders, getRecurringCleanups, deleteReminder } from './utils/db.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { cleanupMessages } from './commands/cleanup.js';

const app = new Hono();

// Middleware to verify Discord requests
app.use('/interactions', async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return c.text('Missing signature headers', 401);
  }

  const rawBody = await c.req.text();
  const isValidRequest = verifyKey(
    rawBody,
    signature,
    timestamp,
    c.env.PUBLIC_KEY
  );

  if (!isValidRequest) {
    return c.text('Invalid signature', 401);
  }

  c.set('rawBody', rawBody);
  await next();
});

app.post('/interactions', async (c) => {
  const rawBody = c.get('rawBody');
  const interaction = JSON.parse(rawBody);

  // Interaction type 1 is a PING request
  if (interaction.type === 1) {
    return c.json({ type: 1 });
  }

  // Interaction type 2 is an APPLICATION_COMMAND
  if (interaction.type === 2) {
    const { name } = interaction.data;
    const db = c.env.DB;
    const env = c.env;

    try {
      switch (name) {
        case 'setreminder': {
          const remRes = await handleReminderCommand(interaction, db);
          return c.json(remRes);
        }
        case 'listreminders': {
          const listRes = await handleListRemindersCommand(interaction, db);
          return c.json(listRes);
        }
        case 'deletereminder': {
          const delRes = await handleDeleteReminderCommand(interaction, db);
          return c.json(delRes);
        }
        case 'cleanup': {
          const cleanRes = await handleCleanupCommand(interaction, env);
          if (cleanRes._backgroundTask) {
            c.executionCtx.waitUntil(cleanRes._backgroundTask());
            return c.json(cleanRes.response);
          }
          return c.json(cleanRes);
        }
        case 'setrecurringcleanup': {
          const setRecRes = await setRecurringCleanup(interaction, db);
          return c.json(setRecRes);
        }
        case 'viewcleanupschedule': {
          const viewRecRes = await viewCleanupSchedule(interaction, db);
          return c.json(viewRecRes);
        }
        case 'cancelrecurringcleanup': {
          const cancelRecRes = await cancelRecurringCleanup(interaction, db);
          return c.json(cancelRecRes);
        }
        case 'editrecurringcleanup': {
          const editRecRes = await editRecurringCleanup(interaction, db);
          return c.json(editRecRes);
        }
        case 'help': {
          const helpRes = await handleHelpCommand(interaction);
          return c.json(helpRes);
        }
        default:
          return c.json({
            type: 4,
            data: {
              content: 'Unknown command.',
              flags: 64, // Ephemeral
            }
          });
      }
    } catch (error) {
      console.error('Command Error:', error);
      return c.json({
        type: 4,
        data: {
          content: `Error: ${error.message}`,
          flags: 64,
        }
      });
    }
  }

  return c.text('Unhandled interaction type', 400);
});

export default {
  fetch: app.fetch,

  // Scheduled cron jobs (runs every minute via wrangler.toml cron trigger)
  async scheduled(event, env, ctx) {
    const db = env.DB;
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);

    ctx.waitUntil(
      (async () => {
        // 1. Process pending reminders
        const pendingReminders = await getPendingReminders(db);
        for (const reminder of pendingReminders) {
          try {
            await rest.post(Routes.channelMessages(reminder.channel_id), {
              body: {
                content: `⏰ Reminder: ${reminder.message}`
              }
            });
            await deleteReminder(db, reminder.id);
          } catch (error) {
            console.error(`Failed to send reminder to ${reminder.channel_id}:`, error);
          }
        }

        // 2. Process recurring cleanups
        const cleanups = await getRecurringCleanups(db);
        const now = Date.now();

        for (const cleanup of cleanups) {
          const lastRun = cleanup.last_run || 0;
          const intervalMs = cleanup.interval_minutes * 60 * 1000;

          if (now - lastRun >= intervalMs) {
            try {
              console.log(`Running scheduled cleanup for channel ${cleanup.channel_id}`);
              await cleanupMessages(rest, cleanup.channel_id, cleanup.period_input, false);

              await db.prepare('UPDATE recurring_cleanups SET last_run = ? WHERE channel_id = ?')
                .bind(now, cleanup.channel_id)
                .run();
            } catch (error) {
              console.error(`Scheduled cleanup failed for channel ${cleanup.channel_id}:`, error);
            }
          }
        }
      })()
    );
  }
};
