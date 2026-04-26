import { parseTime } from '../utils/parseTime.js';
import { saveReminder } from '../utils/db.js';

function getOption(options, name) {
  return options?.find(opt => opt.name === name)?.value;
}

export async function handleReminderCommand(interaction, db) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const timeInput = getOption(options, 'time');
  const message = getOption(options, 'message');

  if (!message || message.trim() === '') {
    return {
      type: 4,
      data: {
        content: 'Please provide a message for the reminder.',
        flags: 64, // Ephemeral
      }
    };
  }

  const milliseconds = parseTime(timeInput);
  if (!milliseconds) {
    return {
      type: 4,
      data: {
        content: 'Invalid time format. Please use format like "30s", "5m", "2h", or "1d".',
        flags: 64,
      }
    };
  }

  const reminderTime = Date.now() + milliseconds;

  const reminder = {
    channelId,
    guildId: interaction.guild_id,
    message,
    time: reminderTime
  };

  const success = await saveReminder(db, reminder);

  if (!success) {
    return {
      type: 4,
      data: {
        content: 'Failed to save the reminder to the database.',
        flags: 64,
      }
    };
  }

  return {
    type: 4,
    data: {
      content: `Reminder set for <#${channelId}> in ${timeInput}.`,
      flags: 64,
    }
  };
}
