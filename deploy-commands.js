import 'dotenv/config';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';

const commands = [
  {
    name: 'setreminder',
    description: 'Set a reminder for a specific time',
    options: [
      {
        name: 'time',
        type: 3,
        description: 'Time for the reminder (e.g., "10m", "1h30m")',
        required: true,
      },
      {
        name: 'message',
        type: 3,
        description: 'Reminder message',
        required: true,
      },
    ],
  },
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
      {
        name: 'preview',
        type: 5,
        description: 'Preview what would be deleted without actually deleting',
        required: false,
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
  {
    name: 'viewcleanupschedule',
    description: 'View all active recurring cleanup schedules',
  },
  {
    name: 'cancelrecurringcleanup',
    description: 'Cancel a recurring cleanup task for a channel',
    options: [
      {
        name: 'channel',
        type: 7,
        description: 'The channel to cancel the recurring cleanup for',
        required: true,
      },
    ],
  },
  {
    name: 'editrecurringcleanup',
    description: 'Edit the interval of a recurring cleanup task for a channel',
    options: [
      {
        name: 'channel',
        type: 7,
        description: 'The channel to edit the recurring cleanup for',
        required: true,
      },
      {
        name: 'interval',
        type: 4,
        description: 'New interval in minutes for the recurring cleanup',
        required: true,
      },
    ],
  },
  {
    name: 'help',
    description: 'List all available commands and their descriptions',
  },
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

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
