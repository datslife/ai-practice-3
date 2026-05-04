import { pool } from '../src/db/client';

export default async function globalTeardown(): Promise<void> {
  await pool.end().catch(() => null);
}
