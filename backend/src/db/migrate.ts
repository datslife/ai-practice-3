import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pool } from './client';

async function migrate(): Promise<void> {
  const sql = fs.readFileSync(
    path.join(__dirname, 'migrations/001_initial.sql'),
    'utf8'
  );
  await pool.query(sql);
  console.log('Migration complete');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
