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
      {
        name: 'recurring',
        type: 4,
        description: 'Repeat cleanup on an interval (in minutes)',
        required: false,
      },
    ],
  },
];
