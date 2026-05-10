import { parseTime } from '../utils/parseTime.js';
import { saveReminder } from '../utils/db.js';
import { getOption } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';

export async function handleReminderCommand(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const timeInput = getOption(options, 'time');
  const message = getOption(options, 'message');

  if (!message || message.trim() === '') {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Please provide a message for the reminder.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const milliseconds = parseTime(timeInput);
  if (!milliseconds) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Invalid time format. Please use format like "30s", "5m", "2h", or "1d".',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const reminderTime = Date.now() + milliseconds;

  const reminder = {
    channelId,
    guildId: interaction.guild_id,
    message,
    time: reminderTime,
  };

  const success = await saveReminder(reminder);

  if (!success) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to save the reminder to the database.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  return {
    type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
    data: {
      content: `Reminder set for <#${channelId}> in ${timeInput}.`,
      flags: MessageFlags.EPHEMERAL,
    },
  };
}
