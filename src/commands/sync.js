import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { commands } from './definitions.js';
import 'dotenv/config';

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);
const clientId = process.env.CLIENT_ID;

export async function syncCommands() {
  // Fetch currently registered global commands
  const current = await rest.get(Routes.applicationCommands(clientId));
  const currentNames = current.map(cmd => cmd.name);
  const localNames = commands.map(cmd => cmd.name);

  // Remove commands not in your local list
  for (const cmd of current) {
    if (!localNames.includes(cmd.name)) {
      await rest.delete(Routes.applicationCommand(clientId, cmd.id));
      console.log(`[sync] Deleted old command: ${cmd.name}`);
    }
  }

  // Upsert all local commands (add new, update changed)
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('[sync] Commands synced!');
} 