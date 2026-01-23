import { exec } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

// Prepare environment variables
const envVars = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: 'mysql://root:@localhost:3306/hologram',
  ...process.env
};

// Convert environment object to string of commands
const envString = Object.entries(envVars)
  .map(([key, value]) => `$env:${key}="${value}"`)
  .join('; ');

// Commands to run
const clientCmd = `cd "${join(projectRoot, 'client')}" && npx vite`;
const serverCmd = `cd "${projectRoot}" && npx tsx watch server/index.ts`;

// Start both client and server
console.log('Starting development servers...');

const startClient = exec(`${envString}; ${clientCmd}`, { shell: 'powershell.exe' });
startClient.stdout?.pipe(process.stdout);
startClient.stderr?.pipe(process.stderr);

const startServer = exec(`${envString}; ${serverCmd}`, { shell: 'powershell.exe' });
startServer.stdout?.pipe(process.stdout);
startServer.stderr?.pipe(process.stderr);

process.on('SIGINT', () => {
  startClient.kill();
  startServer.kill();
  process.exit();
});