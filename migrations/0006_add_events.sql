-- Create events table for school events management
CREATE TABLE IF NOT EXISTS events (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  event_date TIMESTAMP NOT NULL,
  event_end_date TIMESTAMP,
  location VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  organizer VARCHAR(255),
  event_type VARCHAR(100) NOT NULL DEFAULT 'academic',
  capacity INT,
  image LONGTEXT,
  is_active BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_event_date (event_date),
  INDEX idx_event_type (event_type),
  INDEX idx_is_active (is_active),
  INDEX idx_department (department)
);
