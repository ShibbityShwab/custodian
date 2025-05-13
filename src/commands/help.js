import { EmbedBuilder } from 'discord.js';

export async function handleHelpCommand(interaction) {
  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle('Custodian Bot Commands')
    .setDescription('Here are all the available commands:')
    .addFields(
      {
        name: '📝 Basic Commands',
        value: `
\`/setreminder\` - Set a reminder for a specific time
• \`time\`: Time for the reminder (e.g., "10m", "1h30m")
• \`message\`: Reminder message

\`/help\` - Show this help message
        `.trim()
      },
      {
        name: '🧹 Cleanup Commands',
        value: `
\`/cleanup\` - Clean up messages older than specified period
• \`channel\`: The channel to clean up
• \`age\`: Period before cleaning up (e.g., "30s", "15m", "1h")
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
    )
    .setFooter({ text: 'Use / before each command to execute it' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
