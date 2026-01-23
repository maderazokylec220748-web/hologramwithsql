import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log as viteLog } from "./vite";
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { scheduleCleanup } from './cleanup';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();

// Trust proxy for Nginx reverse proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// HTTPS enforcement for production
// HTTPS redirect disabled - enable after SSL certificate is configured
// if (process.env.NODE_ENV === 'production') {
//   app.use((req, res, next) => {
//     // Check if request is coming through a proxy (like nginx, cloudflare)
//     const forwardedProto = req.header('x-forwarded-proto');
//     
//     if (forwardedProto && forwardedProto !== 'https') {
//       return res.redirect(301, `https://${req.header('host')}${req.url}`);
//     }
//     
//     // Force HTTPS
//     if (!req.secure && !req.header('x-forwarded-proto')) {
//       return res.redirect(301, `https://${req.header('host')}${req.url}`);
//     }
//     
//     // Add HSTS header (HTTP Strict Transport Security)
//     res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
//     
//     next();
//   });
// }

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development with Vite
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? (process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']) 
    : ['http://localhost:3000', 'http://localhost:5001', 'http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(cookieParser());

// CSRF Protection (only for state-changing operations)
// Skip CSRF for API endpoints that use session authentication
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
});

// Apply CSRF to routes that need it (we'll add this selectively in routes)
app.get('/api/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      viteLog(logLine);
    }
  });

  next();
});

(async () => {
  const httpServer = createServer(app);
  
  // Create WebSocket server
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        // Handle incoming messages
        console.log('Received:', data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5001 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5001', 10);
  server.listen(port, () => {
    viteLog(`serving on port ${port}`);
    
    // Schedule daily cleanup of old chat logs
    scheduleCleanup();
    viteLog('Scheduled daily cleanup of old data (privacy protection)');
  });
})();
