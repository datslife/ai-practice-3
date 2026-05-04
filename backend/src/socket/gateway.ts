import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import { verifyToken } from '../auth/jwt';
import { pool } from '../db/client';
import { setOnline, setOffline } from '../presence/service';
import {
  getOrCreateConversation,
  createMessage,
  markMessageRead,
} from '../messaging/service';

// ---------------------------------------------------------------------------
// userId → socketId mapping for routing messages to specific recipients.
// Single-server map; replace with a Redis-backed adapter for multi-node.
// ---------------------------------------------------------------------------
const userSockets = new Map<string, string>();

// ---------------------------------------------------------------------------
// Public factory
// ---------------------------------------------------------------------------

export function createSocketGateway(httpServer: HttpServer): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: { origin: '*' },
  });

  // -------------------------------------------------------------------------
  // Middleware: JWT handshake auth
  // -------------------------------------------------------------------------
  io.use((socket: Socket, next) => {
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
  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId as string;

    // Register socket for targeted delivery
    userSockets.set(userId, socket.id);

    // Mark user online and broadcast presence
    setOnline(userId)
      .then(() => {
        io.emit('presence:update', { userId, status: 'online' });
      })
      .catch(() => null);

    // ------------------------------------------------------------------
    // Disconnect
    // ------------------------------------------------------------------
    socket.on('disconnect', () => {
      userSockets.delete(userId);

      setOffline(userId)
        .then(() => {
          io.emit('presence:update', { userId, status: 'offline' });
        })
        .catch(() => null);
    });

    // ------------------------------------------------------------------
    // Heartbeat — refreshes the presence TTL
    // ------------------------------------------------------------------
    socket.on('heartbeat', () => {
      setOnline(userId).catch(() => null);
    });

    // ------------------------------------------------------------------
    // message:send
    // ------------------------------------------------------------------
    socket.on(
      'message:send',
      async (data: { tempId: string; recipientId: string; content: string }) => {
        try {
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
        const result = await markMessageRead(data.messageId);
        if (!result) return;

        // Look up the original sender to route the receipt
        const { rows } = await pool.query<{ sender_id: string }>(
          'SELECT sender_id FROM messages WHERE id = $1',
          [data.messageId]
        );

        if (rows.length === 0) return;

        const senderSocketId = userSockets.get(rows[0].sender_id);
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
