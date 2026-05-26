import { logger } from './logger.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';
import { registerRecurringCleanup } from '../recurringState.js';

export function createCommandHandler(handlerFn) {
  return async (c) => {
    const interaction = c.get('interaction') || {};

    try {
      const result = await handlerFn(interaction);

      if (
        result &&
        typeof result === 'object' &&
        result.response &&
        result.backgroundTask &&
        typeof result.backgroundTask === 'function'
      ) {
        result.backgroundTask().catch((err) => {
          logger.error(err, 'Background task error');
        });

        if (result.recurring && result.recurring.channelId) {
          const { channelId, guildId, intervalMinutes, olderThan } = result.recurring;
          registerRecurringCleanup(channelId, guildId, intervalMinutes, olderThan);
        }

        return c.json(result.response);
      }

      if (result && typeof result === 'object' && result.type !== undefined) {
        return c.json(result);
      }

      logger.warn('Command handler returned unexpected format', { result });
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Command executed but returned unexpected format.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    } catch (error) {
      logger.error(error, 'Command handler error');
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing the command.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }
  };
}
