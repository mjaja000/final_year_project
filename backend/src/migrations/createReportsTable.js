const pool = require('../config/database');

/**
 * Create reports table with proper schema for GENERAL and INCIDENT report types.
 * Uses UUIDs for primary key and foreign keys.
 * Includes indexes for optimized querying by matatu and report type.
 */
async function createReportsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS reports (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      matatu_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      type VARCHAR(20) NOT NULL CHECK (type IN ('GENERAL', 'INCIDENT')),
      category VARCHAR(50),
      rating INTEGER CHECK (rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- Create indexes for optimized querying
    CREATE INDEX IF NOT EXISTS idx_reports_matatu_id ON reports(matatu_id);
    CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);
    CREATE INDEX IF NOT EXISTS idx_reports_matatu_type ON reports(matatu_id, type);
    CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
    CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
  `;

  try {
    await pool.query(query);
    console.log('✓ Reports table created successfully with indexes');
    return true;
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ Reports table already exists');
      return true;
    }
    console.error('✗ Error creating reports table:', error.message);
    throw error;
  }
}

module.exports = { createReportsTable };
