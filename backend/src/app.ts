import express from 'express';
import { authRouter } from './auth/router';

export function createApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  return app;
}
