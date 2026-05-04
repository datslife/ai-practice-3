import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { pool } from '../db/client';
import { signToken } from './jwt';

export class AuthError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AuthError(400, 'Name is required');
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new AuthError(400, 'Valid email is required');
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    throw new AuthError(400, 'Password must be at least 8 characters');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuid();

  try {
    const result = await pool.query<{ id: string; email: string; name: string }>(
      'INSERT INTO users (id, email, name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
      [id, email.toLowerCase(), name, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    return { token, user };
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === '23505'
    ) {
      throw new AuthError(409, 'Email already registered');
    }
    throw err;
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
  if (!email || typeof email !== 'string') throw new AuthError(400, 'Email is required');
  if (!password || typeof password !== 'string') throw new AuthError(400, 'Password is required');

  const result = await pool.query<{
    id: string;
    email: string;
    name: string;
    password_hash: string;
  }>(
    'SELECT id, email, name, password_hash FROM users WHERE email = $1',
    [email.toLowerCase()]
  );

  const row = result.rows[0];
  if (!row) {
    throw new AuthError(401, 'Invalid credentials');
  }

  const match = await bcrypt.compare(password, row.password_hash);
  if (!match) {
    throw new AuthError(401, 'Invalid credentials');
  }

  const user = { id: row.id, email: row.email, name: row.name };
  const token = signToken({ userId: user.id, email: user.email });

  return { token, user };
}
