const pool = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * Seed script to create the default admin user
 * Email: admin@matatuconnect.real
 * Password: Admin@Matatu2024!
 */
async function seedAdmin() {
  try {
    console.log('🌱 Seeding admin user...');

    const adminEmail = 'admin@matatuconnect.real';
    const adminPassword = 'Admin@Matatu2024!';
    const adminName = 'System Administrator';
    const adminPhone = '+254700000000';

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('✓ Admin user already exists');
      console.log('  Email:', adminEmail);
      console.log('  Role:', existingAdmin.rows[0].role);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const result = await pool.query(
      `INSERT INTO users (name, email, phone, password, role, status, username)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, status, created_at`,
      [adminName, adminEmail, adminPhone, hashedPassword, 'admin', 'active', 'admin']
    );

    console.log('✓ Admin user created successfully!');
    console.log('  ID:', result.rows[0].id);
    console.log('  Name:', result.rows[0].name);
    console.log('  Email:', result.rows[0].email);
    console.log('  Username:', 'admin');
    console.log('  Role:', result.rows[0].role);
    console.log('  Password:', adminPassword);
    console.log('\n🔐 Login Credentials:');
    console.log('  Email:', adminEmail);
    console.log('  Password:', adminPassword);

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('\n✅ Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedAdmin };
