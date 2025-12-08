#!/usr/bin/env node
// Cleanup script to kill stale node processes before starting dev
const { execSync } = require('child_process');

console.log('🧹 Cleaning up stale node processes...');

try {
  if (process.platform === 'win32') {
    // Windows: Kill only tsx and vite processes, not all node
    execSync('taskkill /F /FI "WINDOWTITLE eq tsx*" 2>nul', { stdio: 'ignore' });
    execSync('taskkill /F /FI "WINDOWTITLE eq vite*" 2>nul', { stdio: 'ignore' });
  } else {
    // Unix-like systems
    execSync(`pkill -f "tsx watch" || true`, { stdio: 'ignore' });
    execSync(`pkill -f vite || true`, { stdio: 'ignore' });
  }
  console.log('✓ Cleanup complete');
} catch (err) {
  // Ignore errors (process might not exist)
}

console.log('Starting fresh...\n');
