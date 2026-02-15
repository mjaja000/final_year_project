const pool = require('../config/database');

class MessageModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER,
        receiver_id INTEGER,
        trip_id INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        whatsapp_phone VARCHAR(20),
        whatsapp_message_id VARCHAR(100),
        direction VARCHAR(20),
        message_type VARCHAR(50),
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL
      );
    `;
    try {
      await pool.query(query);
      
      // Make foreign keys optional
      await pool.query(`ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;`).catch(() => {});
      await pool.query(`ALTER TABLE messages ALTER COLUMN receiver_id DROP NOT NULL;`).catch(() => {});
      
      // Ensure WhatsApp columns exist
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(20);`).catch(() => {});
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS whatsapp_message_id VARCHAR(100);`).catch(() => {});
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS direction VARCHAR(20);`).catch(() => {});
      await pool.query(`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type VARCHAR(50);`).catch(() => {});
      
      // Add missing indexes
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);`).catch(() => {});
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages(receiver_id);`).catch(() => {});
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_trip ON messages(trip_id);`).catch(() => {});
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_whatsapp_phone ON messages(whatsapp_phone);`).catch(() => {});
      await pool.query(`CREATE INDEX IF NOT EXISTS idx_messages_direction ON messages(direction);`).catch(() => {});
      
      console.log('Messages table created successfully');
    } catch (error) {
      console.error('Error creating messages table:', error.message);
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

  // WhatsApp message storage methods
  static async createWhatsAppMessage({ phone, messageId, direction, messageType, message, isRead }) {
    const readFlag = typeof isRead === 'boolean' ? isRead : direction === 'outgoing';
    const query = `
      INSERT INTO messages (whatsapp_phone, whatsapp_message_id, direction, message_type, message, is_read) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING *;
    `;
    const result = await pool.query(query, [phone, messageId, direction, messageType, message, readFlag]);
    return result.rows[0];
  }

  static async getWhatsAppMessages(phone = null, limit = 100) {
    let query, params;
    if (phone) {
      query = `
        SELECT * FROM messages 
        WHERE whatsapp_phone = $1 
        ORDER BY created_at DESC 
        LIMIT $2;
      `;
      params = [phone, limit];
    } else {
      query = `
        SELECT * FROM messages 
        WHERE whatsapp_phone IS NOT NULL 
        ORDER BY created_at DESC 
        LIMIT $1;
      `;
      params = [limit];
    }
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getWhatsAppConversation(phone, limit = 100) {
    const query = `
      SELECT * FROM messages 
      WHERE whatsapp_phone = $1 
      ORDER BY created_at ASC 
      LIMIT $2;
    `;
    const result = await pool.query(query, [phone, limit]);
    return result.rows;
  }

  static async listWhatsAppContacts(limit = 200) {
    try {
      // Get distinct phones with their last message info
      const query = `
        SELECT DISTINCT
          whatsapp_phone as phone,
          (SELECT created_at FROM messages WHERE whatsapp_phone = m.whatsapp_phone ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT message_type FROM messages WHERE whatsapp_phone = m.whatsapp_phone ORDER BY created_at DESC LIMIT 1) as last_message_type,
          (SELECT direction FROM messages WHERE whatsapp_phone = m.whatsapp_phone ORDER BY created_at DESC LIMIT 1) as last_direction,
          (SELECT COUNT(*) FROM messages WHERE whatsapp_phone = m.whatsapp_phone AND direction = 'incoming' AND is_read = false) as unread_count
        FROM messages m
        WHERE m.whatsapp_phone IS NOT NULL
        ORDER BY last_message_at DESC
        LIMIT $1;
      `;
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      console.error('Error in listWhatsAppContacts:', error.message);
      throw error;
    }
  }

  static async markWhatsAppRead(phone) {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE whatsapp_phone = $1 AND direction = 'incoming' AND is_read = false
      RETURNING id;
    `;
    const result = await pool.query(query, [phone]);
    return result.rows;
  }
}

module.exports = MessageModel;