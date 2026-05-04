import { signToken, verifyToken } from '../src/auth/jwt';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { requireAuth } from '../src/auth/middleware';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { resetDb } from './helpers/db';

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
      process.env.JWT_SECRET!,
      { expiresIn: -1 }
    );
    const res = await request(makeApp())
      .get('/protected')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Unauthorized');
  });
});

describe('POST /auth/register', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns 201 with token and user on valid input', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.user.email).toBe('alice@test.com');
    expect(res.body.user.name).toBe('Alice');
    expect(typeof res.body.user.id).toBe('string');
  });

  it('returns 400 when email is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', password: 'password123' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('returns 400 when password is too short (< 8 chars)', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('returns 409 on duplicate email', async () => {
    const app = createApp();
    await request(app)
      .post('/auth/register')
      .send({ name: 'Alice', email: 'alice@test.com', password: 'password123' });

    const res = await request(app)
      .post('/auth/register')
      .send({ name: 'Alice2', email: 'alice@test.com', password: 'password456' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Email already registered');
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns 200 with token and user on valid credentials', async () => {
    const app = createApp();
    await request(app)
      .post('/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'password123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body.user.email).toBe('bob@test.com');
    expect(res.body.user.name).toBe('Bob');
    expect(typeof res.body.user.id).toBe('string');
  });

  it('returns 401 on wrong password', async () => {
    const app = createApp();
    await request(app)
      .post('/auth/register')
      .send({ name: 'Bob', email: 'bob@test.com', password: 'password123' });

    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'bob@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  it('returns 401 on unknown email', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });
});
