-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  id VARCHAR(36) PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fullName (fullName),
  INDEX idx_position (position),
  INDEX idx_department (department)
);

-- Create facilities table
CREATE TABLE IF NOT EXISTS facilities (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  location VARCHAR(255) NOT NULL,
  capacity INT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_type (type),
  INDEX idx_location (location),
  INDEX idx_status (status)
);
