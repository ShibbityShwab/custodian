// src/commands/recurring-cleanup.js
import { isValidPeriodFormat } from '../utils/parseTime.js';
import { getOption } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { logger } from '../utils/logger.js';
import { cleanupService } from '../services/index.js';
import { createCommandHandler } from '../utils/commandHandler.js';

// ----- plain handler logic functions (take interaction, return response) -----

export async function viewCleanupScheduleLogic() {
  const cleanups = await cleanupService.getRecurring();

  if (cleanups.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'No active recurring cleanups.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const fields = cleanups.map((c) => ({
    name: `Channel: <#${c.channel_id}>`,
    value: `**Interval:** ${c.interval_minutes} minutes\n**Age threshold:** ${c.period_input}\n**Last run:** ${c.last_run ? `<t:${Math.floor(c.last_run / 1000)}:R>` : 'Never'}`,
  }));

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: 'Active Recurring Cleanups',
          color: 0x5865f2,
          fields: fields,
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  };
}

export async function cancelRecurringCleanupLogic(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');

  try {
    const success = await cleanupService.repository.deleteRecurringCleanup(channelId);

    if (success) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Recurring cleanup cancelled for <#${channelId}>.`,
          flags: MessageFlags.EPHEMERAL,
        },
      };
    } else {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `No recurring cleanup found for <#${channelId}> or failed to delete.`,
          flags: MessageFlags.EPHEMERAL,
        },
      };
    }
  } catch (error) {
    logger.error(error, 'Failed to cancel recurring cleanup');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to cancel recurring cleanup. Please try again later.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}

export async function editRecurringCleanupLogic(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const intervalMinutes = getOption(options, 'interval');

  if (intervalMinutes < 1) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Interval must be at least 1 minute.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  try {
    const existingCleanup = await cleanupService.repository.getRecurringCleanup(channelId);

    if (!existingCleanup) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `No recurring cleanup found for <#${channelId}>. Use \`/setrecurringcleanup\` instead.`,
          flags: MessageFlags.EPHEMERAL,
        },
      };
    }

    const success = await cleanupService.repository.saveRecurringCleanup(
      channelId,
      interaction.guild_id,
      intervalMinutes,
      existingCleanup.period_input,
      true
    );

    if (success) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Recurring cleanup interval updated to ${intervalMinutes} minutes for <#${channelId}>.`,
          flags: MessageFlags.EPHEMERAL,
        },
      };
    } else {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Failed to update recurring cleanup.',
          flags: MessageFlags.EPHEMERAL,
        },
      };
    }
  } catch (error) {
    logger.error(error, 'Failed to edit recurring cleanup');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to update recurring cleanup. Please try again later.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}

export async function setRecurringCleanupLogic(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const periodInput = getOption(options, 'age');
  const intervalMinutes = getOption(options, 'interval');

  if (intervalMinutes < 1) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Interval must be at least 1 minute.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  if (!isValidPeriodFormat(periodInput)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Invalid period format. Use format like "30s", "15m", "1h", "1d".',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  try {
    const success = await cleanupService.repository.saveRecurringCleanup(
      channelId,
      interaction.guild_id,
      intervalMinutes,
      periodInput
    );

    if (success) {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `Recurring cleanup set for <#${channelId}> every ${intervalMinutes} minutes, cleaning messages older than ${periodInput}.`,
          flags: MessageFlags.EPHEMERAL,
        },
      };
    } else {
      return {
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Failed to save recurring cleanup.',
          flags: MessageFlags.EPHEMERAL,
        },
      };
    }
  } catch (error) {
    logger.error(error, 'Failed to save recurring cleanup');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to save recurring cleanup. Please try again later.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}

// ----- wrapped Hono-compatible exports -----

export const viewCleanupSchedule = createCommandHandler(viewCleanupScheduleLogic);
export const cancelRecurringCleanup = createCommandHandler(cancelRecurringCleanupLogic);
export const editRecurringCleanup = createCommandHandler(editRecurringCleanupLogic);
export const setRecurringCleanup = createCommandHandler(setRecurringCleanupLogic);
