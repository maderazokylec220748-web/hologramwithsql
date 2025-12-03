const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const root = path.resolve(__dirname, '..');
let serverProc = null;
let clientProc = null;

function startServer() {
  console.log('Starting server (npx tsx watch server/index.ts)');
  serverProc = spawn('npx', ['tsx', 'watch', 'server/index.ts'], { cwd: root, shell: true, stdio: 'inherit' });
  serverProc.on('exit', (code) => { console.log('Server process exited with code', code); });
}

function startClient() {
  console.log('Starting client (npm run dev in client/)');
  clientProc = spawn('npm', ['run', 'dev'], { cwd: path.join(root, 'client'), shell: true, stdio: 'inherit' });
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
  const iconPath = path.join(__dirname, '..', 'build', 'icon.ico');
  console.log('Loading icon from:', iconPath);
  console.log('Icon exists:', require('fs').existsSync(iconPath));
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    fullscreen: true,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      cache: false, // Disable cache in development
    },
  });
  win.removeMenu();
  
  // Clear cache before loading
  win.webContents.session.clearCache();
  
  win.loadURL('http://localhost:5173');
  
  // Handle window.open() for /hologram route
  win.webContents.setWindowOpenHandler(({ url }) => {
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

  // Development mode: start server and client if not already running and open dev URL
  // Start server if not already running
  const serverUp = await isUrlUp('http://localhost:3000/');
  if (!serverUp) {
    startServer();
  } else {
    console.log('Server already running on http://localhost:3000 — skipping start');
  }

  // Start client only if Vite isn't already serving on 5173
  const clientUp = await isUrlUp('http://localhost:5173/');
  if (!clientUp) {
    startClient();
  } else {
    console.log('Client already running on http://localhost:5173 — skipping start');
  }

  try {
    await waitForUrl('http://localhost:5173/');
    console.log('Client is up — opening desktop window');
    createWindow();
  } catch (err) {
    console.error('Error waiting for client to start:', err);
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function cleanup() {
  if (serverProc) {
    try { serverProc.kill(); } catch (_) {}
  }
  if (clientProc) {
    try { clientProc.kill(); } catch (_) {}
  }
}

app.on('before-quit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(); });
process.on('exit', cleanup);
