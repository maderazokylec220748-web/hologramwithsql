import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  try {
    fs.mkdirSync(logsDir, { recursive: true });
  } catch (error) {
    console.error('Failed to create logs directory:', error);
  }
}

// Create logger instance with appropriate settings for production/development
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'hologram-assistant' },
  transports: [
    // Write errors to error.log
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// If not in production, also log to console with colorized output
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Sanitize sensitive data from logs
function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitive = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  
  return sanitized;
}

// Export sanitizing logger methods with error handling
export const log = {
  info: (message: string, meta?: any) => {
    try {
      logger.info(message, sanitize(meta));
    } catch (err) {
      console.log(`[INFO] ${message}`, meta);
    }
  },
  error: (message: string, error?: any) => {
    try {
      logger.error(message, sanitize(error));
    } catch (err) {
      console.error(`[ERROR] ${message}`, error);
    }
  },
  warn: (message: string, meta?: any) => {
    try {
      logger.warn(message, sanitize(meta));
    } catch (err) {
      console.warn(`[WARN] ${message}`, meta);
    }
  },
  debug: (message: string, meta?: any) => {
    try {
      logger.debug(message, sanitize(meta));
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEBUG] ${message}`, meta);
      }
    }
  },
  http: (message: string, meta?: any) => {
    try {
      logger.http(message, sanitize(meta));
    } catch (err) {
      console.log(`[HTTP] ${message}`, meta);
    }
  },
};

export default logger;
