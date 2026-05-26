export const commands = [
  {
    name: 'clean',
    description: 'Delete messages in the current channel',
    default_member_permissions: '8192',
    options: [
      {
        name: 'older_than',
        type: 3,
        description: 'Only delete messages older than this period (e.g. "30s", "15m", "1h", "1d")',
        required: false,
      },
    ],
  },
  {
    name: 'schedule',
    description: 'Manage recurring cleanup schedules',
    default_member_permissions: '8192',
    options: [
      {
        name: 'set',
        description: 'Schedule recurring cleanup in the current channel',
        type: 1,
        options: [
          {
            name: 'every',
            type: 4,
            description: 'Repeat cleanup interval in minutes (1–525600)',
            required: true,
          },
          {
            name: 'older_than',
            type: 3,
            description:
              'Only delete messages older than this period (e.g. "30s", "15m", "1h", "1d")',
            required: false,
          },
        ],
      },
      {
        name: 'list',
        description: 'List all active schedules in this server',
        type: 1,
      },
      {
        name: 'cancel',
        description: 'Cancel the schedule in the current channel',
        type: 1,
      },
    ],
  },
];
