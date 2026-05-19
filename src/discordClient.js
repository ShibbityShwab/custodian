// src/discordClient.js
import { Client, GatewayIntentBits } from 'discord.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';

let client = null;

export async function startDiscordClient() {
  if (client) return client;

  client = new Client({
    intents: [GatewayIntentBits.Guilds],
    // Don't sync all members (we don't need them)
    presence: {
      status: 'online',
      activities: [{ name: '/clean', type: 2 }],
    },
  });

  client.once('ready', () => {
    logger.info(`Discord client ready! Logged in as ${client.user.tag}`);
  });

  client.on('error', (error) => {
    logger.error(error, 'Discord client error');
  });

  await client.login(config.DISCORD_BOT_TOKEN);
  return client;
}

export function getDiscordClient() {
  return client;
}

export async function stopDiscordClient() {
  if (client) {
    await client.destroy();
    client = null;
    logger.info('Discord client stopped');
  }
}
