import { pool } from '../src/db/client';
import { redis } from '../src/redis/client';

export default async function globalTeardown(): Promise<void> {
  await Promise.allSettled([pool.end(), redis.quit()]);
}
