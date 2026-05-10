import { deleteReminder } from '../utils/db.js';
import { getOption } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';

export async function handleDeleteReminderCommand(interaction) {
  const options = interaction.data.options;
  const id = getOption(options, 'id');

  const success = await deleteReminder(id);

  if (success) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Successfully deleted reminder with ID ${id}.`,
        flags: MessageFlags.EPHEMERAL,
      },
    };
  } else {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to delete reminder. It might not exist or there was a database error.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}
