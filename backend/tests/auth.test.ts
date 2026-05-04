import { signToken, verifyToken } from '../src/auth/jwt';

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
