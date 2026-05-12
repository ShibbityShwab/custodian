// src/utils/commandHandler.js
import { logger } from './logger.js';
import { InteractionResponseType, MessageFlags } from '../constants.js';

/**
 * Wraps a plain handler function (takes an interaction object, returns a response object)
 * into a Hono-compatible handler (takes a Hono context, calls c.json() and returns Hono response).
 *
 * @param {(interaction: object) => Promise<object>} handlerFn - The async function that handles the command logic
 * @returns {(c: HonoContext) => Promise<Response>} A Hono handler that extracts the interaction from context, runs the handler, and sends the response
 */
export function createCommandHandler(handlerFn) {
  return async (c) => {
    // Extract interaction from Hono context
    const rawBody = c.get('rawBody');
    const interaction = rawBody ? JSON.parse(rawBody) : {};

    try {
      const result = await handlerFn(interaction);

      // Handle background task pattern: { response, backgroundTask: () => Promise }
      if (
        result &&
        typeof result === 'object' &&
        result.backgroundTask &&
        typeof result.backgroundTask === 'function'
      ) {
        // Execute background task but don't await it (fire-and-forget with error logging)
        result.backgroundTask().catch((err) => {
          logger.error(err, 'Background task error');
        });
        // Send the immediate response
        return c.json(result.response);
      }

      // Handle direct response object
      if (result && typeof result === 'object' && result.type !== undefined) {
        return c.json(result);
      }

      // Fallback: if handler returned something unexpected, wrap it
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
          content: 'An error occurred while processing the command. Please try again later.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }
  };
}
