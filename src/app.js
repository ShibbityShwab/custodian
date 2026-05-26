import { Hono } from 'hono';
import { verifyKey } from 'discord-interactions';
import { InteractionType, InteractionResponseType, MessageFlags } from './constants.js';
import { commands } from './commands/registry.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { rateLimit } from './middleware/rateLimit.js';
import { bodyLimit } from './middleware/bodyLimit.js';

const app = new Hono();

app.use('*', securityHeaders());
app.use('*', rateLimit());

app.get('/health', (c) => {
  return c.json({ status: 'ok' });
});

app.use('/interactions', bodyLimit());
app.use('/interactions', async (c, next) => {
  const signature = c.req.header('X-Signature-Ed25519');
  const timestamp = c.req.header('X-Signature-Timestamp');

  if (!signature || !timestamp) {
    return c.text('Missing signature headers', 401);
  }

  const rawBody = await c.req.text();
  const isValidRequest = await verifyKey(rawBody, signature, timestamp, config.PUBLIC_KEY);

  if (!isValidRequest) {
    return c.text('Invalid signature', 401);
  }

  c.set('rawBody', rawBody);
  await next();
});

app.post('/interactions', async (c) => {
  const rawBody = c.get('rawBody');

  if (!rawBody) {
    logger.warn('Interactions request received without rawBody');
    return c.text('No body', 400);
  }

  const interaction = JSON.parse(rawBody);
  c.set('interaction', interaction);

  if (interaction.type === InteractionType.PING) {
    return c.json({ type: InteractionResponseType.PONG });
  }

  if (interaction.type === InteractionType.APPLICATION_COMMAND) {
    const { name } = interaction.data;
    const handler = commands.get(name);

    if (!handler) {
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Unknown command.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }

    try {
      return await handler(c);
    } catch (error) {
      logger.error(error, 'Command Error');
      return c.json({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'An error occurred while processing the command.',
          flags: MessageFlags.EPHEMERAL,
        },
      });
    }
  }

  return c.text('Unhandled interaction type', 400);
});

export default app;
