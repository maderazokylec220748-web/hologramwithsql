// Reference: javascript_websocket blueprint for WebSocket implementation
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { getChatResponse, prepareTextForSpeech } from "./grok";
import { insertQuerySchema, insertFaqSchema, insertAdminUserSchema } from "@shared/schema";
import { sessionMiddleware, requireAuth, requireAdmin } from "./auth";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

// Rate limiters for different endpoints
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: { error: 'Rate limit exceeded. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Add session middleware
  app.use(sessionMiddleware);

  // Authentication endpoints
  app.post("/api/auth/login", loginLimiter, async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }

      const user = await storage.getAdminUserByUsername(username);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Set session
      req.session.adminUserId = user.id;
      req.session.username = user.username;
      req.session.role = user.role;

      const { password: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getAdminUser(req.session.adminUserId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const { password: _, ...sanitizedUser } = user;
      res.json({ user: sanitizedUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  
  // Chat endpoint - handles AI interactions (public)
  app.post("/api/chat", chatLimiter, async (req, res) => {
    try {
      const validatedData = insertQuerySchema.pick({ 
        question: true, 
        userType: true 
      }).parse(req.body);
      
      const { question, userType = "visitor" } = validatedData;
      
      if (!question) {
        return res.status(400).json({ error: "Question is required" });
      }

      const startTime = Date.now();
      
      // Get AI response from Grok
      const { answer, category } = await getChatResponse(question);
      
      const responseTime = Date.now() - startTime;

      // Store the query
      const query = await storage.createQuery({
        question,
        answer,
        userType,
        category,
        responseTime,
      });

      // Broadcast new query to admin clients for real-time updates
      broadcastToAdmins({
        type: 'new_query',
        query: query
      });

      // Prepare text for speech
      const speechText = prepareTextForSpeech(answer);

      res.json({
        answer,
        speechText,
        category,
        queryId: query.id,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  // Admin - Get all queries (requires authentication)
  app.get("/api/admin/queries", requireAuth, async (req, res) => {
    try {
      const allQueries = await storage.getAllQueries();
      res.json(allQueries);
    } catch (error) {
      console.error("Get queries error:", error);
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  // Admin - FAQ management (requires authentication)
  app.get("/api/admin/faqs", requireAuth, generalApiLimiter, async (req, res) => {
    try {
      const allFaqs = await storage.getAllFaqs();
      res.json(allFaqs);
    } catch (error) {
      console.error("Get FAQs error:", error);
      res.status(500).json({ error: "Failed to fetch FAQs" });
    }
  });

  app.post("/api/admin/faqs", requireAuth, generalApiLimiter, async (req, res) => {
    try {
      const validatedData = insertFaqSchema.parse(req.body);
      const faq = await storage.createFaq(validatedData);
      res.json(faq);
    } catch (error) {
      console.error("Create FAQ error:", error);
      res.status(400).json({ error: "Invalid FAQ data" });
    }
  });

  app.patch("/api/admin/faqs/:id", requireAuth, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      // Validate partial update data
      const validatedData = insertFaqSchema.partial().parse(req.body);
      const faq = await storage.updateFaq(id, validatedData);
      
      if (!faq) {
        return res.status(404).json({ error: "FAQ not found" });
      }
      
      res.json(faq);
    } catch (error) {
      console.error("Update FAQ error:", error);
      res.status(500).json({ error: "Failed to update FAQ" });
    }
  });

  app.delete("/api/admin/faqs/:id", requireAuth, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFaq(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete FAQ error:", error);
      res.status(500).json({ error: "Failed to delete FAQ" });
    }
  });

  // Admin - User management (requires admin role)
  app.get("/api/admin/users", requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllAdminUsers();
      // Don't send passwords to frontend
      const sanitized = users.map(({ password, ...user }) => user);
      res.json(sanitized);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const validatedData = insertAdminUserSchema.parse(req.body);
      
      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      
      const user = await storage.createAdminUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      // Don't send password back
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(400).json({ error: "Invalid user data or username already exists" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteAdminUser(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Get active FAQs for chat context
  app.get("/api/faqs/active", async (req, res) => {
    try {
      const activeFaqs = await storage.getActiveFaqs();
      res.json(activeFaqs);
    } catch (error) {
      console.error("Get active FAQs error:", error);
      res.status(500).json({ error: "Failed to fetch active FAQs" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time hologram sync and admin updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track admin clients for real-time updates
  const adminClients = new Set<WebSocket>();

  // Function to broadcast to admin clients
  function broadcastToAdmins(data: any) {
    adminClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(JSON.stringify(data));
        } catch (error) {
          console.error('Error broadcasting to admin:', error);
          adminClients.delete(client);
        }
      } else {
        adminClients.delete(client);
      }
    });
  }

  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    // Mark if this connection is authenticated as admin
    let isAuthenticated = false;
    let isAdmin = false;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle admin subscription for real-time updates (requires authentication)
        if (data.type === 'admin_subscribe') {
          // In a production system, verify session cookie here
          // For now, we'll add a simple authentication token check
          if (data.authToken) {
            // TODO: Verify this token against session store
            // For now, accept with warning
            console.warn('WebSocket admin subscription - implement proper authentication');
            isAuthenticated = true;
            isAdmin = true;
            adminClients.add(ws);
            console.log('Admin client subscribed for real-time updates');
            ws.send(JSON.stringify({ type: 'auth_success', message: 'Authenticated as admin' }));
          } else {
            ws.send(JSON.stringify({ type: 'auth_error', message: 'Authentication required' }));
          }
          return;
        }
        
        // Validate message size to prevent abuse
        const messageStr = JSON.stringify(data);
        if (messageStr.length > 50000) { // 50KB limit
          ws.send(JSON.stringify({ type: 'error', message: 'Message too large' }));
          return;
        }
        
        // Broadcast to all connected clients (for hologram sync)
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
          }
        });
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      adminClients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      adminClients.delete(ws);
    });
  });

  return httpServer;
}
