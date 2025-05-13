import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { calculateThreshold, isValidTimeFormat } from '../utils/parseTime.js';
import logger from '../utils/logger.js';

const cleanupTasksMap = new Map();

function updateCleanupTaskState(channelId, isRunning) {
  if (isRunning) {
    if (cleanupTasksMap.has(channelId)) {
      throw new Error('A cleanup task is already running in this channel');
    }
    cleanupTasksMap.set(channelId, { isRunning, startTime: Date.now() });
  } else {
    cleanupTasksMap.delete(channelId);
  }
}

export function isCleanupTaskRunning(channelId) {
  return cleanupTasksMap.has(channelId);
}

export async function cleanupMessages(channel, periodInput, guildId, preview = false) {
  if (!channel) {
    throw new Error('Channel is required');
  }

  if (!isValidTimeFormat(periodInput)) {
    throw new Error('Invalid period format. Use format like "30s", "15m", or "1h"');
  }

  try {
    updateCleanupTaskState(channel.id, true);

    logger.info(`Starting cleanup in channel ${channel.name} (${channel.id})`);
    logger.info(`Period: ${periodInput}, Threshold: ${new Date(calculateThreshold(periodInput)).toISOString()}`);

    let totalDeleted = 0;
    let lastId;
    const batchSize = 100;
    const maxMessages = 1000;

    while (totalDeleted < maxMessages) {
      const options = { limit: batchSize };
      if (lastId) {
        options.before = lastId;
      }

      const messages = await channel.messages.fetch(options);
      if (messages.size === 0) break;

      const threshold = calculateThreshold(periodInput);
      const oldMessages = messages.filter(msg => msg.createdTimestamp < threshold);
      if (oldMessages.size === 0) break;

      if (preview) {
        logger.info(`Would delete ${oldMessages.size} messages in this batch`);
        totalDeleted += oldMessages.size;
      } else {
        try {
          await channel.bulkDelete(oldMessages);
          totalDeleted += oldMessages.size;
          logger.info(`Deleted ${oldMessages.size} messages in this batch`);
        } catch (error) {
          logger.error('Error deleting messages:', error);
          if (error.code === 50034) { // Message too old error
            logger.info('Some messages are too old to bulk delete, trying individual deletion');
            for (const message of oldMessages.values()) {
              try {
                await message.delete();
                totalDeleted++;
              } catch (deleteError) {
                logger.error('Error deleting individual message:', deleteError);
              }
            }
          }
        }
      }

      lastId = messages.last().id;
    }

    logger.info(`Cleanup completed. Total messages ${preview ? 'that would be ' : ''}deleted: ${totalDeleted}`);
    return totalDeleted;
  } catch (error) {
    logger.error('Error during cleanup:', error);
    throw error;
  } finally {
    updateCleanupTaskState(channel.id, false);
  }
}

export async function handleCleanupCommand(interaction) {
  const channel = interaction.options.getChannel('channel');
  const periodInput = interaction.options.getString('age');
  const preview = interaction.options.getBoolean('preview') || false;

  if (!channel) {
    await interaction.reply({ content: 'Please specify a valid channel.', ephemeral: true });
    return;
  }

  if (!interaction.member.permissionsIn(channel).has('ManageMessages')) {
    await interaction.reply({ content: 'You do not have permission to manage messages in this channel.', ephemeral: true });
    return;
  }

  try {
    if (!isValidTimeFormat(periodInput)) {
      await interaction.reply({ content: 'Invalid period format. Use format like "30s", "15m", or "1h"', ephemeral: true });
      return;
    }

    const confirmMessage = preview
      ? `I will preview the cleanup of messages older than ${periodInput} in ${channel}. This will not delete any messages.`
      : `I will clean up messages older than ${periodInput} in ${channel}. This action cannot be undone.`;

    const confirmRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('confirm_cleanup')
          .setLabel('Confirm')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('cancel_cleanup')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.reply({
      content: confirmMessage,
      components: [confirmRow],
      ephemeral: true
    });

    const filter = i => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({ filter, time: 30000 });

    collector.on('collect', async i => {
      if (i.customId === 'confirm_cleanup') {
        await i.update({ content: 'Starting cleanup...', components: [] });
        try {
          const deletedCount = await cleanupMessages(channel, periodInput, interaction.guildId, preview);
          const resultMessage = preview
            ? `Preview complete. ${deletedCount} messages would be deleted.`
            : `Cleanup complete. Deleted ${deletedCount} messages.`;
          await i.editReply({ content: resultMessage, components: [] });
        } catch (error) {
          logger.error('Error during cleanup:', error);
          await i.editReply({ content: `Error during cleanup: ${error.message}`, components: [] });
        }
      } else {
        await i.update({ content: 'Cleanup cancelled.', components: [] });
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await interaction.editReply({ content: 'Cleanup cancelled due to timeout.', components: [] });
      }
    });
  } catch (error) {
    logger.error('Error in cleanup command:', error);
    await interaction.reply({ content: `Error: ${error.message}`, ephemeral: true });
  }
}
