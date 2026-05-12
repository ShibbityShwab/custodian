// src/commands/list-reminders.js
import { getOption, getInteractionUser } from '../utils/helpers.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { logger } from '../utils/logger.js';
import { reminderService } from '../services/index.js';
import { createCommandHandler } from '../utils/commandHandler.js';

export async function handlerLogic(interaction) {
  const options = interaction.data.options;
  const channelId = getOption(options, 'channel');
  const userId = getInteractionUser(interaction);

  try {
    const reminders = await reminderService.getActiveByChannel(channelId, userId);

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
  } catch (error) {
    logger.error(error, 'Failed to list reminders');
    return {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: 'Failed to list reminders. Please try again later.',
        flags: MessageFlags.EPHEMERAL,
      },
    };
  }
}

export const handleListRemindersCommand = createCommandHandler(handlerLogic);
export default handleListRemindersCommand;
