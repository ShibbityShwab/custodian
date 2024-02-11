require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [
  {
    name: 'cleanup',
    description: 'Immediately starts cleaning up messages older than the specified period in a channel',
    options: [
      {
        name: 'channel',
        type: 7,
        description: 'The channel to clean up',
        required: true,
      },
      {
        name: 'age',
        type: 3,
        description: 'Period before cleaning up the messages (e.g., "30s", "15m", "1h")',
        required: true,
      },
    ],
  },
  {
    name: 'setrecurringcleanup',
    description: 'Sets up a recurring cleanup task in a channel at the specified interval',
    options: [
      {
        name: 'channel',
        type: 7,
        description: 'The channel for recurring cleanup',
        required: true,
      },
      {
        name: 'age',
        type: 3,
        description: 'Period before cleaning up messages (e.g., "30s", "15m", "1h")',
        required: true,
      },
      {
        name: 'interval',
        type: 4, // Integer type for the interval in minutes
        description: 'Interval in minutes for the recurring cleanup',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();
