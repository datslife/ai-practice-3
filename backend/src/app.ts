import express from 'express';
import { authRouter } from './auth/router';
import { usersRouter } from './users/router';
import { conversationsRouter } from './conversations/router';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/conversations', conversationsRouter);
  return app;
}
