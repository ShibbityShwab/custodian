import { calculateThreshold, isValidTimeFormat } from '../utils/parseTime.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

function getOption(options, name) {
  return options?.find(opt => opt.name === name)?.value;
}

export async function cleanupMessages(rest, channelId, periodInput, preview = false) {
  if (!isValidTimeFormat(periodInput)) {
    throw new Error('Invalid period format. Use format like "30s", "15m", "1h", "1d"');
  }

  let totalDeleted = 0;
  let lastId;
  const batchSize = 100;
  const maxMessages = 1000;
  const threshold = calculateThreshold(periodInput);

  while (totalDeleted < maxMessages) {
    const query = new URLSearchParams({ limit: batchSize.toString() });
    if (lastId) query.append('before', lastId);

    const messages = await rest.get(Routes.channelMessages(channelId) + `?${query.toString()}`);
    if (messages.length === 0) break;

    const oldMessages = messages.filter(msg => {
      const msgTimestamp = new Date(msg.timestamp).getTime();
      return msgTimestamp < threshold;
    });

    if (oldMessages.length === 0) {
      lastId = messages[messages.length - 1].id;
      continue;
    }

    if (preview) {
      totalDeleted += oldMessages.length;
    } else {
      // Discord bulk delete only accepts messages younger than 14 days
      const fourteenDaysAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const validForBulk = oldMessages.filter(msg => new Date(msg.timestamp).getTime() > fourteenDaysAgo).map(msg => msg.id);

      if (validForBulk.length > 1) {
        await rest.post(Routes.channelBulkDelete(channelId), {
          body: { messages: validForBulk }
        });
        totalDeleted += validForBulk.length;
      } else if (validForBulk.length === 1) {
        await rest.delete(Routes.channelMessage(channelId, validForBulk[0]));
        totalDeleted += 1;
      }

      // Messages older than 14 days must be deleted one by one (slow)
      const tooOld = oldMessages.filter(msg => new Date(msg.timestamp).getTime() <= fourteenDaysAgo);
      for (const msg of tooOld) {
        try {
          await rest.delete(Routes.channelMessage(channelId, msg.id));
          totalDeleted += 1;
        } catch (e) {
          console.error('Error deleting old message:', e);
        }
      }
    }

    lastId = messages[messages.length - 1].id;
  }

  return totalDeleted;
}

export async function handleCleanupCommand(interaction, env) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const periodInput = getOption(options, 'age');
  const preview = getOption(options, 'preview') || false;

  if (!isValidTimeFormat(periodInput)) {
    return {
      type: 4,
      data: {
        content: 'Invalid period format. Use format like "30s", "15m", "1h", "1d"',
        flags: 64,
      }
    };
  }

  // Check permissions (default_member_permissions handles the UI, but we can double check)
  // To avoid timeout (3s limit), we will defer the response, but doing so makes it non-ephemeral by default
  // unless we specify flags in the defer.

  // Return a deferred message
  // Then we will kick off a background task if possible, but in this function we can't easily access ctx.waitUntil
  // So we will just do the preview inline if it's preview, or if it's real we might hit the 3s timeout.
  // Actually, wait, let's just use ctx.waitUntil in index.js. We need to modify handleCleanupCommand to just return the instruction to background task.
  // We'll return a special object that index.js interprets.
  return {
    _backgroundTask: async () => {
      const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);
      try {
        const deletedCount = await cleanupMessages(rest, channelId, periodInput, preview);
        const resultMessage = preview
          ? `Preview complete. ${deletedCount} messages would be deleted.`
          : `Cleanup complete. Deleted ${deletedCount} messages.`;

        await rest.patch(Routes.webhookMessage(env.CLIENT_ID, interaction.token, '@original'), {
          body: { content: resultMessage }
        });
      } catch (error) {
        console.error('Cleanup Error:', error);
        await rest.patch(Routes.webhookMessage(env.CLIENT_ID, interaction.token, '@original'), {
          body: { content: `Error during cleanup: ${error.message}` }
        });
      }
    },
    response: {
      type: 5, // DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
      data: {
        flags: 64 // Ephemeral
      }
    }
  };
}
