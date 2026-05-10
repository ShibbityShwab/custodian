import { isValidTimeFormat } from '../utils/parseTime.js';
import { saveRecurringCleanup, getRecurringCleanups, deleteRecurringCleanup } from '../utils/db.js';
import { getOption } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';

export async function setRecurringCleanup(interaction) {
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

  if (!isValidTimeFormat(periodInput)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Invalid period format. Use format like "30s", "15m", "1h", "1d".',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const success = await saveRecurringCleanup(
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
}

export async function viewCleanupSchedule() {
  const cleanups = await getRecurringCleanups();

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
    value: `**Interval:** ${c.interval_minutes} minutes\n**Age threshold:** ${c.period_input}\n**Last run:** <t:${Math.floor(c.last_run / 1000)}:R>`,
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

export async function cancelRecurringCleanup(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');

  const success = await deleteRecurringCleanup(channelId);

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
}

export async function editRecurringCleanup(interaction) {
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

  const cleanups = await getRecurringCleanups();
  const existing = cleanups.find((c) => c.channel_id === channelId);

  if (!existing) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `No recurring cleanup found for <#${channelId}>. Use \`/setrecurringcleanup\` instead.`,
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const success = await saveRecurringCleanup(
    channelId,
    interaction.guild_id,
    intervalMinutes,
    existing.period_input
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
}
