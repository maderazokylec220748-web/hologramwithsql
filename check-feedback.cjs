// Quick script to check feedback table
const mysql = require('mysql2/promise');
require('dotenv/config');

async function checkFeedback() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Checking feedback table...\n');
    
    const [rows] = await connection.execute('SELECT * FROM feedback ORDER BY created_at DESC LIMIT 10');
    console.log(`Found ${rows.length} feedback records:\n`);
    rows.forEach((row, i) => {
      console.log(`${i + 1}. ID: ${row.id}`);
      console.log(`   Query ID: ${row.query_id}`);
      console.log(`   Rating: ${row.rating}`);
      console.log(`   Created: ${row.created_at}`);
      console.log('');
    });
    
    const [counts] = await connection.execute('SELECT rating, COUNT(*) as count FROM feedback GROUP BY rating');
    console.log('Feedback counts:');
    counts.forEach(row => {
      console.log(`  ${row.rating}: ${row.count} (type: ${typeof row.count})`);
    });
    
  } finally {
    await connection.end();
  }
}

checkFeedback().catch(console.error);
