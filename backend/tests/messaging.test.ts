import request from 'supertest';
import { createApp } from '../src/app';
import { resetDb } from './helpers/db';
import {
  getOrCreateConversation,
  createMessage,
  listMessages,
  markMessageRead,
} from '../src/messaging/service';

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

describe('Messaging Service', () => {
  let userAId: string;
  let userBId: string;

  beforeEach(async () => {
    await resetDb();
    const app = createApp();
    const a = await registerUser(app, 'Alice', 'alice@test.com');
    const b = await registerUser(app, 'Bob', 'bob@test.com');
    userAId = a.userId;
    userBId = b.userId;
  });

  describe('getOrCreateConversation', () => {
    it('creates and returns a conversation between two users', async () => {
      const conv = await getOrCreateConversation(userAId, userBId);

      expect(typeof conv.id).toBe('string');
      expect(conv.id.length).toBeGreaterThan(0);

      // Canonical ordering: user_a_id < user_b_id (lexicographic)
      const [expectedA, expectedB] = [userAId, userBId].sort();
      expect(conv.user_a_id).toBe(expectedA);
      expect(conv.user_b_id).toBe(expectedB);
      expect(conv.created_at).toBeInstanceOf(Date);
    });

    it('is idempotent — returns the same id when called twice', async () => {
      const first = await getOrCreateConversation(userAId, userBId);
      const second = await getOrCreateConversation(userAId, userBId);

      expect(first.id).toBe(second.id);
    });

    it('returns the same conversation regardless of argument order (canonical ordering)', async () => {
      const forward = await getOrCreateConversation(userAId, userBId);
      const reversed = await getOrCreateConversation(userBId, userAId);

      expect(forward.id).toBe(reversed.id);
    });
  });

  describe('createMessage', () => {
    it('persists and returns a message with correct fields', async () => {
      const conv = await getOrCreateConversation(userAId, userBId);
      const msg = await createMessage(conv.id, userAId, 'Hello Bob!');

      expect(typeof msg.id).toBe('string');
      expect(msg.id.length).toBeGreaterThan(0);
      expect(msg.conversation_id).toBe(conv.id);
      expect(msg.sender_id).toBe(userAId);
      expect(msg.content).toBe('Hello Bob!');
      expect(msg.read_at).toBeNull();
      expect(msg.created_at).toBeInstanceOf(Date);
    });
  });

  describe('listMessages', () => {
    it('returns messages in ascending created_at order', async () => {
      const conv = await getOrCreateConversation(userAId, userBId);
      await createMessage(conv.id, userAId, 'First');
      await createMessage(conv.id, userBId, 'Second');
      await createMessage(conv.id, userAId, 'Third');

      const msgs = await listMessages(conv.id);

      expect(msgs).toHaveLength(3);
      expect(msgs[0].content).toBe('First');
      expect(msgs[1].content).toBe('Second');
      expect(msgs[2].content).toBe('Third');

      // Verify ascending order by timestamp
      for (let i = 1; i < msgs.length; i++) {
        expect(msgs[i].created_at.getTime()).toBeGreaterThanOrEqual(
          msgs[i - 1].created_at.getTime()
        );
      }
    });

    it('respects the limit parameter', async () => {
      const conv = await getOrCreateConversation(userAId, userBId);
      await createMessage(conv.id, userAId, 'First');
      await createMessage(conv.id, userBId, 'Second');

      const msgs = await listMessages(conv.id, 1);

      expect(msgs).toHaveLength(1);
      expect(msgs[0].content).toBe('First');
    });
  });

  describe('markMessageRead', () => {
    it('sets read_at and returns the updated message', async () => {
      const conv = await getOrCreateConversation(userAId, userBId);
      const msg = await createMessage(conv.id, userAId, 'Hello');

      expect(msg.read_at).toBeNull();

      const updated = await markMessageRead(msg.id);

      expect(updated).not.toBeNull();
      expect(updated!.id).toBe(msg.id);
      expect(updated!.read_at).toBeInstanceOf(Date);
    });

    it('returns null when messageId does not exist', async () => {
      const result = await markMessageRead('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });
  });
});
