// Reference: MySQL database configuration
import 'dotenv/config';
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to set up the database connection?",
  );
}

export const pool = mysql.createPool({
  uri: process.env.DATABASE_URL,
  connectionLimit: 10, // Maximum number of connections
  queueLimit: 0, // Unlimited queue
  waitForConnections: true, // Wait for available connection
  maxIdle: 10, // Maximum idle connections
  idleTimeout: 60000, // 60 seconds
  enableKeepAlive: true, // Keep connections alive
  keepAliveInitialDelay: 0,
  timezone: 'local', // Use local timezone instead of UTC
});

export const db = drizzle(pool, { schema, mode: 'default' });
