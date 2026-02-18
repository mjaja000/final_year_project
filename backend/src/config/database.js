const { Pool } = require('pg');
require('dotenv').config();

const parseSsl = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'no', 'off', 'disable', 'disabled'].includes(normalized)) return false;
  return { rejectUnauthorized: false };
};

const hasCloudConfig = Boolean(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER);
const hasLocalConfig = Boolean(
  process.env.DB_HOST_LOCAL ||
  process.env.DB_NAME_LOCAL ||
  process.env.DB_USER_LOCAL ||
  process.env.DB_PASSWORD_LOCAL
);
const target = (process.env.DB_TARGET || '').trim().toLowerCase();
const useLocal = target === 'local' || (!hasCloudConfig && hasLocalConfig);

const dbConfig = useLocal
  ? {
      host: process.env.DB_HOST_LOCAL || 'localhost',
      port: Number(process.env.DB_PORT_LOCAL || 5432),
      database: process.env.DB_NAME_LOCAL || 'matatuconnect',
      user: process.env.DB_USER_LOCAL || 'postgres',
      password: process.env.DB_PASSWORD_LOCAL || 'postgres',
      ssl: parseSsl(process.env.DB_SSL_LOCAL, false),
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: parseSsl(process.env.DB_SSL, process.env.DB_HOST?.includes('neon.tech')),
      max: 10,
      min: 2,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 15000,
      query_timeout: 30000,
      statement_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

const activeLabel = useLocal ? 'local PostgreSQL' : 'cloud PostgreSQL';

// Create the pool
const pool = new Pool(dbConfig);

// Handle pool errors with retry logic
pool.on('error', (err, client) => {
  console.error('⚠ Database pool error:', err.message);
  if (err.message.includes('Connection terminated') || err.message.includes('timeout')) {
    console.log('🔄 Attempting to recover connection...');
  }
});

// Connection health check
pool.on('connect', (client) => {
  client.on('error', (err) => {
    console.error('⚠ Client connection error:', err.message);
  });
});

// Graceful query wrapper with retry
const originalQuery = pool.query.bind(pool);
pool.query = async function (...args) {
  const maxRetries = 2;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await originalQuery(...args);
    } catch (err) {
      lastError = err;
      const isRecoverable = 
        err.message?.includes('Connection terminated') ||
        err.message?.includes('timeout') ||
        err.code === 'ECONNRESET' ||
        err.code === '57P01';
      
      if (isRecoverable && attempt < maxRetries) {
        console.warn(`⚠ Query failed (attempt ${attempt}/${maxRetries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw err;
    }
  }
  
  throw lastError;
};

// Test connection and try cloud if available
(async () => {
  console.log(`🔄 Attempting to connect to ${activeLabel}...`);

  let retries = 3;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log(`✓ ${activeLabel} connection successful`);
      console.log(`  Database: ${dbConfig.database}`);
      client.release();
      break;
    } catch (err) {
      retries--;
      console.error(`✗ ${activeLabel} connection failed (${3 - retries}/3):`, err.message);
      
      if (retries > 0) {
        console.log('  Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        if (useLocal) {
          console.error('  Hint: Ensure local PostgreSQL is running and DB_*_LOCAL credentials are correct.');
        } else {
          console.error('  Hint: Check DB_HOST/DB_NAME/DB_USER/DB_PASSWORD (cloud credentials) in .env.');
        }
      }
    }
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, closing database pool...');
  await pool.end();
  console.log('✓ Database pool closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, closing database pool...');
  await pool.end();
  console.log('✓ Database pool closed');
  process.exit(0);
});

module.exports = pool;

