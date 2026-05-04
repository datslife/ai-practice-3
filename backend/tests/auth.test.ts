import { signToken, verifyToken } from '../src/auth/jwt';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { requireAuth } from '../src/auth/middleware';
import jwt from 'jsonwebtoken';

describe('JWT utilities', () => {
  const payload = { userId: 'abc-123', email: 'alice@test.com' };

  it('signToken returns a non-empty string', () => {
    const token = signToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyToken recovers the original payload', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('verifyToken throws on tampered token', () => {
    expect(() => verifyToken('not.a.valid.token')).toThrow();
  });
});

function makeApp() {
  const app = express();
  app.get('/protected', requireAuth, (req: Request, res: Response) => {
    res.json({ userId: req.user!.userId });
  });
  return app;
}

describe('requireAuth middleware', () => {
  const token = signToken({ userId: 'u1', email: 'a@test.com' });

  it('allows request with valid Bearer token', async () => {
    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.userId).toBe('u1');
  });

  it('rejects request with no Authorization header', async () => {
    const res = await request(makeApp()).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('rejects request with invalid token', async () => {
    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });

  it('rejects request with expired token', async () => {
    const expired = jwt.sign(
      { userId: 'u1', email: 'a@test.com' },
      process.env.JWT_SECRET as string,
      { expiresIn: 0 }
    );
    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});
