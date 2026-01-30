require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hologram'
  });
  
  const [rows] = await conn.query('SELECT COUNT(*) as count FROM professors');
  console.log('Total professors in DB:', rows[0].count);
  
  const [all] = await conn.query('SELECT fullName, position, department FROM professors ORDER BY fullName');
  console.log('\nAll professors:');
  all.forEach((p, i) => {
    console.log(`${i+1}. ${p.fullName} - ${p.position} - ${p.department}`);
  });
  
  conn.end();
}

check().catch(console.error);
