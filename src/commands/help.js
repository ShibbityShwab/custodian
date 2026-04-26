export async function handleHelpCommand(interaction) {
  return {
    type: 4,
    data: {
      embeds: [
        {
          color: 0x0099ff,
          title: 'Custodian Bot Commands',
          description: 'Here are all the available commands:',
          fields: [
            {
              name: '📝 Basic Commands',
              value: `
\`/setreminder\` - Set a reminder for a specific time
• \`time\`: Time for the reminder (e.g., "10m", "1h30m", "1d")
• \`message\`: Reminder message

\`/listreminders\` - List your active reminders
\`/deletereminder\` - Delete a reminder by ID
\`/help\` - Show this help message
              `.trim()
            },
            {
              name: '🧹 Cleanup Commands (Requires Manage Messages)',
              value: `
\`/cleanup\` - Clean up messages older than specified period
• \`channel\`: The channel to clean up
• \`age\`: Period before cleaning up (e.g., "30s", "15m", "1h", "1d")
• \`preview\`: Preview what would be deleted without actually deleting

\`/setrecurringcleanup\` - Set up recurring cleanup
• \`channel\`: The channel for recurring cleanup
• \`age\`: Period before cleaning up messages
• \`interval\`: Interval in minutes for the recurring cleanup

\`/viewcleanupschedule\` - View all active recurring cleanup schedules

\`/cancelrecurringcleanup\` - Cancel a recurring cleanup task
• \`channel\`: The channel to cancel the recurring cleanup for

\`/editrecurringcleanup\` - Edit a recurring cleanup task
• \`channel\`: The channel to edit the recurring cleanup for
• \`interval\`: New interval in minutes
              `.trim()
            }
          ],
          footer: {
            text: 'Use / before each command to execute it'
          }
        }
      ],
      flags: 64 // Ephemeral
    }
  };
}
