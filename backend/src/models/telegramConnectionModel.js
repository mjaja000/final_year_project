const pool = require('../config/database');

class TelegramConnectionModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS telegram_connections (
        id SERIAL PRIMARY KEY,
        telegram_id BIGINT UNIQUE NOT NULL,
        chat_id BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='telegram_connections' AND column_name='chat_id') THEN
          ALTER TABLE telegram_connections ADD COLUMN chat_id BIGINT NOT NULL DEFAULT 0;
        END IF;
      END
      $$;
    `;
    try {
      await pool.query(query);
      console.log('Telegram connections table created successfully');
    } catch (error) {
      console.error('Error creating telegram connections table:', error);
    }
  }

  static async saveConnection(telegramId, chatId) {
    const query = `
      INSERT INTO telegram_connections (telegram_id, chat_id)
      VALUES ($1, $2)
      ON CONFLICT (telegram_id)
      DO UPDATE SET chat_id = $2, updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [telegramId, chatId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getByTelegramId(telegramId) {
    const query = 'SELECT * FROM telegram_connections WHERE telegram_id = $1;';
    try {
      const result = await pool.query(query, [telegramId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = TelegramConnectionModel;
