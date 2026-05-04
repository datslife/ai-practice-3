export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: Date | null;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
