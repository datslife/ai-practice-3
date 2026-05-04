import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../auth/jwt';
import { setOnline, setOffline } from '../presence/service';
import {
  getOrCreateConversation,
  createMessage,
  markMessageRead,
  getMessageSenderId,
} from '../messaging/service';
import { pool } from '../db/client';

// ---------------------------------------------------------------------------
// userId → socketId mapping for routing messages to specific recipients.
// Single-server map; replace with a Redis-backed adapter for multi-node.
// ---------------------------------------------------------------------------
const userSockets = new Map<string, string>();

// ---------------------------------------------------------------------------
// Fix 3: Typed socket data via Socket.io generics
// ---------------------------------------------------------------------------
interface SocketData {
  userId: string;
}

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyEvents = Record<string, any>;

export function createSocketGateway(httpServer: HttpServer): SocketServer {
  const io = new SocketServer<AnyEvents, AnyEvents, AnyEvents, SocketData>(
    httpServer,
    { cors: { origin: process.env.CORS_ORIGIN ?? '*' } }
  );

  // -------------------------------------------------------------------------
  // Middleware: JWT handshake auth
  // -------------------------------------------------------------------------
  io.use((socket: Socket<AnyEvents, AnyEvents, AnyEvents, SocketData>, next) => {
    const token = socket.handshake.auth.token as string | undefined;

    if (!token) {
      next(new Error('Unauthorized'));
      return;
    }

    try {
      const payload = verifyToken(token);
      socket.data.userId = payload.userId;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  // -------------------------------------------------------------------------
  // Connection handler
  // -------------------------------------------------------------------------
  io.on('connection', (socket: Socket<AnyEvents, AnyEvents, AnyEvents, SocketData>) => {
    // Fix 3: userId is now inferred as string — no cast needed
    const userId: string = socket.data.userId;

    // Register socket for targeted delivery
    userSockets.set(userId, socket.id);

    // Mark user online and broadcast presence
    // Fix 5: structured error logging on presence failures
    setOnline(userId)
      .then(() => {
        io.emit('presence:update', { userId, status: 'online' });
      })
      .catch((err: Error) => {
        console.error('[gateway] presence update failed', { userId, error: err.message });
      });

    // ------------------------------------------------------------------
    // Disconnect
    // ------------------------------------------------------------------
    socket.on('disconnect', () => {
      // Fix 2: only delete if this socket is still the registered one,
      // guarding against a reconnect that already replaced the entry.
      if (userSockets.get(userId) === socket.id) {
        userSockets.delete(userId);

        // Fix 5: structured error logging on presence failures
        setOffline(userId)
          .then(() => {
            io.emit('presence:update', { userId, status: 'offline' });
          })
          .catch((err: Error) => {
            console.error('[gateway] presence offline failed', { userId, error: err.message });
          });
      }
    });

    // ------------------------------------------------------------------
    // Heartbeat — refreshes the presence TTL
    // ------------------------------------------------------------------
    socket.on('heartbeat', () => {
      setOnline(userId).catch((err: Error) => {
        console.error('[gateway] heartbeat presence failed', { userId, error: err.message });
      });
    });

    // ------------------------------------------------------------------
    // message:send
    // ------------------------------------------------------------------
    socket.on(
      'message:send',
      async (data: { tempId: string; recipientId: string; content: string }) => {
        // Fix 1: validate payload at runtime (TypeScript types are erased)
        if (!data?.tempId || !data?.recipientId || !data?.content?.trim()) {
          socket.emit('message:error', { tempId: data?.tempId ?? '', error: 'Invalid payload' });
          return;
        }

        // Prevent self-messaging
        if (data.recipientId === userId) {
          socket.emit('message:error', { tempId: data.tempId, error: 'Cannot send message to yourself' });
          return;
        }

        try {
          // Verify recipient exists
          const { rows: recipientRows } = await pool.query<{ id: string }>(
            'SELECT id FROM users WHERE id = $1',
            [data.recipientId]
          );
          if (recipientRows.length === 0) {
            socket.emit('message:error', { tempId: data.tempId, error: 'Recipient not found' });
            return;
          }

          const conv = await getOrCreateConversation(userId, data.recipientId);
          const msg = await createMessage(conv.id, userId, data.content);

          // Deliver to recipient if online
          const recipientSocketId = userSockets.get(data.recipientId);
          if (recipientSocketId) {
            io.to(recipientSocketId).emit('message:new', {
              id: msg.id,
              senderId: userId,
              content: msg.content,
              createdAt: msg.created_at,
            });
          }

          // Confirm delivery to sender
          socket.emit('message:sent', {
            tempId: data.tempId,
            id: msg.id,
            createdAt: msg.created_at,
          });
        } catch {
          socket.emit('message:error', {
            tempId: data.tempId,
            error: 'Failed to send message',
          });
        }
      }
    );

    // ------------------------------------------------------------------
    // message:read — best-effort read receipt
    // ------------------------------------------------------------------
    socket.on('message:read', async (data: { messageId: string }) => {
      try {
        if (!data?.messageId) return;
        const result = await markMessageRead(data.messageId);
        if (!result) return;

        const senderId = await getMessageSenderId(data.messageId);
        if (!senderId) return;

        // Only allow the recipient (non-sender) to mark as read
        if (senderId === userId) return;

        const senderSocketId = userSockets.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('message:read', {
            messageId: data.messageId,
            readAt: result.read_at,
          });
        }
      } catch {
        // Read receipts are best-effort; silently absorb errors.
      }
    });
  });

  return io;
}
