import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || "localhost",
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "hologram",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function createEventsTable() {
  const connection = await pool.getConnection();
  try {
    console.log("Creating events table...");
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(36) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        event_date TIMESTAMP NOT NULL,
        event_end_date TIMESTAMP NULL,
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
    `;
    
    await connection.execute(createTableSQL);
    console.log("✓ Events table created successfully!");
  } catch (error) {
    console.error("Error creating events table:", error);
    throw error;
  } finally {
    await connection.release();
    await pool.end();
  }
}

createEventsTable()
  .then(() => {
    console.log("Migration completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
