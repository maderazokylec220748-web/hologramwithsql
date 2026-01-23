// Reference: javascript_websocket blueprint for WebSocket implementation
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { getChatResponse, prepareTextForSpeech } from "./grok";
import { generateSpeech } from "./tts";
import { insertQuerySchema, insertFaqSchema, insertAdminUserSchema, insertProfessorSchema, insertFacilitySchema, insertEventSchema } from "@shared/schema";
import { sessionMiddleware, requireAuth, requireAdmin } from "./auth";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { responseCache } from "./cache";
import { analytics } from "./analytics";

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

  // WebSocket connection handling
  wss.on('connection', (ws, req) => {
    console.log('WebSocket client connected');
    
    let isAuthenticated = false;
    let isAdmin = false;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle admin subscription for real-time updates
        if (data.type === 'admin_subscribe') {
          isAuthenticated = true;
          isAdmin = true;
          adminClients.add(ws);
          console.log('Admin client subscribed for real-time updates');
          ws.send(JSON.stringify({ type: 'subscribed', message: 'Connected to admin updates' }));
          return;
        }
        
        // Validate message size to prevent abuse
        const messageStr = JSON.stringify(data);
        if (messageStr.length > 50000) {
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
      const { question, userType = "visitor", conversationHistory = [], language = "en" } = req.body;
      
      if (!question || typeof question !== 'string') {
        return res.status(400).json({ error: "Question is required" });
      }

      // Check cache first (only for non-conversational queries)
      const cacheKey = `${language}:${question}`;
      const cached = responseCache.get(cacheKey);
      if (cached && conversationHistory.length === 0) {
        console.log(`Cache hit for question: ${question.substring(0, 50)}...`);
        
        // Still save the query even for cached responses
        const query = await storage.createQuery({
          question,
          answer: cached.answer,
          userType,
          category: 'cached',
          responseTime: 0,
        });

        // Track analytics for cached query
        analytics.trackQuery(question, 'cached', userType, 0);
        
        // Check if there's already feedback for this query
        const existingFeedback = await storage.getFeedbackByQueryId(query.id);
        
        return res.json({
          answer: cached.answer,
          speechText: cached.speechText,
          category: 'cached',
          queryId: query.id,
          rating: existingFeedback?.rating || undefined,
          cached: true,
        });
      }

      const startTime = Date.now();
      
      // Get AI response from Grok with conversation history
      const { answer, category } = await getChatResponse(question, conversationHistory, language);
      
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

      // Cache the response only if no conversation history
      if (conversationHistory.length === 0) {
        responseCache.set(cacheKey, answer, speechText);
      }

      // Track analytics
      analytics.trackQuery(question, category, userType, responseTime);

      // Check if there's already feedback for this query
      const existingFeedback = await storage.getFeedbackByQueryId(query.id);

      res.json({
        answer,
        speechText,
        category,
        queryId: query.id,
        rating: existingFeedback?.rating || undefined,
        cached: false,
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to process chat request" });
    }
  });

  // Text-to-Speech endpoint using ElevenLabs AI voice
  app.post("/api/tts", chatLimiter, async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      // Generate speech using ElevenLabs
      const audioBuffer = await generateSpeech(text);
      
      // Set headers for audio streaming
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });
      
      res.send(audioBuffer);
    } catch (error) {
      console.error("TTS error:", error);
      res.status(500).json({ error: "Failed to generate speech" });
    }
  });

  // Feedback endpoint - rate AI responses
  app.post("/api/feedback", generalApiLimiter, async (req, res) => {
    try {
      const { queryId, rating, comment } = req.body;
      
      if (!queryId || !rating) {
        return res.status(400).json({ error: "Query ID and rating are required" });
      }

      if (rating !== 'positive' && rating !== 'negative') {
        return res.status(400).json({ error: "Rating must be 'positive' or 'negative'" });
      }

      // Track analytics
      analytics.trackFeedback(queryId, rating);
      
      // Store feedback (you can add a feedback table later)
      console.log(`Feedback received for query ${queryId}: ${rating}`, comment ? `Comment: ${comment}` : '');
      
      // For now, just acknowledge
      res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
      console.error("Feedback error:", error);
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // Clear chat history for session
  app.delete("/api/chat/clear", generalApiLimiter, (req, res) => {
    try {
      // This is a client-side operation, just acknowledge
      res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
      console.error("Clear chat error:", error);
      res.status(500).json({ error: "Failed to clear chat" });
    }
  });

  // Admin - Get analytics stats
  app.get("/api/admin/analytics", requireAuth, generalApiLimiter, async (req, res) => {
    try {
      // Prevent caching of analytics data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      const { startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : undefined;
      const end = endDate ? new Date(endDate as string) : undefined;
      
      const stats = await analytics.getStats(start, end);
      res.json(stats);
    } catch (error) {
      console.error("Get analytics error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Admin - Get all queries (requires authentication)
  app.get("/api/admin/queries", requireAuth, async (req, res) => {
    try {
      // Prevent caching of query data
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
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
  app.get("/api/admin/users", requireAuth, async (req, res) => {
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

  app.put("/api/admin/users/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Hash password if it's being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const user = await storage.updateAdminUser(id, updateData);
      
      // Don't send password back
      const { password, ...sanitizedUser } = user;
      res.json(sanitizedUser);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(400).json({ error: "Failed to update user" });
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

  // API Configuration Management
  app.get("/api/admin/config", requireAuth, async (req, res) => {
    try {
      // Return current API configuration with actual keys for admin viewing
      const config = {
        grokApiKey: process.env.GROQ_API_KEY || "",
        grokModel: process.env.GROK_MODEL || "llama-3.3-70b-versatile",
        ttsProvider: process.env.TTS_PROVIDER || "elevenlabs",
        ttsApiKey: process.env.ELEVENLABS_API_KEY || "",
      };
      res.json(config);
    } catch (error) {
      console.error("Get config error:", error);
      res.status(500).json({ error: "Failed to fetch configuration" });
    }
  });

  app.post("/api/admin/config", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { grokApiKey, grokModel, ttsProvider, ttsApiKey, password } = req.body;
      
      // Verify password
      if (!password) {
        return res.status(400).json({ error: "Password is required to update configuration" });
      }

      // Get current user and verify password
      const user = await storage.getAdminUser(req.session.adminUserId!);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid password" });
      }
      
      // Update environment variables in memory (won't persist across restarts)
      if (grokApiKey) {
        process.env.GROQ_API_KEY = grokApiKey;
      }
      if (grokModel) {
        process.env.GROK_MODEL = grokModel;
      }
      if (ttsProvider) {
        process.env.TTS_PROVIDER = ttsProvider;
      }
      if (ttsApiKey) {
        process.env.ELEVENLABS_API_KEY = ttsApiKey;
      }
      
      res.json({ 
        success: true,
        message: "Configuration updated successfully. Note: Changes will be lost on server restart. Update .env file for persistence."
      });
    } catch (error) {
      console.error("Update config error:", error);
      res.status(500).json({ error: "Failed to update configuration" });
    }
  });

  // ===== PROFESSORS ROUTES =====
  app.get("/api/admin/professors", requireAdmin, async (req, res) => {
    try {
      const professorsList = await storage.getAllProfessors();
      res.json(professorsList);
    } catch (error) {
      console.error("Get professors error:", error);
      res.status(500).json({ error: "Failed to fetch professors" });
    }
  });

  app.post("/api/admin/professors", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const validatedData = insertProfessorSchema.parse(req.body);
      const professor = await storage.createProfessor(validatedData as any);
      res.json(professor);
    } catch (error: any) {
      console.error("Create professor error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid professor data" });
      }
      res.status(400).json({ error: error.message || "Failed to create professor" });
    }
  });

  app.put("/api/admin/professors/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const professor = await storage.updateProfessor(id, req.body);
      res.json(professor);
    } catch (error) {
      console.error("Update professor error:", error);
      res.status(400).json({ error: "Failed to update professor" });
    }
  });

  app.delete("/api/admin/professors/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteProfessor(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete professor error:", error);
      res.status(500).json({ error: "Failed to delete professor" });
    }
  });

  app.post("/api/admin/professors/bulk-delete", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid request" });
      }
      for (const id of ids) {
        await storage.deleteProfessor(id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Bulk delete professors error:", error);
      res.status(500).json({ error: "Failed to delete professors" });
    }
  });

  // ===== FACILITIES ROUTES =====
  app.get("/api/admin/facilities", requireAdmin, async (req, res) => {
    try {
      const facilitiesList = await storage.getAllFacilities();
      res.json(facilitiesList);
    } catch (error) {
      console.error("Get facilities error:", error);
      res.status(500).json({ error: "Failed to fetch facilities" });
    }
  });

  app.post("/api/admin/facilities", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const validatedData = insertFacilitySchema.parse(req.body);
      const facility = await storage.createFacility(validatedData as any);
      res.json(facility);
    } catch (error: any) {
      console.error("Create facility error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid facility data" });
      }
      res.status(400).json({ error: error.message || "Failed to create facility" });
    }
  });

  app.put("/api/admin/facilities/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const facility = await storage.updateFacility(id, req.body);
      res.json(facility);
    } catch (error) {
      console.error("Update facility error:", error);
      res.status(400).json({ error: "Failed to update facility" });
    }
  });

  app.delete("/api/admin/facilities/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteFacility(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete facility error:", error);
      res.status(500).json({ error: "Failed to delete facility" });
    }
  });

  app.post("/api/admin/facilities/bulk-delete", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid request" });
      }
      for (const id of ids) {
        await storage.deleteFacility(id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Bulk delete facilities error:", error);
      res.status(500).json({ error: "Failed to delete facilities" });
    }
  });

  // ===== EVENTS ROUTES =====
  // Public endpoint - get upcoming/active events for kiosk display
  app.get("/api/events/upcoming", generalApiLimiter, async (req, res) => {
    try {
      const events = await storage.getUpcomingEvents();
      res.json(events);
    } catch (error) {
      console.error("Get upcoming events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Public endpoint - get all active events
  app.get("/api/events/active", generalApiLimiter, async (req, res) => {
    try {
      const events = await storage.getActiveEvents();
      res.json(events);
    } catch (error) {
      console.error("Get active events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Public endpoint - get events by type
  app.get("/api/events/type/:eventType", generalApiLimiter, async (req, res) => {
    try {
      const { eventType } = req.params;
      const events = await storage.getEventsByType(eventType);
      res.json(events);
    } catch (error) {
      console.error("Get events by type error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Admin endpoints for event management
  app.get("/api/admin/events", requireAdmin, async (req, res) => {
    try {
      const eventsList = await storage.getAllEvents();
      res.json(eventsList);
    } catch (error) {
      console.error("Get events error:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/admin/events", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData as any);
      res.json(event);
    } catch (error: any) {
      console.error("Create event error:", error);
      if (error.errors && Array.isArray(error.errors)) {
        return res.status(400).json({ error: error.errors[0]?.message || "Invalid event data" });
      }
      res.status(400).json({ error: error.message || "Failed to create event" });
    }
  });

  app.put("/api/admin/events/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      const body = req.body;
      
      // Only update provided fields
      const dataToUpdate: any = {};
      if (body.title !== undefined) dataToUpdate.title = body.title;
      if (body.description !== undefined) dataToUpdate.description = body.description;
      if (body.eventDate !== undefined) dataToUpdate.eventDate = typeof body.eventDate === 'string' ? new Date(body.eventDate) : body.eventDate;
      if (body.eventEndDate !== undefined) dataToUpdate.eventEndDate = body.eventEndDate ? (typeof body.eventEndDate === 'string' ? new Date(body.eventEndDate) : body.eventEndDate) : null;
      if (body.location !== undefined) dataToUpdate.location = body.location;
      if (body.department !== undefined) dataToUpdate.department = body.department;
      if (body.organizer !== undefined) dataToUpdate.organizer = body.organizer;
      if (body.eventType !== undefined) dataToUpdate.eventType = body.eventType;
      if (body.image !== undefined) dataToUpdate.image = body.image;
      if (body.isActive !== undefined) dataToUpdate.isActive = body.isActive;
      
      const event = await storage.updateEvent(id, dataToUpdate);
      res.json(event);
    } catch (error) {
      console.error("Update event error:", error);
      res.status(400).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/admin/events/:id", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteEvent(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.post("/api/admin/events/bulk-delete", requireAdmin, generalApiLimiter, async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid request" });
      }
      for (const id of ids) {
        await storage.deleteEvent(id);
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Bulk delete events error:", error);
      res.status(500).json({ error: "Failed to delete events" });
    }
  });

  return httpServer;
}
