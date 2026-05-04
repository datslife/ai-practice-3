import fs from 'fs';
import path from 'path';
import { pool } from '../../src/db/client';

export async function resetDb(): Promise<void> {
  await pool.query(
    'DROP TABLE IF EXISTS messages, conversations, users CASCADE'
  );
  const sql = fs.readFileSync(
    path.join(__dirname, '../../src/db/migrations/001_initial.sql'),
    'utf8'
  );
  await pool.query(sql);
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
