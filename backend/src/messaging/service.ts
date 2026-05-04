import { v4 as uuid } from 'uuid';
import { pool } from '../db/client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: Date;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: Date | null;
  created_at: Date;
}

interface MessageListItem {
  id: string;
  sender_id: string;
  content: string;
  read_at: Date | null;
  created_at: Date;
}

interface MessageReadResult {
  id: string;
  read_at: Date;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Get existing conversation between two users, or create one.
 * Canonical order: userA < userB (lexicographic) to satisfy the DB CHECK constraint.
 */
export async function getOrCreateConversation(
  userAId: string,
  userBId: string
): Promise<Conversation> {
  const [a, b] = [userAId, userBId].sort();
  const id = uuid();

  // Attempt to insert; if the pair already exists, the ON CONFLICT clause
  // forces a no-op UPDATE so RETURNING still yields the existing row.
  const result = await pool.query<Conversation>(
    `INSERT INTO conversations (id, user_a_id, user_b_id)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_a_id, user_b_id)
       DO UPDATE SET id = conversations.id
     RETURNING id, user_a_id, user_b_id, created_at`,
    [id, a, b]
  );

  return result.rows[0];
}

/**
 * Persist a new message in a conversation.
 */
export async function createMessage(
  conversationId: string,
  senderId: string,
  content: string
): Promise<{ id: string; conversation_id: string; sender_id: string; content: string; read_at: null; created_at: Date }> {
  const id = uuid();

  const result = await pool.query<{ id: string; conversation_id: string; sender_id: string; content: string; read_at: null; created_at: Date }>(
    `INSERT INTO messages (id, conversation_id, sender_id, content)
     VALUES ($1, $2, $3, $4)
     RETURNING id, conversation_id, sender_id, content, read_at, created_at`,
    [id, conversationId, senderId, content]
  );

  return result.rows[0];
}

/**
 * Mark a message as read. Only marks if the message exists and read_at is currently NULL.
 * Returns the updated message, or null if not found OR if already read.
 */
export async function markMessageRead(
  messageId: string
): Promise<MessageReadResult | null> {
  const result = await pool.query<MessageReadResult>(
    `UPDATE messages
     SET read_at = NOW()
     WHERE id = $1 AND read_at IS NULL
     RETURNING id, read_at`,
    [messageId]
  );

  return result.rows[0] ?? null;
}

/**
 * Look up the sender of a given message.
 * Returns null if the message does not exist.
 */
export async function getMessageSenderId(messageId: string): Promise<string | null> {
  const { rows } = await pool.query<{ sender_id: string }>(
    'SELECT sender_id FROM messages WHERE id = $1',
    [messageId]
  );
  return rows[0]?.sender_id ?? null;
}

/**
 * Paginated message history for a conversation.
 * Returns messages in ascending order (oldest first).
 * limit defaults to 50, offset defaults to 0.
 */
export async function listMessages(
  conversationId: string,
  limit = 50,
  offset = 0
): Promise<MessageListItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, 100));
  const safeOffset = Math.max(0, offset);
  const result = await pool.query<MessageListItem>(
    `SELECT id, sender_id, content, read_at, created_at
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2 OFFSET $3`,
    [conversationId, safeLimit, safeOffset]
  );

  return result.rows;
}
