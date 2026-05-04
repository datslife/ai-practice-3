import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

function secret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, secret(), { expiresIn: '7d' });
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, secret());
  if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
    throw new Error('Invalid token payload');
  }
  return decoded as JwtPayload;
}
