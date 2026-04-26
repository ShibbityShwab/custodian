import { getActiveRemindersByChannel } from '../utils/db.js';

function getOption(options, name) {
  return options?.find(opt => opt.name === name)?.value;
}

export async function handleListRemindersCommand(interaction, db) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');

  const reminders = await getActiveRemindersByChannel(db, channelId);

  if (reminders.length === 0) {
    return {
      type: 4,
      data: {
        content: channelId
          ? `No active reminders found for <#${channelId}>.`
          : 'No active reminders found.',
        flags: 64, // Ephemeral
      }
    };
  }

  const fields = reminders.map(r => ({
    name: `ID: ${r.id}`,
    value: `**Channel:** <#${r.channel_id}>\n**Message:** ${r.message}\n**Time:** <t:${Math.floor(r.reminder_time / 1000)}:R>`,
  }));

  return {
    type: 4,
    data: {
      embeds: [
        {
          title: 'Active Reminders',
          color: 0x5865F2, // Blurple
          fields: fields
        }
      ],
      flags: 64,
    }
  };
}
