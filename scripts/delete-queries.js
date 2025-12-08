import 'dotenv/config';
import { db } from '../server/db.js';
import { queries } from '../shared/schema.js';

async function deleteAllQueries() {
  try {
    console.log('🗑️ Deleting all queries from database...');
    const result = await db.delete(queries);
    console.log('✅ All queries deleted successfully!');
    console.log(`Rows affected: ${result.rowsAffected || 'unknown'}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting queries:', error);
    process.exit(1);
  }
}

deleteAllQueries();
