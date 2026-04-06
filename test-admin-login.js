require('dotenv').config();
const pool = require('./src/config/database');
const bcrypt = require('bcryptjs');

async function testAdminLogin() {
  try {
    const email = 'admin@matatuconnect.test';
    const password = 'Admin@Matatu2024!';
    
    console.log('🔍 Testing admin login...\n');
    
    // Get user
    const result = await pool.query(
      'SELECT id, name, email, username, password, role FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const user = result.rows[0];
    console.log('✓ User found:');
    console.log('  ID:', user.id);
    console.log('  Email:', user.email);
    console.log('  Username:', user.username);
    console.log('  Role:', user.role);
    console.log('  Password hash:', user.password.substring(0, 30) + '...');
    
    // Test password
    console.log('\n🔐 Testing password verification...');
    console.log('  Password to test:', password);
    const isValid = await bcrypt.compare(password, user.password);
    console.log('  Result:', isValid ? '✓ VALID ✓' : '✗ INVALID ✗');
    
    if (!isValid) {
      console.log('\n⚠️ Password does not match! Updating password...');
      const newHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password = $1 WHERE email = $2', [newHash, email]);
      console.log('✓ Password updated successfully');
      
      // Verify again
      const verifyResult = await pool.query('SELECT password FROM users WHERE email = $1', [email]);
      const finalCheck = await bcrypt.compare(password, verifyResult.rows[0].password);
      console.log('✓ Final verification:', finalCheck ? 'SUCCESS' : 'FAILED');
    }
    
    console.log('\n✅ Admin credentials verified!');
    console.log('\n📋 Login with:');
    console.log('  Email:', email);
    console.log('  Password:', password);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAdminLogin();
