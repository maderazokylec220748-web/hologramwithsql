// Setup MySQL Event Scheduler for automatic cleanup
const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv/config');

async function setupCleanup() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('Setting up MySQL Event Scheduler...\n');
    
    // Enable event scheduler
    await connection.execute('SET GLOBAL event_scheduler = ON');
    console.log('✅ Event scheduler enabled');
    
    // Drop existing events if they exist
    const events = ['cleanup_old_queries', 'cleanup_old_chat', 'cleanup_old_analytics', 'cleanup_old_feedback'];
    for (const event of events) {
      try {
        await connection.execute(`DROP EVENT IF EXISTS ${event}`);
      } catch (err) {
        // Ignore if doesn't exist
      }
    }
    console.log('✅ Dropped old events');
    
    // Create cleanup events (use query() not execute() for CREATE EVENT)
    await connection.query(`
      CREATE EVENT cleanup_old_queries
      ON SCHEDULE EVERY 1 DAY
      STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)
      DO DELETE FROM queries WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    console.log('✅ Created cleanup_old_queries event');
    
    await connection.query(`
      CREATE EVENT cleanup_old_chat
      ON SCHEDULE EVERY 1 DAY
      STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)
      DO DELETE FROM chat_history WHERE created_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);
    console.log('✅ Created cleanup_old_chat event');
    
    await connection.query(`
      CREATE EVENT cleanup_old_analytics
      ON SCHEDULE EVERY 1 DAY
      STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)
      DO DELETE FROM analytics_events WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    console.log('✅ Created cleanup_old_analytics event');
    
    await connection.query(`
      CREATE EVENT cleanup_old_feedback
      ON SCHEDULE EVERY 1 DAY
      STARTS DATE_ADD(DATE_ADD(CURDATE(), INTERVAL 1 DAY), INTERVAL 2 HOUR)
      DO DELETE FROM feedback WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY)
    `);
    console.log('✅ Created cleanup_old_feedback event');
    
    // Verify events were created
    console.log('\n📋 Configured Events:');
    const [events_result] = await connection.execute(`
      SELECT 
        event_name AS name,
        interval_value AS interval_val,
        interval_field AS period,
        status
      FROM information_schema.events
      WHERE event_schema = 'hologram'
      ORDER BY event_name
    `);
    
    events_result.forEach(event => {
      console.log(`   • ${event.name}: Every ${event.interval_val} ${event.period} - ${event.status}`);
    });
    
    // Show event scheduler status
    const [status] = await connection.execute("SHOW VARIABLES LIKE 'event_scheduler'");
    console.log(`\n📅 Event Scheduler Status: ${status[0].Value}`);
    
    console.log('\n✅ MySQL Event Scheduler setup complete!');
    console.log('🔒 Data will be automatically cleaned daily at 2:00 AM');
    console.log('📌 Retention: Queries/Chat=7d, Analytics=30d, Feedback=90d');
    console.log('💡 This runs independently - no need for your app to be running!');
    
  } finally {
    await connection.end();
  }
}

setupCleanup().catch(console.error);
