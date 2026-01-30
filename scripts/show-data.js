import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function showData() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'hologram'
    });

    console.log('✅ Connected to database!\n');

    // Show Professors
    try {
      const [professors] = await connection.execute('SELECT * FROM professors LIMIT 5');
      console.log(`📚 PROFESSORS (${professors.length} total):`);
      console.log(professors);
    } catch (e) {
      console.log('❌ Professors: Not found or error');
    }

    // Show Facilities
    try {
      const [facilities] = await connection.execute('SELECT * FROM facilities LIMIT 5');
      console.log(`\n🏛️ FACILITIES (${facilities.length} total):`);
      console.log(facilities);
    } catch (e) {
      console.log('❌ Facilities: Not found or error');
    }

    // Show Events
    try {
      const [events] = await connection.execute('SELECT * FROM events LIMIT 5');
      console.log(`\n🎉 EVENTS (${events.length} total):`);
      console.log(events);
    } catch (e) {
      console.log('❌ Events: Not found or error');
    }

    // Show FAQs
    try {
      const [faqs] = await connection.execute('SELECT * FROM faqs LIMIT 5');
      console.log(`\n❓ FAQs (${faqs.length} total):`);
      console.log(faqs);
    } catch (e) {
      console.log('❌ FAQs: Not found or error');
    }

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

showData();
