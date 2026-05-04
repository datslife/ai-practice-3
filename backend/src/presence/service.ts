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
  if (userIds.length === 0) return [];
  const pipeline = redis.pipeline();
  userIds.forEach((id) => pipeline.exists(KEY(id)));
  const results = await pipeline.exec();
  return userIds.filter((_, i) => results?.[i]?.[1] === 1);
}
