const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const root = path.resolve(__dirname, '..');
let serverProc = null;
let clientProc = null;
let mainWindow = null;

// Single instance lock - prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit this one
  app.quit();
} else {
  // This is the first instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

function startServer() {
  console.log('Starting server (npx tsx watch server/index.ts)');
  serverProc = spawn('npx', ['tsx', 'watch', 'server/index.ts'], { 
    cwd: root, 
    shell: true, 
    stdio: 'ignore',
    windowsHide: true
  });
  serverProc.on('exit', (code) => { console.log('Server process exited with code', code); });
}

function startClient() {
  console.log('Starting client (npm run dev in client/)');
  clientProc = spawn('npm', ['run', 'dev'], { 
    cwd: path.join(root, 'client'), 
    shell: true, 
    stdio: 'ignore',
    windowsHide: true
  });
  clientProc.on('exit', (code) => { console.log('Client process exited with code', code); });
}

function isUrlUp(url, timeout = 1500) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(timeout, () => { try { req.abort(); } catch (_) {} resolve(false); });
  });
}

function waitForUrl(url, timeout = 120000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    (function check() {
      const req = http.get(url, (res) => {
        // success when we get any response
        res.resume();
        resolve();
      });

      req.on('error', () => {
        if (Date.now() - start > timeout) return reject(new Error('timeout'));
        setTimeout(check, 300);
      });

      req.setTimeout(2000, () => {
        req.abort();
      });
    })();
  });
}

let hologramWindow = null;

function createWindow() {
  // If window already exists, just focus it
  if (mainWindow) {
    mainWindow.focus();
    return;
  }

  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  console.log('Loading icon from:', iconPath);
  console.log('Icon exists:', require('fs').existsSync(iconPath));
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    icon: iconPath,
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      cache: false,
      partition: 'persist:nocache', // Use a separate session that we can clear
    },
  });
  mainWindow.removeMenu();
  
  // Completely disable all caching in Electron
  const session = mainWindow.webContents.session;
  
  // Clear all existing cache immediately
  session.clearCache().then(() => {
    console.log('Electron cache cleared');
  });
  
  // Disable cache for API requests only (don't interfere with WebSocket)
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    // Don't modify WebSocket upgrade requests
    if (details.resourceType !== 'webSocket') {
      details.requestHeaders['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      details.requestHeaders['Pragma'] = 'no-cache';
      details.requestHeaders['Expires'] = '0';
    }
    callback({ requestHeaders: details.requestHeaders });
  });
  
  // Override response headers to prevent caching (but not for WebSocket)
  session.webRequest.onHeadersReceived((details, callback) => {
    // Don't modify WebSocket responses
    if (details.resourceType !== 'webSocket') {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Cache-Control': ['no-cache, no-store, must-revalidate'],
          'Pragma': ['no-cache'],
          'Expires': ['0']
        }
      });
    } else {
      callback({ responseHeaders: details.responseHeaders });
    }
  });
  
  // Wait for both servers to be ready
  console.log('Waiting for servers to start...');
  
  Promise.all([
    waitForUrl('http://localhost:5001', 120000),
    waitForUrl('http://localhost:3000', 120000)
  ])
    .then(() => {
      console.log('Both servers are ready, loading main app');
      mainWindow.loadURL('http://localhost:3000');
      mainWindow.show();
    })
    .catch((err) => {
      console.error('Failed to start servers:', err);
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <html>
          <body style="background:#1e293b;color:white;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h1>⚠️ Failed to Start</h1>
              <p>Could not connect to the servers.</p>
              <p style="font-size:14px;opacity:0.7;">Make sure ports 3000 and 5001 are free.</p>
              <p style="font-size:14px;opacity:0.7;">Close this window and try again.</p>
            </div>
          </body>
        </html>
      `));
      mainWindow.show();
    });
  
  // Clear mainWindow reference when closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
  
  // Handle window.open() for /hologram route
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Window open request for:', url);
    
    if (url.includes('/hologram')) {
      // If hologram window already exists, focus it instead of creating new one
      if (hologramWindow && !hologramWindow.isDestroyed()) {
        hologramWindow.focus();
        return { action: 'deny' };
      }
      
      // Create a new window for hologram display
      hologramWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: true,
        icon: iconPath,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
        },
      });
      hologramWindow.removeMenu();
      hologramWindow.loadURL(url);
      
      // Clear reference when window is closed
      hologramWindow.on('closed', () => {
        hologramWindow = null;
      });
      
      return { action: 'deny' }; // Prevent default behavior
    }
    
    return { action: 'allow' };
  });
}

app.on('ready', async () => {
  // If the app is packaged (production), spawn the built server and load static client files
  if (app.isPackaged) {
    try {
      // Start the built server by spawning node with the built entry point
      const appPath = app.getAppPath();
      const serverEntry = path.join(appPath, 'dist', 'index.js');
      console.log('Production mode: starting server from', serverEntry);
      
      serverProc = spawn('node', [serverEntry], { 
        cwd: appPath, 
        stdio: 'inherit',
        env: { ...process.env, NODE_ENV: 'production', PORT: '3000' }
      });
      
      serverProc.on('error', (err) => {
        console.error('Failed to start packaged server:', err);
      });

      // Wait for server to be ready
      await waitForUrl('http://localhost:3000/');
    } catch (err) {
      console.error('Error starting packaged server:', err);
    }

    // Load the built client index.html
    const clientIndex = path.join(app.getAppPath(), 'client', 'dist', 'index.html');
    console.log('Production mode: loading client from', clientIndex);
    const win = new BrowserWindow({
      width: 1200,
      height: 800,
      icon: path.join(app.getAppPath(), 'build', 'icon.ico'),
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    win.removeMenu();
    win.loadFile(clientIndex).catch((e) => {
      console.error('Failed to load local index.html:', e);
    });
    return;
  }

  // Development mode: Check if servers are already running
  const serverUp = await isUrlUp('http://localhost:5001/');
  const clientUp = await isUrlUp('http://localhost:3000/');
  
  if (serverUp && clientUp) {
    console.log('Server already running on http://localhost:5001');
    console.log('Client already running on http://localhost:3000');
    console.log('Opening desktop window immediately');
    createWindow();
  } else {
    console.log('⚠️  Dev servers not running!');
    console.log('Please start the dev servers first:');
    console.log('  1. Open terminal in project folder');
    console.log('  2. Run: node scripts/dev.cjs');
    console.log('  3. Wait for servers to start');
    console.log('  4. Then launch this app');
    
    // Try to open window anyway (will show error if servers aren't ready)
    setTimeout(() => {
      createWindow();
    }, 2000);
  }
});

app.on('window-all-closed', () => {
  // Kill all Node.js processes when app closes
  cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function cleanup() {
  console.log('Cleaning up processes...');
  
  // Kill spawned processes
  if (serverProc) {
    try { 
      serverProc.kill(); 
      console.log('Server process killed');
    } catch (_) {}
  }
  if (clientProc) {
    try { 
      clientProc.kill(); 
      console.log('Client process killed');
    } catch (_) {}
  }
  
  // Kill all Node.js processes on Windows (force cleanup)
  if (process.platform === 'win32') {
    try {
      const { execSync } = require('child_process');
      execSync('taskkill /F /IM node.exe /T', { stdio: 'ignore' });
      console.log('All Node.js processes terminated');
    } catch (error) {
      // Ignore errors if no processes to kill
    }
  }
}

app.on('before-quit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('exit', cleanup);
