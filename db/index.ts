import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

const DB_PATH = 'db/app.db';

// Ensure db directory exists
const dbDir = dirname(DB_PATH);
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db: Database.Database = new Database(DB_PATH);

// Helper functions
export const run = (sql: string, params: any[] = []) => {
  const stmt = db.prepare(sql);
  return stmt.run(params);
};

export const get = (sql: string, params: any[] = []) => {
  const stmt = db.prepare(sql);
  return stmt.get(params);
};

export const query = (sql: string, params: any[] = []) => {
  const stmt = db.prepare(sql);
  return stmt.all(params);
};

export const initDb = () => {
  // Create users table
  run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create notes table
  run(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
};

export default db;