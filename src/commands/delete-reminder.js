import { deleteReminder as deleteDbReminder } from '../utils/db.js';
import { deleteReminder as deleteMemoryReminder } from '../utils/reminderStore.js';
import logger from '../utils/logger.js';

export async function handleDeleteReminderCommand(interaction) {
  try {
    const reminderId = interaction.options.getString('id');
    const useDatabase = process.env.USE_DATABASE === 'true';

    let success;
    if (useDatabase) {
      success = await deleteDbReminder(reminderId);
    } else {
      success = deleteMemoryReminder(reminderId);
    }

    if (success) {
      await interaction.reply({
        content: 'Reminder deleted successfully.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'Reminder not found or could not be deleted.',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error deleting reminder:', error);
    await interaction.reply({
      content: 'An error occurred while deleting the reminder.',
      ephemeral: true
    });
  }
}
