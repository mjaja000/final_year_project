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

let activeLabel = useLocal ? 'local PostgreSQL' : 'cloud PostgreSQL';

const createPool = (config, label) => {
  const nextPool = new Pool(config);
  nextPool.on('error', (err) => {
    console.error('⚠ Database pool error:', err.message);
    if (err.message.includes('Connection terminated') || err.message.includes('timeout')) {
      console.log('🔄 Attempting to recover connection...');
    }
  });
  nextPool.on('connect', (client) => {
    client.on('error', (err) => {
      console.error('⚠ Client connection error:', err.message);
    });
  });
  nextPool.__label = label;
  return nextPool;
};

let activePool = createPool(dbConfig, activeLabel);

const queryWithRetry = async (...args) => {
  const maxRetries = 2;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await activePool.query(...args);
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
      const client = await activePool.connect();
      console.log(`✓ ${activeLabel} connection successful`);
      console.log(`  Database: ${activePool.options?.database || dbConfig.database}`);
      client.release();
      return;
    } catch (err) {
      retries--;
      console.error(`✗ ${activeLabel} connection failed (${3 - retries}/3):`, err.message);

      if (retries > 0) {
        console.log('  Retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      if (!useLocal && hasLocalConfig) {
        console.warn('⚠ Falling back to local PostgreSQL...');
        activeLabel = 'local PostgreSQL';
        activePool = createPool({
          host: process.env.DB_HOST_LOCAL || 'localhost',
          port: Number(process.env.DB_PORT_LOCAL || 5432),
          database: process.env.DB_NAME_LOCAL || 'matatuconnect',
          user: process.env.DB_USER_LOCAL || 'postgres',
          password: process.env.DB_PASSWORD_LOCAL || 'postgres',
          ssl: parseSsl(process.env.DB_SSL_LOCAL, false),
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        }, activeLabel);

        try {
          const localClient = await activePool.connect();
          console.log(`✓ ${activeLabel} connection successful`);
          console.log(`  Database: ${activePool.options?.database || process.env.DB_NAME_LOCAL || 'matatuconnect'}`);
          localClient.release();
          return;
        } catch (localErr) {
          console.error('✗ Local PostgreSQL connection failed:', localErr.message);
          console.error('  Hint: Ensure local PostgreSQL is running and DB_*_LOCAL credentials are correct.');
          return;
        }
      }

      if (useLocal) {
        console.error('  Hint: Ensure local PostgreSQL is running and DB_*_LOCAL credentials are correct.');
      } else {
        console.error('  Hint: Check DB_HOST/DB_NAME/DB_USER/DB_PASSWORD (cloud credentials) in .env.');
      }
    }
  }
})();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, closing database pool...');
  await activePool.end();
  console.log('✓ Database pool closed');
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, closing database pool...');
  await activePool.end();
  console.log('✓ Database pool closed');
  process.exit(0);
});
const pool = new Proxy({}, {
  get(_target, prop, _receiver) {
    if (prop === 'query') {
      return (...args) => queryWithRetry(...args);
    }

    const value = activePool[prop];

    // Bind methods to activePool so `this` is correct
    if (typeof value === 'function') {
      return value.bind(activePool);
    }

    return value;
  },
});
module.exports = pool;

