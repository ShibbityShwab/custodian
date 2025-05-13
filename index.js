import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import logger from './src/utils/logger.js';
import { handleCleanupCommand } from './src/commands/cleanup.js';
import { 
  setRecurringCleanup, 
  viewCleanupSchedule, 
  cancelRecurringCleanup, 
  editRecurringCleanup,
  cleanupAllRecurringTasks 
} from './src/commands/recurring-cleanup.js';
import { handleReminderCommand } from './src/commands/reminder.js';
import { handleHelpCommand } from './src/commands/help.js';
import http from 'http';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const HEALTH_CHECK_PORT = process.env.HEALTH_CHECK_PORT || 8080;

// Simple HTTP health check
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(HEALTH_CHECK_PORT, () => {
  logger.info(`Health check server is listening on port ${HEALTH_CHECK_PORT}`);
});

client.once(Events.ClientReady, () => {
  logger.info(`Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isCommand()) return;

  try {
    switch (interaction.commandName) {
      case 'setreminder':
        await handleReminderCommand(interaction);
        break;
      case 'cleanup':
        await handleCleanupCommand(interaction);
        break;
      case 'setrecurringcleanup':
        const channel = interaction.options.getChannel('channel');
        const periodInput = interaction.options.getString('age');
        const intervalMinutes = interaction.options.getInteger('interval');
        await setRecurringCleanup(channel.id, interaction.guildId, intervalMinutes, client, periodInput);
        await interaction.reply({ 
          content: `Recurring cleanup set for ${channel} every ${intervalMinutes} minutes, cleaning messages older than ${periodInput}.`, 
          ephemeral: true 
        });
        break;
      case 'viewcleanupschedule':
        const schedule = await viewCleanupSchedule();
        await interaction.reply({ content: schedule, ephemeral: true });
        break;
      case 'cancelrecurringcleanup':
        const channelToCancel = interaction.options.getChannel('channel');
        await cancelRecurringCleanup(channelToCancel.id);
        await interaction.reply({ 
          content: `Recurring cleanup cancelled for ${channelToCancel}.`, 
          ephemeral: true 
        });
        break;
      case 'editrecurringcleanup':
        const channelToEdit = interaction.options.getChannel('channel');
        const newInterval = interaction.options.getInteger('interval');
        await editRecurringCleanup(channelToEdit.id, newInterval);
        await interaction.reply({ 
          content: `Recurring cleanup interval updated to ${newInterval} minutes for ${channelToEdit}.`, 
          ephemeral: true 
        });
        break;
      case 'help':
        await handleHelpCommand(interaction);
        break;
      default:
        await interaction.reply({ 
          content: 'Unknown command. Use /help to see available commands.', 
          ephemeral: true 
        });
    }
  } catch (error) {
    logger.error('Error handling command:', error);
    const errorMessage = error.message || 'An error occurred while processing the command.';
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
});

// Handle process termination
async function shutdown() {
  logger.info('Shutting down gracefully...');
  try {
    cleanupAllRecurringTasks();
    server.close(() => {
      logger.info('Health check server closed');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

client.login(process.env.DISCORD_BOT_TOKEN).catch(error => {
  logger.error('Failed to login:', error);
  process.exit(1);
});
