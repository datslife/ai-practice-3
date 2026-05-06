import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const detoxTeardown = require('detox/runners/jest/globalTeardown');

const PID_FILES = [
  path.resolve(__dirname, '../.e2e-backend.pid'),
  path.resolve(__dirname, '../.e2e-metro.pid'),
];

function killPid(pidFile: string): void {
  if (!fs.existsSync(pidFile)) return;
  try { process.kill(parseInt(fs.readFileSync(pidFile, 'utf8'), 10), 'SIGTERM'); } catch {}
  fs.unlinkSync(pidFile);
}

module.exports = async function globalTeardown(opts: unknown): Promise<void> {
  await detoxTeardown(opts);
  for (const f of PID_FILES) killPid(f);
};
