const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool for PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'matatuconnect',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true' ? true : false,
});

// Test connection
pool.connect()
  .then(client => {
    console.log('✓ PostgreSQL Database connection successful');
    client.release();
  })
  .catch(err => {
    console.error('✗ PostgreSQL Database connection failed:', err.message);
  });

module.exports = pool;

