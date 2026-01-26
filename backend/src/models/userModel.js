const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  // Create user table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        status VARCHAR(20) DEFAULT 'active',
        profile_image VARCHAR(255),
        last_activity TIMESTAMP,
        last_login TIMESTAMP,
        is_online BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      -- Safe migration for existing tables
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_activity') THEN
          ALTER TABLE users ADD COLUMN last_activity TIMESTAMP;
          ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
          ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT false;
        END IF;
      END
      $$;
    `;
    try {
      await pool.query(query);
      console.log('Users table created successfully');
    } catch (error) {
      console.error('Error creating users table:', error);
    }
  }

  // Register new user
  static async register(name, email, phone, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (name, email, phone, password, role)
      VALUES ($1, $2, $3, $4, 'user')
      RETURNING id, name, email, phone, role;
    `;
    try {
      const result = await pool.query(query, [name, email, phone, hashedPassword]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by email
  static async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1;';
    try {
      const result = await pool.query(query, [email]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id) {
    const query = 'SELECT id, name, email, phone, role, status, profile_image FROM users WHERE id = $1;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get all users
  static async getAllUsers() {
    const query = 'SELECT id, name, email, phone, role, status, created_at FROM users ORDER BY created_at DESC;';
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Update user
  static async updateUser(id, name, phone, profileImage) {
    const query = `
      UPDATE users
      SET name = $1, phone = $2, profile_image = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, name, email, phone, role, status;
    `;
    try {
      const result = await pool.query(query, [name, phone, profileImage, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Change password
  static async changePassword(id, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `
      UPDATE users
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, email;
    `;
    try {
      const result = await pool.query(query, [hashedPassword, id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete user
  static async deleteUser(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Get total count of users
  static async getTotalCount() {
    const query = 'SELECT COUNT(*) as count FROM users;';
    try {
      const result = await pool.query(query);
      return result.rows[0].count || 0;
    } catch (error) {
      console.error('Error getting user count:', error);
      return 0;
    }
  }

  // Track user activity (login, logout, etc)
  static async trackActivity(userId) {
    const query = `
      UPDATE users
      SET last_activity = CURRENT_TIMESTAMP, is_online = true
      WHERE id = $1
      RETURNING id, name, email, last_activity, is_online;
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Record user login
  static async recordLogin(userId) {
    const query = `
      UPDATE users
      SET last_login = CURRENT_TIMESTAMP, is_online = true, last_activity = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, name, email, last_login, is_online;
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Record user logout
  static async recordLogout(userId) {
    const query = `
      UPDATE users
      SET is_online = false
      WHERE id = $1
      RETURNING id, name, email, is_online;
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get online users count
  static async getOnlineUsersCount() {
    const query = 'SELECT COUNT(*) as count FROM users WHERE is_online = true;';
    try {
      const result = await pool.query(query);
      return result.rows[0].count || 0;
    } catch (error) {
      console.error('Error getting online users count:', error);
      return 0;
    }
  }

  // Get users with activity info
  static async getUsersWithActivity() {
    const query = `
      SELECT 
        id, name, email, phone, role, status, 
        last_activity, last_login, is_online, 
        created_at, updated_at
      FROM users
      ORDER BY last_activity DESC;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
