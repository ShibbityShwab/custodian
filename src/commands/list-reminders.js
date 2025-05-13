import { getPendingReminders } from '../utils/db.js';
import { getAllReminders } from '../utils/reminderStore.js';
import logger from '../utils/logger.js';

export async function handleListRemindersCommand(interaction) {
  try {
    const channel = interaction.options.getChannel('channel');
    const useDatabase = process.env.USE_DATABASE === 'true';

    let reminders;
    if (useDatabase) {
      reminders = await getPendingReminders();
    } else {
      reminders = getAllReminders();
    }

    // Filter by channel if specified
    if (channel) {
      reminders = reminders.filter(r => r.channel_id === channel.id || r.channelId === channel.id);
    }

    if (reminders.length === 0) {
      await interaction.reply({
        content: 'No active reminders found.',
        ephemeral: true
      });
      return;
    }

    // Format reminders for display
    const reminderList = reminders.map(r => {
      const time = new Date(r.reminder_time || r.time);
      const channelId = r.channel_id || r.channelId;
      return `• ${r.message} (${time.toLocaleString()}) in <#${channelId}>`;
    }).join('\n');

    await interaction.reply({
      content: `**Active Reminders:**\n${reminderList}`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing reminders:', error);
    await interaction.reply({
      content: 'An error occurred while listing reminders.',
      ephemeral: true
    });
  }
}
