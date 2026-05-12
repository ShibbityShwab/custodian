import fs from 'fs';
import path from 'path';
import { getPool } from './utils/db.js';
import { logger } from './utils/logger.js';

const MIGRATIONS_DIR = new URL('../migrations/', import.meta.url);

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query('SELECT filename FROM migrations ORDER BY filename');
  return new Set(rows.map((r) => r.filename));
}

export async function runMigrations() {
  let client;
  try {
    const pool = getPool();
    client = await pool.connect();

    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        logger.info(`Migration already applied: ${file}`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR.pathname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        logger.info(`Applied migration: ${file}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    logger.info('Migrations complete');
  } catch (error) {
    logger.error(error, 'Migration failed');
    throw error;
  } finally {
    if (client) client.release();
  }
}
