import 'dotenv/config';
import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';

async function countQueries() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM queries`);
    console.log('Total queries in database:', result[0].count);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

countQueries();
