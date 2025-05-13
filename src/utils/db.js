import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import logger from './logger.js';
import fs from 'fs/promises';
import path from 'path';

let db = null;

export async function initDatabase() {
  if (!process.env.USE_DATABASE) {
    logger.info('Database disabled, using in-memory storage');
    return;
  }

  try {
    db = await open({
      filename: process.env.DB_PATH || 'reminders.db',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        channel_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        message TEXT NOT NULL,
        reminder_time INTEGER NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    db = null;
  }
}

export async function saveReminder(reminder) {
  if (!db) return null;

  try {
    const result = await db.run(
      'INSERT INTO reminders (channel_id, guild_id, message, reminder_time, created_at) VALUES (?, ?, ?, ?, ?)',
      [reminder.channelId, reminder.guildId, reminder.message, reminder.time, Date.now()]
    );
    return result.lastID;
  } catch (error) {
    logger.error('Failed to save reminder:', error);
    return null;
  }
}

export async function getPendingReminders() {
  if (!db) return [];

  try {
    return await db.all(
      'SELECT * FROM reminders WHERE reminder_time > ?',
      [Date.now()]
    );
  } catch (error) {
    logger.error('Failed to get pending reminders:', error);
    return [];
  }
}

export async function deleteReminder(id) {
  if (!db) return false;

  try {
    await db.run('DELETE FROM reminders WHERE id = ?', [id]);
    return true;
  } catch (error) {
    logger.error('Failed to delete reminder:', error);
    return false;
  }
}

export async function cleanupOldReminders() {
  if (!db) return;

  try {
    await db.run('DELETE FROM reminders WHERE reminder_time <= ?', [Date.now()]);
  } catch (error) {
    logger.error('Failed to cleanup old reminders:', error);
  }
}

export async function backupDatabase() {
  if (!db) return false;

  try {
    const backupPath = process.env.DB_BACKUP_PATH || 'backups';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupPath, `reminders-${timestamp}.db`);

    // Ensure backup directory exists
    await fs.mkdir(backupPath, { recursive: true });

    // Create backup
    await db.backup(backupFile);
    logger.info(`Database backed up to ${backupFile}`);
    return true;
  } catch (error) {
    logger.error('Failed to backup database:', error);
    return false;
  }
}

export async function restoreDatabase(backupFile) {
  if (!db) return false;

  try {
    // Close current connection
    await db.close();

    // Copy backup file to database location
    const dbPath = process.env.DB_PATH || 'reminders.db';
    await fs.copyFile(backupFile, dbPath);

    // Reopen database
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    logger.info(`Database restored from ${backupFile}`);
    return true;
  } catch (error) {
    logger.error('Failed to restore database:', error);
    return false;
  }
}

export async function listBackups() {
  if (!db) return [];

  try {
    const backupPath = process.env.DB_BACKUP_PATH || 'backups';
    const files = await fs.readdir(backupPath);
    return files.filter(file => file.startsWith('reminders-') && file.endsWith('.db'));
  } catch (error) {
    logger.error('Failed to list backups:', error);
    return [];
  }
}
