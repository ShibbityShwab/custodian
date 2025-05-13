import { parseTime } from '../utils/parseTime.js';
import logger from '../utils/logger.js';
import { saveReminder } from '../utils/db.js';
import { addReminder } from '../utils/reminderStore.js';

export async function handleReminderCommand(interaction) {
  const channel = interaction.options.getChannel('channel');
  const timeInput = interaction.options.getString('time');
  const message = interaction.options.getString('message');

  if (!message || message.trim() === '') {
    await interaction.reply({
      content: 'Please provide a message for the reminder.',
      ephemeral: true
    });
    return;
  }

  try {
    const milliseconds = parseTime(timeInput);
    if (!milliseconds) {
      await interaction.reply({
        content: 'Invalid time format. Please use format like "30s", "5m", or "2h".',
        ephemeral: true
      });
      return;
    }

    const reminderTime = Date.now() + milliseconds;

    // Create reminder object
    const reminder = {
      channelId: channel.id,
      guildId: interaction.guildId,
      message: message,
      time: reminderTime
    };

    // Try to save to database if enabled
    const dbId = await saveReminder(reminder);

    // If database save failed or is disabled, use in-memory storage
    if (dbId === null) {
      const memoryId = Date.now().toString();
      addReminder(memoryId, reminder);
    }

    // Set the timeout
    setTimeout(async () => {
      try {
        const targetChannel = await interaction.client.channels.fetch(channel.id);
        if (targetChannel) {
          await targetChannel.send(`⏰ Reminder: ${message}`);
        }
      } catch (error) {
        logger.error('Error sending reminder:', error);
      }
    }, milliseconds);

    await interaction.reply({
      content: `Reminder set for ${channel} in ${timeInput}.`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error setting reminder:', error);
    await interaction.reply({
      content: 'An error occurred while setting the reminder.',
      ephemeral: true
    });
  }
}
