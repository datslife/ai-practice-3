import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    req.user = verifyToken(auth.slice(7));
    next();
  } catch (err) {
    if (err instanceof Error && err.message === 'JWT_SECRET not set') {
      next(err);
      return;
    }
    res.status(401).json({ error: 'Unauthorized' });
  }
}
