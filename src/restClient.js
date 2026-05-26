import { REST } from '@discordjs/rest';
import { config } from './config.js';

export const rest = new REST({ version: '10' }).setToken(config.DISCORD_BOT_TOKEN);
