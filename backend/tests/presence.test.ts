import { redis } from '../src/redis/client';
import { setOnline, setOffline, getOnlineUserIds } from '../src/presence/service';

const KEY = (userId: string) => `presence:${userId}`;

beforeEach(async () => {
  await redis.flushdb();
});

describe('setOnline', () => {
  it('sets the presence key in Redis', async () => {
    const userId = 'user-1';
    await setOnline(userId);
    const exists = await redis.exists(KEY(userId));
    expect(exists).toBe(1);
  });

  it('sets a TTL ≤ 35s on the key', async () => {
    const userId = 'user-2';
    await setOnline(userId);
    const ttl = await redis.ttl(KEY(userId));
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(35);
  });
});

describe('setOffline', () => {
  it('removes the presence key after setOnline', async () => {
    const userId = 'user-3';
    await setOnline(userId);
    await setOffline(userId);
    const exists = await redis.exists(KEY(userId));
    expect(exists).toBe(0);
  });
});

describe('getOnlineUserIds', () => {
  it('returns [] when given an empty array', async () => {
    const result = await getOnlineUserIds([]);
    expect(result).toEqual([]);
  });

  it('returns only the online users from the given list', async () => {
    const id1 = 'user-online';
    const id2 = 'user-offline';
    await setOnline(id1);
    // id2 is never set — deliberately offline
    const result = await getOnlineUserIds([id1, id2]);
    expect(result).toEqual([id1]);
  });
});
