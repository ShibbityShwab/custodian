import { getActiveRemindersByChannel } from '../utils/db.js';
import { getOption, getInteractionUser } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';

export async function handleListRemindersCommand(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const userId = getInteractionUser(interaction);

  const reminders = await getActiveRemindersByChannel(channelId, userId);

  if (reminders.length === 0) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: channelId
          ? `No active reminders found for <#${channelId}>.`
          : 'No active reminders found.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const fields = reminders.map((r) => ({
    name: `ID: ${r.id}`,
    value: `**Channel:** <#${r.channel_id}>\n**Message:** ${r.message}\n**Time:** <t:${Math.floor(r.reminder_time / 1000)}:R>`,
  }));

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      embeds: [
        {
          title: 'Active Reminders',
          color: 0x5865f2,
          fields: fields,
        },
      ],
      flags: MessageFlags.EPHEMERAL,
    },
  };
}
