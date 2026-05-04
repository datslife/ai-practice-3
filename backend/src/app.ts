import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authRouter } from './auth/router';
import { usersRouter } from './users/router';
import { conversationsRouter } from './conversations/router';

export function createApp(): express.Application {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/conversations', conversationsRouter);

  // Global error handler — must be four-argument to be recognised by Express
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[express] unhandled error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
