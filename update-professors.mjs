import mysql from 'mysql2/promise';

async function updateProfessors() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'hologram'
  });

  try {
    // Delete old professors
    await connection.execute('DELETE FROM professors');
    
    // Insert new professors with correct data
    const professors = [
      ['prof-1', 'Dr. Arlene D. Castor', 'President & CEO', 'Mathematics', 'arlene.castor@westmead.edu.ph', '+63-43-740-1000', 'President and CEO of Westmead International School'],
      ['prof-2', 'Dr. Marites D. Manlongat', 'Vice President for Academic Affairs', 'SEBA/CAS', 'marites.manlongat@westmead.edu.ph', '+63-43-740-1001', 'Vice President for Academic Affairs'],
      ['prof-3', 'Iluminada De Chavez', 'Chairman of the Board', 'Board of Trustees', 'iluminada.dechavez@westmead.edu.ph', '+63-43-740-1002', 'Chairman of the Board'],
      ['prof-4', 'Mr. John Andrew C. Manalo', 'Professor', 'CITCS', 'john.manalo@westmead.edu.ph', '+63-43-740-1003', 'Professor in CITCS'],
      ['prof-5', 'Mr. Roberto Fernandez', 'Instructor', 'Arts & Design', 'roberto.fernandez@westmead.edu.ph', '+63-43-740-1004', 'Instructor in Arts & Design'],
      ['prof-6', 'Prof. Ernesto Carlo L. De Chavez', 'Dean', 'CTHM', 'ernesto.dechavez@westmead.edu.ph', '+63-43-740-1005', 'Dean of CTHM'],
      ['prof-7', 'Prof. Rosana De Chavez', 'CITCS Dean', 'CITCS', 'rosana.dechavez@westmead.edu.ph', '+63-43-740-1006', 'CITCS Dean']
    ];

    for (const prof of professors) {
      await connection.execute(
        'INSERT INTO professors (id, fullName, position, department, email, phone, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
        prof
      );
    }

    console.log('✅ Updated 7 professors in database');
    
  } catch (error) {
    console.error('Error updating professors:', error);
  } finally {
    await connection.end();
  }
}

updateProfessors();
