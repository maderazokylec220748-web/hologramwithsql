-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id VARCHAR(36) PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data TEXT,
  session_id VARCHAR(36),
  user_type TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_type (event_type(255)),
  INDEX idx_created_at (created_at),
  INDEX idx_session_id (session_id)
);

-- Feedback Table
CREATE TABLE IF NOT EXISTS feedback (
  id VARCHAR(36) PRIMARY KEY,
  query_id VARCHAR(36) NOT NULL,
  rating TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_query_id (query_id),
  INDEX idx_rating (rating(10)),
  INDEX idx_created_at (created_at)
);
