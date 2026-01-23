#!/usr/bin/env node
// Cross-platform dev launcher: loads .env then runs server and client concurrently
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const concurrently = require('concurrently');

// Load .env if present
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log('Loaded .env');
}

// Ensure NODE_ENV is development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Commands to run
const serverCmd = 'npx tsx watch server/index.ts';
const clientCmd = 'cd client && npm run dev';

console.log('Starting dev servers (server + client) using concurrently');
(async () => {
  try {
    await concurrently([
      { command: serverCmd, name: 'server', prefixColor: 'blue' },
      { command: clientCmd, name: 'client', prefixColor: 'green' }
    ], {
      killOthers: ['failure', 'success'],
      restartTries: 0,
      timestampFormat: 'HH:mm:ss'
    });
    console.log('concurrently processes exited');
  } catch (err) {
    console.error('concurrently error', err);
    process.exit(1);
  }
})();
