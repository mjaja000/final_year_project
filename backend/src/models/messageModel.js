const pool = require('../config/database');

class MessageModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        trip_id INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);
    `;
    try {
      await pool.query(query);
      console.log('Messages table created successfully');
    } catch (error) {
      console.error('Error creating messages table:', error);
    }
  }

  static async createMessage({ senderId, receiverId, tripId = null, message }) {
    const query = `INSERT INTO messages (sender_id, receiver_id, trip_id, message) VALUES ($1,$2,$3,$4) RETURNING *;`;
    const result = await pool.query(query, [senderId, receiverId, tripId, message]);
    return result.rows[0];
  }

  static async getConversationBetween(userAId, userBId, limit = 100) {
    const query = `SELECT m.*, u1.name as sender_name, u2.name as receiver_name FROM messages m LEFT JOIN users u1 ON m.sender_id = u1.id LEFT JOIN users u2 ON m.receiver_id = u2.id WHERE (m.sender_id = $1 AND m.receiver_id = $2) OR (m.sender_id = $2 AND m.receiver_id = $1) ORDER BY m.created_at ASC LIMIT $3;`;
    const result = await pool.query(query, [userAId, userBId, limit]);
    return result.rows;
  }

  static async getUnreadCountForReceiver(receiverId) {
    const query = `SELECT COUNT(*) as count FROM messages WHERE receiver_id = $1 AND is_read = false;`;
    const result = await pool.query(query, [receiverId]);
    return parseInt(result.rows[0].count || 0, 10);
  }

  static async markRead(messageIds = []) {
    if (!messageIds || messageIds.length === 0) return 0;
    const placeholders = messageIds.map((_, i) => `$${i + 1}`).join(',');
    const query = `UPDATE messages SET is_read = true WHERE id IN (${placeholders}) RETURNING *;`;
    const result = await pool.query(query, messageIds);
    return result.rows;
  }

  static async markReadForReceiver(messageIds = [], receiverId) {
    if (!messageIds || messageIds.length === 0 || !receiverId) return [];
    const placeholders = messageIds.map((_, i) => `$${i + 2}`).join(',');
    const query = `UPDATE messages SET is_read = true WHERE receiver_id = $1 AND id IN (${placeholders}) RETURNING *;`;
    const result = await pool.query(query, [receiverId, ...messageIds]);
    return result.rows;
  }

  static async listRecentConversationsForAdmin(limit = 50) {
    // Return latest message per sender where receiver is admin (or messages involving admin)
    const query = `
      SELECT m.*, u1.name as sender_name, u2.name as receiver_name
      FROM messages m
      LEFT JOIN users u1 ON m.sender_id = u1.id
      LEFT JOIN users u2 ON m.receiver_id = u2.id
      WHERE m.receiver_id IS NOT NULL
      ORDER BY m.created_at DESC
      LIMIT $1;
    `;
    const result = await pool.query(query, [limit]);
    return result.rows;
  }
}

module.exports = MessageModel;