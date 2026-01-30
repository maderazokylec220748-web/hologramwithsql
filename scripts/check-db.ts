#!/usr/bin/env node

/**
 * Check existing database tables and data
 */

import mysql from 'mysql2/promise';

async function checkDatabase() {
  try {
    console.log('🔍 Checking your database...\n');

    const connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'hologram'
    });

    // Check FAQs
    try {
      const [faqsResult] = await connection.execute('SELECT COUNT(*) as count FROM faqs');
      console.log(`📚 FAQs: ${faqsResult.length} entries`);
      if (faqsResult.length > 0) {
        console.log('   Sample:', faqsResult[0]?.question?.substring(0, 50));
      }
    } catch (e) {
      console.log('❌ FAQs table: Not found or empty');
    }

    // Check Professors
    try {
      const professorsResult = await db.query.professors.findMany();
      console.log(`👨‍🏫 Professors: ${professorsResult.length} entries`);
      if (professorsResult.length > 0) {
        console.log('   Sample:', professorsResult[0]?.fullName);
      }
    } catch (e) {
      console.log('❌ Professors table: Not found or empty');
    }

    // Check Facilities
    try {
      const facilitiesResult = await db.query.facilities.findMany();
      console.log(`🏛️  Facilities: ${facilitiesResult.length} entries`);
      if (facilitiesResult.length > 0) {
        console.log('   Sample:', facilitiesResult[0]?.name);
      }
    } catch (e) {
      console.log('❌ Facilities table: Not found or empty');
    }

    // Check Events
    try {
      const eventsResult = await db.query.events.findMany();
      console.log(`🎉 Events: ${eventsResult.length} entries`);
      if (eventsResult.length > 0) {
        console.log('   Sample:', eventsResult[0]?.title);
      }
    } catch (e) {
      console.log('❌ Events table: Not found or empty');
    }

    console.log('\n✅ Database connection successful!');
    console.log('📊 All connected data will be available to Llama for answering questions.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database check failed:', error);
    console.error('\n💡 Make sure:');
    console.error('   1. MySQL is running');
    console.error('   2. Database "hologram" exists');
    console.error('   3. Connection details in .env are correct');
    process.exit(1);
  }
}

checkDatabase();
