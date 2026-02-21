const pool = require('../config/database');

class SessionModel {
  static async createTable() {
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          token VARCHAR(512) UNIQUE NOT NULL,
          device_info VARCHAR(255),
          ip_address VARCHAR(45),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          expires_at TIMESTAMP,
          UNIQUE(user_id, is_active)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
        CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
      `;
      
      await pool.query(createTableQuery);
      console.log('✓ user_sessions table initialized');
    } catch (error) {
      console.error('✗ Error creating user_sessions table:', error.message);
    }
  }

  // Save a new session
  static async saveSession(userId, token, deviceInfo, ipAddress, expiresAt) {
    try {
      // First, invalidate any existing active sessions for this user
      await pool.query(
        'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE',
        [userId]
      );

      // Then create new session
      const query = `
        INSERT INTO user_sessions (user_id, token, device_info, ip_address, expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5, TRUE)
        RETURNING *;
      `;
      
      const result = await pool.query(query, [userId, token, deviceInfo, ipAddress, expiresAt]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving session:', error.message);
      throw error;
    }
  }

  // Get active session for a user
  static async getActiveSession(userId) {
    try {
      const query = `
        SELECT * FROM user_sessions
        WHERE user_id = $1 AND is_active = TRUE
        ORDER BY created_at DESC
        LIMIT 1;
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error getting active session:', error.message);
      throw error;
    }
  }

  // Verify token is still active
  static async isTokenActive(token) {
    try {
      const query = `
        SELECT * FROM user_sessions
        WHERE token = $1 AND is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW());
      `;
      
      const result = await pool.query(query, [token]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error checking token active status:', error.message);
      return false;
    }
  }

  // Invalidate a session
  static async invalidateSession(token) {
    try {
      const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE token = $1
        RETURNING *;
      `;
      
      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error invalidating session:', error.message);
      throw error;
    }
  }

  // Update last activity
  static async updateLastActivity(token) {
    try {
      const query = `
        UPDATE user_sessions
        SET last_activity = NOW()
        WHERE token = $1 AND is_active = TRUE
        RETURNING *;
      `;
      
      const result = await pool.query(query, [token]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error updating last activity:', error.message);
      throw error;
    }
  }

  // Get all sessions for a user
  static async getUserSessions(userId) {
    try {
      const query = `
        SELECT id, token, device_info, ip_address, created_at, last_activity, is_active, expires_at
        FROM user_sessions
        WHERE user_id = $1
        ORDER BY created_at DESC;
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user sessions:', error.message);
      throw error;
    }
  }

  // Clean up expired sessions
  static async cleanupExpiredSessions() {
    try {
      const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE expires_at IS NOT NULL AND expires_at < NOW();
      `;
      
      await pool.query(query);
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error.message);
    }
  }

  // Invalidate all sessions for a user except current one
  static async invalidateAllOtherSessions(userId, currentToken) {
    try {
      const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE user_id = $1 AND token != $2;
      `;
      
      await pool.query(query, [userId, currentToken]);
    } catch (error) {
      console.error('Error invalidating other sessions:', error.message);
      throw error;
    }
  }

  // Invalidate session by ID
  static async invalidateSessionById(sessionId) {
    try {
      const query = `
        UPDATE user_sessions
        SET is_active = FALSE
        WHERE id = $1
        RETURNING *;
      `;
      
      const result = await pool.query(query, [sessionId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error invalidating session by ID:', error.message);
      throw error;
    }
  }
}

module.exports = SessionModel;
