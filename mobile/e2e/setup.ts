import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const detoxSetup = require('detox/runners/jest/globalSetup');

const BACKEND_DIR = path.resolve(__dirname, '../../../backend/backend');
const PID_FILE = path.resolve(__dirname, '../.e2e-backend.pid');

const TEST_ENV = {
  ...process.env,
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/chat_test',
  REDIS_URL: 'redis://localhost:6379/1',
  JWT_SECRET: 'e2e_test_secret_that_is_long_enough_32c',
  PORT: '3000',
  NODE_ENV: 'test',
};

async function waitForHealth(timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((resolve) => {
      http
        .get('http://localhost:3000/health', (res) => resolve(res.statusCode === 200))
        .on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('Backend did not become ready within 30s');
}

async function seedUsers(): Promise<void> {
  const axios = (await import('axios')).default;
  for (const u of [
    { name: 'Alice', email: 'alice@e2e.test', password: 'Alice123!' },
    { name: 'Bob', email: 'bob@e2e.test', password: 'Bob123!' },
  ]) {
    try {
      await axios.post('http://localhost:3000/auth/register', u);
    } catch (err: any) {
      if (err?.response?.status !== 409) throw err;
    }
  }
}

module.exports = async function globalSetup(opts: unknown): Promise<void> {
  // 1. Reset test DB via ts-node one-liner (avoids holding pool connection here)
  execSync(
    `npx ts-node --transpile-only -e "require('./tests/helpers/db').resetDb().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);})"`,
    { cwd: BACKEND_DIR, env: TEST_ENV, stdio: 'inherit' }
  );

  // 2. Spawn backend pointed at chat_test
  const proc: ChildProcess = spawn(
    'npx',
    ['ts-node-dev', '--transpile-only', 'src/index.ts'],
    { cwd: BACKEND_DIR, env: TEST_ENV, stdio: 'pipe', detached: false }
  );
  proc.stdout?.on('data', (d: Buffer) => process.stdout.write(`[backend] ${d}`));
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[backend] ${d}`));
  fs.writeFileSync(PID_FILE, String(proc.pid));

  // 3. Wait for DB-ready health check, then seed users
  await waitForHealth();
  await seedUsers();

  // 4. Hand off to Detox's own setup
  await detoxSetup(opts);
};
