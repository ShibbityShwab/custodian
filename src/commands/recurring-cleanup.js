import { isValidTimeFormat } from '../utils/parseTime.js';
import {
  saveRecurringCleanup,
  getRecurringCleanups,
  deleteRecurringCleanup
} from '../utils/db.js';

function getOption(options, name) {
  return options?.find(opt => opt.name === name)?.value;
}

export async function setRecurringCleanup(interaction, db) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const periodInput = getOption(options, 'age');
  const intervalMinutes = getOption(options, 'interval');

  if (intervalMinutes < 1) {
    return {
      type: 4,
      data: {
        content: 'Interval must be at least 1 minute.',
        flags: 64,
      }
    };
  }

  if (!isValidTimeFormat(periodInput)) {
    return {
      type: 4,
      data: {
        content: 'Invalid period format. Use format like "30s", "15m", "1h", "1d".',
        flags: 64,
      }
    };
  }

  const success = await saveRecurringCleanup(
    db,
    channelId,
    interaction.guild_id,
    intervalMinutes,
    periodInput
  );

  if (success) {
    return {
      type: 4,
      data: {
        content: `Recurring cleanup set for <#${channelId}> every ${intervalMinutes} minutes, cleaning messages older than ${periodInput}.`,
        flags: 64,
      }
    };
  } else {
    return {
      type: 4,
      data: {
        content: 'Failed to save recurring cleanup.',
        flags: 64,
      }
    };
  }
}

export async function viewCleanupSchedule(interaction, db) {
  const cleanups = await getRecurringCleanups(db);

  if (cleanups.length === 0) {
    return {
      type: 4,
      data: {
        content: 'No active recurring cleanups.',
        flags: 64,
      }
    };
  }

  const fields = cleanups.map(c => ({
    name: `Channel: <#${c.channel_id}>`,
    value: `**Interval:** ${c.interval_minutes} minutes\n**Age threshold:** ${c.period_input}\n**Last run:** <t:${Math.floor(c.last_run / 1000)}:R>`,
  }));

  return {
    type: 4,
    data: {
      embeds: [
        {
          title: 'Active Recurring Cleanups',
          color: 0x5865F2,
          fields: fields
        }
      ],
      flags: 64,
    }
  };
}

export async function cancelRecurringCleanup(interaction, db) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');

  const success = await deleteRecurringCleanup(db, channelId);

  if (success) {
    return {
      type: 4,
      data: {
        content: `Recurring cleanup cancelled for <#${channelId}>.`,
        flags: 64,
      }
    };
  } else {
    return {
      type: 4,
      data: {
        content: `No recurring cleanup found for <#${channelId}> or failed to delete.`,
        flags: 64,
      }
    };
  }
}

export async function editRecurringCleanup(interaction, db) {
  // Essentially the same as setRecurringCleanup but checking if it exists
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const intervalMinutes = getOption(options, 'interval');

  if (intervalMinutes < 1) {
    return {
      type: 4,
      data: {
        content: 'Interval must be at least 1 minute.',
        flags: 64,
      }
    };
  }

  // We need to fetch it to preserve the period_input
  const cleanups = await getRecurringCleanups(db);
  const existing = cleanups.find(c => c.channel_id === channelId);

  if (!existing) {
    return {
      type: 4,
      data: {
        content: `No recurring cleanup found for <#${channelId}>. Use \`/setrecurringcleanup\` instead.`,
        flags: 64,
      }
    };
  }

  const success = await saveRecurringCleanup(
    db,
    channelId,
    interaction.guild_id,
    intervalMinutes,
    existing.period_input
  );

  if (success) {
    return {
      type: 4,
      data: {
        content: `Recurring cleanup interval updated to ${intervalMinutes} minutes for <#${channelId}>.`,
        flags: 64,
      }
    };
  } else {
    return {
      type: 4,
      data: {
        content: 'Failed to update recurring cleanup.',
        flags: 64,
      }
    };
  }
}
