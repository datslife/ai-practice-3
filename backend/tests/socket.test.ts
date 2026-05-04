import { createServer } from 'http';
import { AddressInfo } from 'net';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { createSocketGateway } from '../src/socket/gateway';
import { resetDb } from './helpers/db';
import { redis } from '../src/redis/client';
import request from 'supertest';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let serverUrl: string;
let httpServer: ReturnType<typeof createServer>;
const clientSockets: ClientSocket[] = [];

function makeToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '1h' }
  );
}

function makeExpiredToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: -1 }
  );
}

/**
 * Connect a socket.io client and return it once the 'connect' event fires.
 * Registers the socket in clientSockets for cleanup.
 */
function connectClient(token?: string): Promise<ClientSocket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(serverUrl, {
      auth: token ? { token } : {},
      // Use polling to avoid flakiness in test environment
      transports: ['polling'],
      reconnection: false,
    });
    clientSockets.push(socket);

    socket.once('connect', () => resolve(socket));
    socket.once('connect_error', (err) => reject(err));
  });
}

async function registerUser(
  name: string,
  email: string,
  password = 'password123'
): Promise<{ token: string; userId: string }> {
  const app = createApp();
  const res = await request(app)
    .post('/auth/register')
    .send({ name, email, password });
  return { token: res.body.token, userId: res.body.user.id };
}

// ---------------------------------------------------------------------------
// Server lifecycle
// ---------------------------------------------------------------------------

beforeAll((done) => {
  const app = createApp();
  httpServer = createServer(app);
  createSocketGateway(httpServer);
  httpServer.listen(0, () => {
    const { port } = httpServer.address() as AddressInfo;
    serverUrl = `http://localhost:${port}`;
    done();
  });
});

afterAll((done) => {
  // Disconnect all lingering clients first
  for (const s of clientSockets) {
    if (s.connected) s.disconnect();
  }
  httpServer.close(done);
});

beforeEach(async () => {
  await resetDb();
  await redis.flushdb();
  // Disconnect any sockets from previous tests
  for (const s of clientSockets) {
    if (s.connected) s.disconnect();
  }
  clientSockets.length = 0;
});

// ---------------------------------------------------------------------------
// 1. Authentication — reject missing token
// ---------------------------------------------------------------------------

describe('Socket authentication', () => {
  it('rejects connection with no token', async () => {
    await expect(connectClient()).rejects.toThrow();
  });

  it('rejects connection with an invalid token', async () => {
    await expect(connectClient('this.is.not.valid')).rejects.toThrow();
  });

  it('rejects connection with an expired token', async () => {
    const expired = makeExpiredToken('user-expired', 'expired@test.com');
    await expect(connectClient(expired)).rejects.toThrow();
  });

  it('accepts connection with a valid token', async () => {
    const token = makeToken('user-valid', 'valid@test.com');
    const socket = await connectClient(token);
    expect(socket.connected).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 2. Presence — online/offline broadcasts
// ---------------------------------------------------------------------------

describe('Presence events', () => {
  it('broadcasts presence:update { status: "online" } to all clients on connect', async () => {
    // observer connects first
    const observerToken = makeToken('observer-1', 'observer1@test.com');
    const observer = await connectClient(observerToken);

    const presencePromise = new Promise<{ userId: string; status: string }>(
      (resolve) => {
        observer.once('presence:update', resolve);
      }
    );

    // newcomer connects — should trigger broadcast
    const newToken = makeToken('newcomer-1', 'newcomer1@test.com');
    await connectClient(newToken);

    const event = await presencePromise;
    expect(event.userId).toBe('newcomer-1');
    expect(event.status).toBe('online');
  });

  it('broadcasts presence:update { status: "offline" } to all clients on disconnect', async () => {
    const observerToken = makeToken('observer-2', 'observer2@test.com');
    const observer = await connectClient(observerToken);

    const peerToken = makeToken('peer-1', 'peer1@test.com');
    const peer = await connectClient(peerToken);

    // Wait for the online broadcast to fire and be consumed before listening
    // for offline, otherwise the observer might catch the wrong event.
    await new Promise<void>((resolve) => {
      // Give the server a moment to process online event
      setTimeout(resolve, 50);
    });

    const offlinePromise = new Promise<{ userId: string; status: string }>(
      (resolve) => {
        observer.on('presence:update', (data) => {
          if (data.status === 'offline') resolve(data);
        });
      }
    );

    peer.disconnect();

    const event = await offlinePromise;
    expect(event.userId).toBe('peer-1');
    expect(event.status).toBe('offline');
  });
});

// ---------------------------------------------------------------------------
// 3. message:send — delivery to sender + online recipient
// ---------------------------------------------------------------------------

describe('message:send', () => {
  it('sender receives message:sent and online recipient receives message:new', async () => {
    const { userId: senderDbId } = await registerUser('Sender', 'sender@test.com');
    const { userId: recipientDbId } = await registerUser(
      'Recipient',
      'recipient@test.com'
    );

    // Override userId in token to match the DB-registered user ids
    const senderToken = jwt.sign(
      { userId: senderDbId, email: 'sender@test.com' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
    const recipientToken = jwt.sign(
      { userId: recipientDbId, email: 'recipient@test.com' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const sender = await connectClient(senderToken);
    const recipient = await connectClient(recipientToken);

    const tempId = 'temp-123';
    const content = 'Hello there!';

    const sentPromise = new Promise<{ tempId: string; id: string; createdAt: unknown }>(
      (resolve) => {
        sender.once('message:sent', resolve);
      }
    );
    const newPromise = new Promise<{
      id: string;
      senderId: string;
      content: string;
      createdAt: unknown;
    }>((resolve) => {
      recipient.once('message:new', resolve);
    });

    sender.emit('message:send', {
      tempId,
      recipientId: recipientDbId,
      content,
    });

    const [sentEvent, newEvent] = await Promise.all([sentPromise, newPromise]);

    expect(sentEvent.tempId).toBe(tempId);
    expect(typeof sentEvent.id).toBe('string');
    expect(sentEvent.createdAt).toBeTruthy();

    expect(newEvent.senderId).toBe(senderDbId);
    expect(newEvent.content).toBe(content);
    expect(typeof newEvent.id).toBe('string');
  });

  it('sender still receives message:sent when recipient is offline (message persisted)', async () => {
    const { userId: senderDbId } = await registerUser('Sender2', 'sender2@test.com');
    const { userId: recipientDbId } = await registerUser(
      'Recipient2',
      'recipient2@test.com'
    );

    const senderToken = jwt.sign(
      { userId: senderDbId, email: 'sender2@test.com' },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    const sender = await connectClient(senderToken);
    // Recipient is deliberately never connected

    const tempId = 'temp-offline-456';

    const sentPromise = new Promise<{ tempId: string; id: string; createdAt: unknown }>(
      (resolve) => {
        sender.once('message:sent', resolve);
      }
    );

    sender.emit('message:send', {
      tempId,
      recipientId: recipientDbId,
      content: 'Are you there?',
    });

    const sentEvent = await sentPromise;

    expect(sentEvent.tempId).toBe(tempId);
    expect(typeof sentEvent.id).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// 4. heartbeat — refreshes Redis TTL
// ---------------------------------------------------------------------------

describe('heartbeat', () => {
  it('calling heartbeat refreshes the presence TTL in Redis', async () => {
    const token = makeToken('heartbeat-user', 'heartbeat@test.com');
    const socket = await connectClient(token);

    // Allow the connect handler to finish setting the key
    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    // Manually expire the key to a low TTL
    await redis.expire('presence:heartbeat-user', 5);

    const ttlBefore = await redis.ttl('presence:heartbeat-user');
    expect(ttlBefore).toBeGreaterThan(0);
    expect(ttlBefore).toBeLessThanOrEqual(5);

    socket.emit('heartbeat');

    // Wait for the server to process the event
    await new Promise<void>((resolve) => setTimeout(resolve, 100));

    const ttlAfter = await redis.ttl('presence:heartbeat-user');
    expect(ttlAfter).toBeGreaterThan(ttlBefore);
  });
});
