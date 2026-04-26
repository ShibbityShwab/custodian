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
        description: 'Time for the reminder (e.g., "10m", "1h30m", "1d")',
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
        type: 4,
        description: 'ID of the reminder to delete',
        required: true,
      },
    ],
  },
  {
    name: 'cleanup',
    description: 'Immediately starts cleaning up messages older than the specified period in a channel',
    default_member_permissions: '8192', // MANAGE_MESSAGES
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
        description: 'Period before cleaning up the messages (e.g., "30s", "15m", "1h", "1d")',
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
    default_member_permissions: '8192', // MANAGE_MESSAGES
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
        description: 'Period before cleaning up messages (e.g., "30s", "15m", "1h", "1d")',
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
    default_member_permissions: '8192', // MANAGE_MESSAGES
  },
  {
    name: 'cancelrecurringcleanup',
    description: 'Cancel a recurring cleanup task for a channel',
    default_member_permissions: '8192', // MANAGE_MESSAGES
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
    default_member_permissions: '8192', // MANAGE_MESSAGES
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
