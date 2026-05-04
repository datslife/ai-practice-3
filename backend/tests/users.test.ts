import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb } from './helpers/db';
import { setOnline } from '../src/presence/service';
import { redis } from '../src/redis/client';

beforeEach(async () => {
  await resetDb();
  await redis.flushdb();
});

async function registerUser(
  app: ReturnType<typeof createApp>,
  name: string,
  email: string,
  password = 'password123'
): Promise<{ token: string; userId: string }> {
  const res = await request(app)
    .post('/auth/register')
    .send({ name, email, password });
  return { token: res.body.token, userId: res.body.user.id };
}

describe('GET /users', () => {
  it('returns 401 when no auth token is provided', async () => {
    const app = createApp();
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
  });

  it('returns 200 with empty users array when only the requester exists', async () => {
    const app = createApp();
    const { token } = await registerUser(app, 'Alice', 'alice@test.com');

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
  });

  it('returns 200 with other users and online: false when not in Redis', async () => {
    const app = createApp();
    const { token } = await registerUser(app, 'Alice', 'alice@test.com');
    await registerUser(app, 'Bob', 'bob@test.com');

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].name).toBe('Bob');
    expect(res.body.users[0].email).toBe('bob@test.com');
    expect(typeof res.body.users[0].id).toBe('string');
    expect(res.body.users[0].online).toBe(false);
    expect(res.body.users[0]).not.toHaveProperty('password_hash');
  });

  it('returns online: true for a user whose setOnline was called before the request', async () => {
    const app = createApp();
    const { token } = await registerUser(app, 'Alice', 'alice@test.com');
    const { userId: bobId } = await registerUser(app, 'Bob', 'bob@test.com');

    await setOnline(bobId);

    const res = await request(app)
      .get('/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.users[0].id).toBe(bobId);
    expect(res.body.users[0].online).toBe(true);
  });
});
