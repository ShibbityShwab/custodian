// src/commands/delete-reminder.js
import { getOption, getInteractionUser } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { logger } from '../utils/logger.js';
import { reminderService } from '../services/index.js';
import { createCommandHandler } from '../utils/commandHandler.js';

export async function handlerLogic(interaction) {
  const options = interaction.data.options;
  const id = getOption(options, 'id');
  const userId = getInteractionUser(interaction);

  try {
    const success = await reminderService.delete(id, userId);

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
          content:
            'Failed to delete reminder. It may not exist or you do not have permission to delete it.',
          flags: MessageFlags.EPHEMERAL,
        },
      };
    }
  } catch (error) {
    logger.error(error, 'Failed to delete reminder');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to delete reminder. Please try again later.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}

export const handleDeleteReminderCommand = createCommandHandler(handlerLogic);
export default handleDeleteReminderCommand;
