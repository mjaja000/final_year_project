const { Pool } = require('pg');
require('dotenv').config();

// Start with local database configuration (reliable fallback)
const dbConfig = {
  host: process.env.DB_HOST_LOCAL || 'localhost',
  port: process.env.DB_PORT_LOCAL || 5432,
  database: process.env.DB_NAME_LOCAL || 'matatuconnect',
  user: process.env.DB_USER_LOCAL || 'postgres',
  password: process.env.DB_PASSWORD_LOCAL || 'postgres',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Create the pool
const pool = new Pool(dbConfig);

// Handle pool errors
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
});

// Test connection and try cloud if available
(async () => {
  // First check if cloud database is configured
  const cloudHost = process.env.DB_HOST;
  if (cloudHost && cloudHost.includes('neon.tech')) {
    console.log('🔄 Attempting to connect to Cloud Database (Neon)...');
    const cloudConfig = {
      host: cloudHost,
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: { rejectUnauthorized: false },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };
    
    const cloudPool = new Pool(cloudConfig);
    try {
      const client = await cloudPool.connect();
      console.log('✓ ☁️  Cloud Database (Neon) connection successful!');
      console.log(`  Database: ${cloudConfig.database}`);
      console.log('  👉 Cloud database is available but LOCAL is set as primary');
      console.log('  💡 To use cloud, update DB_HOST_LOCAL in .env to cloud host');
      client.release();
      await cloudPool.end();
    } catch (err) {
      console.warn('⚠️  Cloud database connection failed:', err.message);
      console.log('  ℹ️  Using local PostgreSQL as configured');
    }
  }
  
  // Test local database connection
  try {
    const client = await pool.connect();
    console.log('✓ 💻 Local PostgreSQL connection successful');
    console.log(`  Database: ${dbConfig.database}`);
    client.release();
  } catch (err) {
    console.error('✗ Local PostgreSQL connection failed:', err.message);
    console.error('  Hint: Make sure PostgreSQL is running - try: sudo systemctl start postgresql');
  }
})();

module.exports = pool;

