import { calculateThreshold, isValidTimeFormat } from '../utils/parseTime.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { getOption } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { logger } from '../utils/logger.js';

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
const BATCH_SIZE = 100;
const MAX_MESSAGES = 1000;

export async function cleanupMessages(rest, channelId, periodInput, preview = false) {
  if (!isValidTimeFormat(periodInput)) {
    throw new Error('Invalid period format. Use format like "30s", "15m", "1h", "1d"');
  }

  let totalDeleted = 0;
  let lastId;
  const threshold = calculateThreshold(periodInput);

  while (totalDeleted < MAX_MESSAGES) {
    const query = new URLSearchParams({ limit: BATCH_SIZE.toString() });
    if (lastId) query.append('before', lastId);

    const messages = await rest.get(Routes.channelMessages(channelId) + `?${query.toString()}`);
    if (messages.length === 0) break;

    const oldMessages = messages.filter((msg) => {
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
      const fourteenDaysAgo = Date.now() - FOURTEEN_DAYS_MS;
      const validForBulk = oldMessages
        .filter((msg) => new Date(msg.timestamp).getTime() > fourteenDaysAgo)
        .map((msg) => msg.id);

      if (validForBulk.length > 1) {
        await rest.post(Routes.channelBulkDelete(channelId), {
          body: { messages: validForBulk },
        });
        totalDeleted += validForBulk.length;
      } else if (validForBulk.length === 1) {
        await rest.delete(Routes.channelMessage(channelId, validForBulk[0]));
        totalDeleted += 1;
      }

      const tooOld = oldMessages.filter(
        (msg) => new Date(msg.timestamp).getTime() <= fourteenDaysAgo
      );
      for (const msg of tooOld) {
        try {
          await rest.delete(Routes.channelMessage(channelId, msg.id));
          totalDeleted += 1;
        } catch (e) {
          logger.error(e, 'Error deleting old message');
        }
      }
    }

    lastId = messages[messages.length - 1].id;
  }

  return totalDeleted;
}

export async function handleCleanupCommand(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const periodInput = getOption(options, 'age');
  const preview = getOption(options, 'preview') || false;

  if (!isValidTimeFormat(periodInput)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Invalid period format. Use format like "30s", "15m", "1h", "1d"',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  return {
    _backgroundTask: async () => {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
      try {
        const deletedCount = await cleanupMessages(rest, channelId, periodInput, preview);
        const resultMessage = preview
          ? `Preview complete. ${deletedCount} messages would be deleted.`
          : `Cleanup complete. Deleted ${deletedCount} messages.`;

        await rest.patch(
          Routes.webhookMessage(process.env.CLIENT_ID, interaction.token, '@original'),
          {
            body: { content: resultMessage },
          }
        );
      } catch (error) {
        logger.error(error, 'Cleanup Error');
        await rest.patch(
          Routes.webhookMessage(process.env.CLIENT_ID, interaction.token, '@original'),
          {
            body: { content: `Error during cleanup: ${error.message}` },
          }
        );
      }
    },
    response: {
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: MessageFlags.EPHEMERAL,
      },
    },
  };
}
