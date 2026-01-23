import mysql from 'mysql2/promise';

async function clearEvents() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'wis_hologram',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('Connected to database');

    // Clear all events
    await connection.execute('DELETE FROM events');
    console.log('✓ Events table cleared successfully');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('Error clearing events:', error.message);
    process.exit(1);
  }
}

clearEvents();
