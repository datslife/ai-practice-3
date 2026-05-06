export interface User {
  id: string;
  email: string;
  name: string;
  created_at: string;
  status?: 'online' | 'offline';
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  tempId?: string;
  status?: 'pending' | 'sent' | 'failed';
}

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline';
}

export interface MessageNew {
  id: string;
  senderId: string;
  content: string;
  conversationId?: string;
  createdAt: string;
}

export interface MessageSent {
  tempId: string;
  id: string;
  conversationId?: string;
  createdAt: string;
}

export interface MessageError {
  tempId: string;
  error: string;
}

export interface MessageReadAck {
  messageId: string;
  readAt: string;
}
