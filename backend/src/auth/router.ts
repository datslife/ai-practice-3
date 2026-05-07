import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, AuthError } from './service';
import { requireAuth } from './middleware';
import { pool } from '../db/client';

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});

authRouter.post('/register', authLimiter, async (req, res, next) => {
  const { name, email, password } = req.body ?? {};
  if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  try {
    const result = await registerUser(name, email, password);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

authRouter.get('/me', requireAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query<{ id: string; email: string; name: string }>(
      'SELECT id, email, name FROM users WHERE id = $1',
      [req.user!.userId]
    );
    if (!rows[0]) { res.status(401).json({ error: 'User not found' }); return; }
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
});

authRouter.post('/login', authLimiter, async (req, res, next) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }
  try {
    const result = await loginUser(email, password);
    res.status(200).json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});
