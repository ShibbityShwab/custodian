import { isValidPeriodFormat } from '../utils/parseTime.js';
import { getOption } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { logger } from '../utils/logger.js';
import { createCommandHandler } from '../utils/commandHandler.js';
import { cleanupMessages } from './clean.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { unregisterRecurringCleanup, getGuildSchedules } from '../index.js';

function handleSet(interaction, options) {
  const channelId = interaction.channel_id;
  const every = getOption(options, 'every');
  const olderThan = getOption(options, 'older_than');

  if (olderThan && !isValidPeriodFormat(olderThan)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Invalid period format. Use format like "30s", "15m", "1h", "1d".',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  if (every < 1 || every > 525600) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Recurring interval must be between 1 and 525600 minutes (1 year).',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  return {
    response: {
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        flags: MessageFlags.EPHEMERAL,
      },
    },
    backgroundTask: async () => {
      const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
      try {
        const deletedCount = await cleanupMessages(rest, channelId, olderThan);
        const resultMessage = olderThan
          ? `Scheduled cleanup every ${every} minute(s). Deleted ${deletedCount} messages older than ${olderThan}.`
          : `Scheduled cleanup every ${every} minute(s). Deleted ${deletedCount} messages.`;

        await rest.patch(
          Routes.webhookMessage(process.env.CLIENT_ID, interaction.token, '@original'),
          {
            body: { content: resultMessage },
          }
        );
      } catch (error) {
        logger.error(error, 'Schedule Set Error');
        await rest.patch(
          Routes.webhookMessage(process.env.CLIENT_ID, interaction.token, '@original'),
          {
            body: { content: 'Cleanup failed. Check permissions and try again.' },
          }
        );
      }
    },
    recurring: {
      channelId,
      guildId: interaction.guild_id,
      intervalMinutes: every,
      olderThan: olderThan || null,
    },
  };
}

function handleList(interaction) {
  const guildId = interaction.guild_id;
  const schedules = getGuildSchedules(guildId);

  if (schedules.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'No active schedules in this server.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const now = Date.now();
  const lines = schedules.map((s) => {
    const nextRunMs = s.lastRun + s.intervalMinutes * 60 * 1000;
    const nextRun = nextRunMs > now ? `<t:${Math.floor(nextRunMs / 1000)}:R>` : 'imminent';
    const filter = s.olderThan ? ` \`older_than:${s.olderThan}\`` : '';

    return `• <#${s.channelId}>: every ${s.intervalMinutes}min${filter} (next run ${nextRun})`;
  });

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `**Active Schedules in this server:**\n${lines.join('\n')}`,
      flags: MessageFlags.EPHEMERAL,
    },
  };
}

function handleCancel(interaction) {
  const channelId = interaction.channel_id;
  const guildId = interaction.guild_id;
  const existed = unregisterRecurringCleanup(channelId, guildId);

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: existed
        ? `Schedule cancelled for <#${channelId}>.`
        : `No active schedule in <#${channelId}>.`,
      flags: MessageFlags.EPHEMERAL,
    },
  };
}

export async function handlerLogic(interaction) {
  const subcommand = interaction.data?.options?.[0];

  if (!subcommand) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Use `/schedule set`, `/schedule list`, or `/schedule cancel`.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  switch (subcommand.name) {
    case 'set':
      return handleSet(interaction, subcommand.options || []);
    case 'list':
      return handleList(interaction);
    case 'cancel':
      return handleCancel(interaction);
    default:
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Unknown subcommand.',
          flags: MessageFlags.EPHEMERAL,
        },
      };
  }
}

export const handleScheduleCommand = createCommandHandler(handlerLogic);
export default handleScheduleCommand;
