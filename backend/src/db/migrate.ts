import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

async function migrate(): Promise<void> {
  const localPool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations/001_initial.sql'),
      'utf8'
    );
    await localPool.query(sql);
    console.log('Migration complete');
  } finally {
    await localPool.end();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
