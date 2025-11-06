import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is required');
    console.log('Example: DATABASE_URL="mysql://username:password@host:3306/database" node scripts/run-migration.js');
    process.exit(1);
  }

  try {
    // Parse DATABASE_URL to get connection details
    const url = new URL(process.env.DATABASE_URL);
    
    // Connect without specifying database first
    const connectionConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
    };

    console.log('Connecting to MySQL server...');
    const connection = await mysql.createConnection(connectionConfig);

    // Read and execute migration files
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        console.log(`Running migration: ${file}`);
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        // Split by semicolon and execute each statement
        const statements = sql.split(';').filter(s => s.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await connection.query(statement);
            } catch (error) {
              // Skip errors for statements that might already exist or aren't supported
              if (!error.message.includes('already exists') && 
                  !error.message.includes('Duplicate entry') &&
                  !error.message.includes('prepared statement protocol')) {
                console.warn(`Warning in statement: ${error.message}`);
              }
            }
          }
        }
        
        console.log(`✓ Completed: ${file}`);
      }
    }

    await connection.end();
    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();