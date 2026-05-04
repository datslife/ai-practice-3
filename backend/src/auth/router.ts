import { Router } from 'express';
import { registerUser, loginUser, AuthError } from './service';

export const authRouter = Router();

authRouter.post('/register', async (req, res, next) => {
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

authRouter.post('/login', async (req, res, next) => {
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
