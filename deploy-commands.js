import 'dotenv/config';
import { logger } from './src/utils/logger.js';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { commands } from './src/commands/definitions.js';

export async function deployCommands() {
  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
  try {
    logger.info('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });

    logger.info('Successfully reloaded application (/) commands.');
  } catch (error) {
    logger.error(error, 'Failed to deploy commands');
    throw error;
  }
}
