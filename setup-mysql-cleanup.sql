-- MySQL Event Scheduler Setup for Automatic Data Cleanup
-- This runs independently of the Node.js application
-- Execute this file once: mysql -u root -p hologram < setup-mysql-cleanup.sql

USE hologram;

-- Enable event scheduler (persists across MySQL restarts)
SET GLOBAL event_scheduler = ON;

-- Drop existing events if they exist
DROP EVENT IF EXISTS cleanup_old_queries;
DROP EVENT IF EXISTS cleanup_old_chat;
DROP EVENT IF EXISTS cleanup_old_analytics;
DROP EVENT IF EXISTS cleanup_old_feedback;

-- Create event to cleanup old queries (7 days retention)
CREATE EVENT cleanup_old_queries
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)  -- Tomorrow at 2:00 AM
DO DELETE FROM queries WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Create event to cleanup old chat history (7 days retention)
CREATE EVENT cleanup_old_chat
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)  -- Tomorrow at 2:00 AM
DO DELETE FROM chat_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Create event to cleanup old analytics events (30 days retention)
CREATE EVENT cleanup_old_analytics
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)  -- Tomorrow at 2:00 AM
DO DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Create event to cleanup old feedback (90 days retention)
CREATE EVENT cleanup_old_feedback
ON SCHEDULE EVERY 1 DAY
STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)  -- Tomorrow at 2:00 AM
DO DELETE FROM feedback WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- Verify events were created
SELECT 
    event_name AS 'Event Name',
    event_definition AS 'Action',
    interval_value AS 'Interval',
    interval_field AS 'Period',
    status AS 'Status'
FROM information_schema.events
WHERE event_schema = 'hologram'
ORDER BY event_name;

-- Show event scheduler status
SHOW VARIABLES LIKE 'event_scheduler';

SELECT 'MySQL Event Scheduler setup complete!' AS Message;
SELECT 'Events will run daily at 2:00 AM automatically.' AS Info;
