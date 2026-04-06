const pool = require('../config/database');

class SaccoSettingsModel {
  static async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sacco_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      INSERT INTO sacco_settings (key, value)
        VALUES ('sacco_name', 'MatatuConnect')
        ON CONFLICT (key) DO NOTHING;
    `);
  }

  static async get(key) {
    const result = await pool.query('SELECT value FROM sacco_settings WHERE key = $1', [key]);
    return result.rows[0]?.value || null;
  }

  static async set(key, value) {
    const result = await pool.query(`
      INSERT INTO sacco_settings (key, value, updated_at) VALUES ($1, $2, NOW())
      ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()
      RETURNING *
    `, [key, value]);
    return result.rows[0];
  }

  static async getAll() {
    const result = await pool.query('SELECT key, value FROM sacco_settings ORDER BY key');
    return result.rows;
  }
}

module.exports = SaccoSettingsModel;
