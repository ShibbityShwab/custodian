import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDatabase, getPendingReminders, backupDatabase, restoreDatabase, listBackups } from '../../src/utils/db.js';
import fs from 'fs/promises';
import path from 'path';

describe('Database Operations', () => {
  const testDbPath = 'test.db';
  const testBackupPath = 'test-backups';
  const oldEnv = { ...process.env };

  beforeEach(async () => {
    process.env.USE_DATABASE = 'true';
    process.env.DB_PATH = testDbPath;
    process.env.DB_BACKUP_PATH = testBackupPath;
    // Clean up any existing test files
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    try {
      await fs.rm(testBackupPath, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir(testBackupPath, { recursive: true });
  });

  afterEach(async () => {
    process.env = { ...oldEnv };
    try {
      await fs.unlink(testDbPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
    try {
      await fs.rm(testBackupPath, { recursive: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  });

  it('should initialize database', async () => {
    await initDatabase();
    const stats = await fs.stat(testDbPath);
    expect(stats.isFile()).toBe(true);
  });

  it.skip('should create and list backups', async () => {
    await initDatabase();
    const backupResult = await backupDatabase();
    expect(backupResult).toBe(true);
    const backups = await listBackups();
    expect(backups.length).toBeGreaterThan(0);
  });

  it.skip('should restore from backup', async () => {
    await initDatabase();
    await backupDatabase();
    const backups = await listBackups();
    // Delete the original database
    await fs.unlink(testDbPath);
    // Restore from backup
    const restoreResult = await restoreDatabase(path.join(testBackupPath, backups[0]));
    expect(restoreResult).toBe(true);
    const stats = await fs.stat(testDbPath);
    expect(stats.isFile()).toBe(true);
  });

  it('should handle invalid backup operations gracefully', async () => {
    // Should return false if backup/restore fails
    const backupResult = await restoreDatabase('nonexistent.db');
    expect(backupResult).toBe(false);
  });
}); 