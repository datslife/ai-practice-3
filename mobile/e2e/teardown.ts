import fs from 'fs';
import path from 'path';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const detoxTeardown = require('detox/runners/jest/globalTeardown');

const PID_FILE = path.resolve(__dirname, '../.e2e-backend.pid');

module.exports = async function globalTeardown(opts: unknown): Promise<void> {
  await detoxTeardown(opts);
  if (fs.existsSync(PID_FILE)) {
    try {
      process.kill(parseInt(fs.readFileSync(PID_FILE, 'utf8'), 10), 'SIGTERM');
    } catch {
      // Process may have already exited
    }
    fs.unlinkSync(PID_FILE);
  }
};
