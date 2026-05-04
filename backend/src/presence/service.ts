import { redis } from '../redis/client';

const KEY = (userId: string) => `presence:${userId}`;
const TTL_SECONDS = 35; // slightly longer than 30s heartbeat interval

export async function setOnline(userId: string): Promise<void> {
  await redis.set(KEY(userId), '1', 'EX', TTL_SECONDS);
}

export async function setOffline(userId: string): Promise<void> {
  await redis.del(KEY(userId));
}

export async function getOnlineUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) {
    return [];
  }

  const results = await Promise.all(
    userIds.map(async (userId) => {
      const exists = await redis.exists(KEY(userId));
      return exists === 1 ? userId : null;
    })
  );

  return results.filter((id): id is string => id !== null);
}
