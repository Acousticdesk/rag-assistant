import BetterSqlite3 from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../../config';
import { logger } from '../../logger';

let db: BetterSqlite3.Database;

export function getDb(): BetterSqlite3.Database {
  if (!db) {
    logger.info(`Opening database at ${config.dbPath}`);
    db = new BetterSqlite3(config.dbPath);
    logger.debug('Database: applying pragmas (WAL journal, foreign keys)');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
    logger.debug(`Database: executing schema (${schema.length} chars)`);
    db.exec(schema);
    logger.info('Database ready');
  }
  return db;
}
