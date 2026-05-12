// src/commands/reminder.js
import { parseTime, isValidTimeFormat } from '../utils/parseTime.js';
import { getOption, getInteractionUser } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { logger } from '../utils/logger.js';
import { reminderService } from '../services/index.js';
import { createCommandHandler } from '../utils/commandHandler.js';

export async function handlerLogic(interaction) {
  const options = interaction.data?.options || [];
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

  if (!isValidTimeFormat(timeInput)) {
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Invalid time format. Please use format like "30s", "5m", "2h", or "1d".',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }

  const milliseconds = parseTime(timeInput);
  const reminderTime = Date.now() + milliseconds;

  try {
    await reminderService.create({
      channelId,
      userId: getInteractionUser(interaction),
      message,
      expiresAt: reminderTime,
    });

    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: `Reminder set for <#${channelId}> in ${timeInput}.`,
        flags: MessageFlags.EPHEMERAL,
      },
    };
  } catch (error) {
    logger.error(error, 'Failed to save reminder');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to save the reminder. Please try again later.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}

export const handleReminderCommand = createCommandHandler(handlerLogic);
export default handleReminderCommand;
