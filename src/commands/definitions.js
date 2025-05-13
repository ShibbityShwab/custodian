export const commands = [
  {
    name: 'setreminder',
    description: 'Set a reminder for a specific time',
    options: [
      {
        name: 'channel',
        type: 7,
        description: 'The channel to set the reminder in',
        required: true,
      },
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
    name: 'listreminders',
    description: 'List all active reminders',
    options: [
      {
        name: 'channel',
        type: 7,
        description: 'Filter reminders by channel (optional)',
        required: false,
      },
    ],
  },
  {
    name: 'deletereminder',
    description: 'Delete a reminder',
    options: [
      {
        name: 'id',
        type: 3,
        description: 'ID of the reminder to delete',
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
        type: 4,
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
    name: 'backup',
    description: 'Create a database backup (requires database enabled)',
  },
  {
    name: 'restore',
    description: 'Restore from a database backup (requires database enabled)',
    options: [
      {
        name: 'backup',
        type: 3,
        description: 'Name of the backup file to restore from',
        required: true,
      },
    ],
  },
  {
    name: 'listbackups',
    description: 'List available database backups (requires database enabled)',
  },
  {
    name: 'help',
    description: 'List all available commands and their descriptions',
  },
]; 