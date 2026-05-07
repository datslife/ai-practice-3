import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb } from './helpers/db';
import { redis } from '../src/redis/client';
import { getOrCreateConversation, createMessage } from '../src/messaging/service';

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

describe('GET /conversations/with/:recipientId', () => {
  let app: ReturnType<typeof createApp>;
  let aliceToken: string;
  let aliceId: string;
  let bobId: string;

  beforeEach(async () => {
    await resetDb();
    await redis.flushdb();
    app = createApp();

    const alice = await registerUser(app, 'Alice', 'alice@test.com');
    aliceToken = alice.token;
    aliceId = alice.userId;

    const bob = await registerUser(app, 'Bob', 'bob@test.com');
    bobId = bob.userId;
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get(`/conversations/with/${bobId}`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when no conversation exists between the two users', async () => {
    const res = await request(app)
      .get(`/conversations/with/${bobId}`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('returns 200 with conversation data when conversation exists', async () => {
    const conv = await getOrCreateConversation(aliceId, bobId);

    const res = await request(app)
      .get(`/conversations/with/${bobId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(conv.id);
    expect([res.body.user_a_id, res.body.user_b_id]).toContain(aliceId);
    expect([res.body.user_a_id, res.body.user_b_id]).toContain(bobId);
    expect(typeof res.body.created_at).toBe('string');
  });
});

describe('GET /conversations/:id/messages', () => {
  let app: ReturnType<typeof createApp>;
  let aliceToken: string;
  let aliceId: string;
  let bobToken: string;
  let bobId: string;
  let conversationId: string;

  beforeEach(async () => {
    await resetDb();
    await redis.flushdb();
    app = createApp();

    const alice = await registerUser(app, 'Alice', 'alice@test.com');
    aliceToken = alice.token;
    aliceId = alice.userId;

    const bob = await registerUser(app, 'Bob', 'bob@test.com');
    bobToken = bob.token;
    bobId = bob.userId;

    const conv = await getOrCreateConversation(aliceId, bobId);
    conversationId = conv.id;
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get(`/conversations/${conversationId}/messages`);
    expect(res.status).toBe(401);
  });

  it('returns 404 when requester is not a participant', async () => {
    // Register a third user (Eve) who is not part of the conversation
    const eve = await registerUser(app, 'Eve', 'eve@test.com');

    const res = await request(app)
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${eve.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Conversation not found');
  });

  it('returns 200 with empty messages array for an empty conversation', async () => {
    const res = await request(app)
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('messages');
    expect(res.body.messages).toEqual([]);
  });

  it('returns 200 with messages in correct shape after createMessage', async () => {
    await createMessage(conversationId, aliceId, 'Hello Bob!');

    const res = await request(app)
      .get(`/conversations/${conversationId}/messages`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);

    const msg = res.body.messages[0];
    expect(typeof msg.id).toBe('string');
    expect(msg.sender_id).toBe(aliceId);
    expect(msg.content).toBe('Hello Bob!');
    expect(msg.read_at).toBeNull();
    expect(typeof msg.created_at).toBe('string'); // serialized as ISO string over HTTP
  });

  it('respects limit=1 query param when multiple messages exist', async () => {
    await createMessage(conversationId, aliceId, 'First');
    await createMessage(conversationId, bobId, 'Second');
    await createMessage(conversationId, aliceId, 'Third');

    const res = await request(app)
      .get(`/conversations/${conversationId}/messages?limit=1`)
      .set('Authorization', `Bearer ${bobToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0].content).toBe('First');
  });

  it('returns 400 for non-numeric limit', async () => {
    const res = await request(app)
      .get(`/conversations/${conversationId}/messages?limit=abc`)
      .set('Authorization', `Bearer ${aliceToken}`);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('limit must be a positive integer');
  });
});
