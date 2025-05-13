import { backupDatabase, restoreDatabase, listBackups } from '../utils/db.js';
import logger from '../utils/logger.js';

export async function handleBackupCommand(interaction) {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      await interaction.reply({
        content: 'Database is not enabled. Enable it with USE_DATABASE=true to use backup features.',
        ephemeral: true
      });
      return;
    }

    const success = await backupDatabase();
    if (success) {
      await interaction.reply({
        content: 'Database backup created successfully.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'Failed to create database backup.',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error creating backup:', error);
    await interaction.reply({
      content: 'An error occurred while creating the backup.',
      ephemeral: true
    });
  }
}

export async function handleRestoreCommand(interaction) {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      await interaction.reply({
        content: 'Database is not enabled. Enable it with USE_DATABASE=true to use restore features.',
        ephemeral: true
      });
      return;
    }

    const backupFile = interaction.options.getString('backup');
    const success = await restoreDatabase(backupFile);

    if (success) {
      await interaction.reply({
        content: 'Database restored successfully. The bot will need to be restarted to apply changes.',
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: 'Failed to restore database.',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Error restoring backup:', error);
    await interaction.reply({
      content: 'An error occurred while restoring the backup.',
      ephemeral: true
    });
  }
}

export async function handleListBackupsCommand(interaction) {
  try {
    if (process.env.USE_DATABASE !== 'true') {
      await interaction.reply({
        content: 'Database is not enabled. Enable it with USE_DATABASE=true to use backup features.',
        ephemeral: true
      });
      return;
    }

    const backups = await listBackups();
    if (backups.length === 0) {
      await interaction.reply({
        content: 'No backups found.',
        ephemeral: true
      });
      return;
    }

    const backupList = backups.map(backup => `• ${backup}`).join('\n');
    await interaction.reply({
      content: `**Available Backups:**\n${backupList}`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing backups:', error);
    await interaction.reply({
      content: 'An error occurred while listing backups.',
      ephemeral: true
    });
  }
}
