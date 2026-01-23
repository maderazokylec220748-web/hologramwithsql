// Script to generate bcrypt password hash for admin user creation
import bcrypt from 'bcryptjs';

async function generateHash() {
  const password = process.argv[2];

  if (!password) {
    console.error('❌ Usage: node scripts/generate-hash.js <password>');
    console.error('Example: node scripts/generate-hash.js MySecurePassword123');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('❌ Error: Password must be at least 8 characters long');
    process.exit(1);
  }

  // Check password strength
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    console.warn('⚠️  Warning: Password should contain:');
    if (!hasUpperCase) console.warn('   - At least one uppercase letter');
    if (!hasLowerCase) console.warn('   - At least one lowercase letter');
    if (!hasNumber) console.warn('   - At least one number');
    console.warn('');
  }

  const hash = await bcrypt.hash(password, 10);

  console.log('✅ Bcrypt hash generated successfully!\n');
  console.log('Hash:', hash);
  console.log('\nUse this hash in your SQL INSERT statement:');
  console.log(`INSERT INTO admin_users (id, username, password, role, full_name, email)`);
  console.log(`VALUES (UUID(), 'your_username', '${hash}', 'admin', 'Your Name', 'your.email@westmead.edu.ph');`);
  console.log('\n🔒 Remember to keep this hash secure and never commit it to version control!');
}

generateHash();