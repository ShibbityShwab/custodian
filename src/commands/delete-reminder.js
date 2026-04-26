import { deleteReminder } from '../utils/db.js';

function getOption(options, name) {
  return options?.find(opt => opt.name === name)?.value;
}

export async function handleDeleteReminderCommand(interaction, db) {
  const options = interaction.data.options;
  const id = getOption(options, 'id');

  const success = await deleteReminder(db, id);

  if (success) {
    return {
      type: 4,
      data: {
        content: `Successfully deleted reminder with ID ${id}.`,
        flags: 64, // Ephemeral
      }
    };
  } else {
    return {
      type: 4,
      data: {
        content: 'Failed to delete reminder. It might not exist or there was a database error.',
        flags: 64,
      }
    };
  }
}
