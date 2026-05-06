import { spawn, execSync } from 'child_process';
import type { ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';
import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const detoxSetup = require('detox/runners/jest/globalSetup');

const MOBILE_DIR   = path.resolve(__dirname, '..');
const BACKEND_DIR  = path.resolve(__dirname, '../../../backend/backend');
const BACKEND_PID  = path.resolve(__dirname, '../.e2e-backend.pid');
const METRO_PID    = path.resolve(__dirname, '../.e2e-metro.pid');

const TEST_ENV = {
  ...process.env,
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/chat_test',
  REDIS_URL:    'redis://localhost:6379/1',
  JWT_SECRET:   'e2e_test_secret_that_is_long_enough_32c',
  PORT:         '3000',
  NODE_ENV:     'test',
};

async function waitForUrl(url: string, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const ok = await new Promise<boolean>((resolve) => {
      http.get(url, (res) => resolve(res.statusCode! < 500))
          .on('error', () => resolve(false));
    });
    if (ok) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function seedUsers(): Promise<void> {
  const axios = (await import('axios')).default;
  for (const u of [
    { name: 'Alice', email: 'alice@e2e.test', password: 'Alice123!' },
    { name: 'Bob',   email: 'bob@e2e.test',   password: 'Bob12345!' },
  ]) {
    try {
      await axios.post('http://localhost:3000/auth/register', u);
    } catch (err: any) {
      if (err?.response?.status !== 409) throw err;
    }
  }
}

function spawnAndSave(cmd: string, args: string[], opts: object, pidFile: string): ChildProcess {
  const proc = spawn(cmd, args, opts as any);
  fs.writeFileSync(pidFile, String(proc.pid));
  return proc;
}

module.exports = async function globalSetup(opts: unknown): Promise<void> {
  // 1. Reset test DB
  execSync(
    `npx ts-node --transpile-only -e "require('./tests/helpers/db').resetDb().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1);})"`,
    { cwd: BACKEND_DIR, env: TEST_ENV, stdio: 'inherit' }
  );

  // 2. Kill stale processes on ports 3000 and 8081
  for (const port of [3000, 8081]) {
    try { execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'ignore' }); } catch {}
  }
  await new Promise((r) => setTimeout(r, 600));

  // 3. Spawn backend
  const backend = spawnAndSave(
    'npx', ['ts-node-dev', '--transpile-only', 'src/index.ts'],
    { cwd: BACKEND_DIR, env: TEST_ENV, stdio: 'pipe', detached: false },
    BACKEND_PID
  );
  backend.stdout?.on('data', (d: Buffer) => process.stdout.write(`[backend] ${d}`));
  backend.stderr?.on('data', (d: Buffer) => process.stderr.write(`[backend] ${d}`));

  // 4. Spawn Metro bundler (required by Debug builds to serve the JS bundle)
  //    Override NODE_ENV to avoid Metro detecting "test" env and crashing
  const metro = spawnAndSave(
    'npx', ['react-native', 'start', '--port', '8081', '--reset-cache'],
    { cwd: MOBILE_DIR, env: { ...process.env, NODE_ENV: 'development' }, stdio: 'pipe', detached: false },
    METRO_PID
  );
  metro.stdout?.on('data', (d: Buffer) => process.stdout.write(`[metro] ${d}`));
  metro.stderr?.on('data', (d: Buffer) => process.stderr.write(`[metro] ${d}`));

  // 5. Wait for both services
  await Promise.all([
    waitForUrl('http://localhost:3000/health', 30_000),
    waitForUrl('http://localhost:8081/status', 60_000),
  ]);

  // 6. Seed test users
  await seedUsers();

  // 7. Hand off to Detox
  await detoxSetup(opts);
};
