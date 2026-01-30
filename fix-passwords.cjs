const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function fixPasswords() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hologram'
  });

  console.log('Generating password hashes...');
  
  const adminHash = await bcrypt.hash('Admin2025', 10);
  const instructorHash = await bcrypt.hash('Instructor2025', 10);
  
  console.log('Admin hash:', adminHash);
  console.log('Instructor hash:', instructorHash);
  
  console.log('\nUpdating database...');
  
  await conn.execute(
    'UPDATE admin_users SET password = ? WHERE username = ?',
    [adminHash, 'admin']
  );
  
  await conn.execute(
    'UPDATE admin_users SET password = ? WHERE username = ?',
    [instructorHash, 'instructor']
  );
  
  console.log('✅ Passwords updated successfully!');
  
  // Verify
  const [rows] = await conn.execute('SELECT username, password FROM admin_users');
  console.log('\nVerification:');
  for (const user of rows) {
    console.log(`${user.username}: ${user.password.substring(0, 20)}... (length: ${user.password.length})`);
    
    if (user.username === 'admin') {
      const valid = await bcrypt.compare('Admin2025', user.password);
      console.log(`  ✓ Admin2025 is valid: ${valid}`);
    }
    if (user.username === 'instructor') {
      const valid = await bcrypt.compare('Instructor2025', user.password);
      console.log(`  ✓ Instructor2025 is valid: ${valid}`);
    }
    if (user.username === 'WISAI2025') {
      const valid = await bcrypt.compare('WISAI2025', user.password);
      console.log(`  ✓ WISAI2025 is valid: ${valid}`);
    }
  }
  
  await conn.end();
  console.log('\n✅ All done!');
}

fixPasswords().catch(console.error);
