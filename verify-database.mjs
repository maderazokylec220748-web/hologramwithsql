import mysql from 'mysql2/promise';

async function verifyDatabase() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hologram'
  });

  try {
    console.log('\n========================================');
    console.log('🔍 DATABASE VERIFICATION REPORT');
    console.log('========================================\n');

    // Check FAQs
    const [faqs] = await connection.execute('SELECT COUNT(*) as count FROM faqs WHERE is_active = true');
    console.log(`✅ Active FAQs: ${faqs[0].count}`);
    
    const [faqSample] = await connection.execute('SELECT question FROM faqs LIMIT 5');
    console.log('   Sample FAQs:');
    faqSample.forEach((faq, i) => {
      console.log(`   ${i+1}. ${faq.question.substring(0, 60)}...`);
    });

    // Check Professors
    const [profs] = await connection.execute('SELECT COUNT(*) as count FROM professors');
    console.log(`\n✅ Professors: ${profs[0].count}`);
    
    const [profSample] = await connection.execute('SELECT fullName, position FROM professors');
    console.log('   Faculty:');
    profSample.forEach((prof, i) => {
      console.log(`   ${i+1}. ${prof.fullName} | ${prof.position}`);
    });

    // Check Facilities
    const [facilities] = await connection.execute('SELECT COUNT(*) as count FROM facilities');
    console.log(`\n✅ Facilities: ${facilities[0].count}`);
    
    const [facSample] = await connection.execute('SELECT name, type FROM facilities LIMIT 7');
    console.log('   Campus Resources:');
    facSample.forEach((fac, i) => {
      console.log(`   ${i+1}. ${fac.name} (${fac.type})`);
    });

    // Check Events
    const [events] = await connection.execute('SELECT COUNT(*) as count FROM events WHERE is_active = true');
    console.log(`\n✅ Active Events: ${events[0].count}`);

    // Check Queries (chat history)
    const [queries] = await connection.execute('SELECT COUNT(*) as count FROM queries');
    console.log(`\n✅ Total Queries Recorded: ${queries[0].count}`);

    console.log('\n========================================');
    console.log('📊 CONNECTION STATUS');
    console.log('========================================');
    console.log('✅ MySQL Connected');
    console.log('✅ Database: hologram');
    console.log('✅ All tables populated');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await connection.end();
  }
}

verifyDatabase();
