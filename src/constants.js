/**
 * Discord interaction and response type constants
 */

export const InteractionType = Object.freeze({
  PING: 1,
  APPLICATION_COMMAND: 2,
});

export const InteractionResponseType = Object.freeze({
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
});

export const MessageFlags = Object.freeze({
  EPHEMERAL: 64,
});
