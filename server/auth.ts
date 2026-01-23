import { Request, Response, NextFunction } from "express";
import session from "express-session";
import MySQLStore from "express-mysql-session";

const MySQLStoreConstructor = MySQLStore(session);

// Session configuration
export const sessionMiddleware = session({
  store: new MySQLStoreConstructor({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'hologram',
  }),
  secret: process.env.SESSION_SECRET || "westmead-hologram-secret-key-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // HTTPS enabled
  },
});

// Extend Express session types
declare module "express-session" {
  interface SessionData {
    adminUserId: string;
    username: string;
    role: string;
  }
}

// Middleware to check if user is authenticated
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUserId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

// Middleware to check if user is admin (not just professor)
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminUserId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  if (req.session.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}
