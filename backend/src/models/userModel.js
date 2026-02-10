const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
  // Create user table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE,
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
        telegram_id BIGINT,
        chat_id BIGINT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      -- Safe migration for existing tables
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
          ALTER TABLE users ADD COLUMN username VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_activity') THEN
          ALTER TABLE users ADD COLUMN last_activity TIMESTAMP;
          ALTER TABLE users ADD COLUMN last_login TIMESTAMP;
          ALTER TABLE users ADD COLUMN is_online BOOLEAN DEFAULT false;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='telegram_id') THEN
          ALTER TABLE users ADD COLUMN telegram_id BIGINT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='chat_id') THEN
          ALTER TABLE users ADD COLUMN chat_id BIGINT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
          ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
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

  // Create driver user with unique username DRIVE0001
  static async createDriverUser({ name, email, phone, password, username = null }) {
    // Check for existing email / phone to provide friendlier errors before inserting
    try {
      const existsQuery = 'SELECT id, email, phone FROM users WHERE email = $1 OR phone = $2 LIMIT 1';
      const existsResult = await pool.query(existsQuery, [email, phone]);
      if (existsResult.rows && existsResult.rows.length > 0) {
        const row = existsResult.rows[0];
        if (row.email === email) {
          const err = new Error('Email already exists');
          err.code = 'DUPLICATE_EMAIL';
          throw err;
        }
        if (row.phone && phone && row.phone === phone) {
          const err = new Error('Phone already exists');
          err.code = 'DUPLICATE_PHONE';
          throw err;
        }
      }
    } catch (err) {
      // if it's our duplicate error rethrow
      if (err.code === 'DUPLICATE_EMAIL' || err.code === 'DUPLICATE_PHONE') throw err;
      // otherwise continue (query error shouldn't block creation)
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // If username not provided, generate next DRIVExxxx username (ensure unique)
    let finalUsername = username;
    if (!finalUsername) {
      // Find the last DRIVE username if any
      const genRes = await pool.query("SELECT username FROM users WHERE username ~ '^DRIVE\\\\d{4}$' ORDER BY username DESC LIMIT 1");
      let last = genRes.rows[0]?.username || null;
      let num = 1;
      if (last) num = parseInt(last.replace('DRIVE', ''), 10) + 1;

      // Loop until we find a username that does not exist (handles gaps and concurrent inserts)
      let attempts = 0;
      while (true) {
        finalUsername = 'DRIVE' + String(num).padStart(4, '0');
        const exists = await pool.query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [finalUsername]);
        if (exists.rowCount === 0) break;
        num += 1;
        attempts += 1;
        if (attempts > 10000) throw new Error('Unable to generate unique driver username');
      }
    }

    const query = `
      INSERT INTO users (username, name, email, phone, password, role)
      VALUES ($1, $2, $3, $4, $5, 'driver')
      RETURNING id, username, name, email, phone, role;
    `;

    // Try inserting, and handle potential username collisions by retrying with incremented username
    let attempts = 0;
    while (true) {
      try {
        const result = await pool.query(query, [finalUsername, name, email, phone, hashedPassword]);
        return result.rows[0];
      } catch (error) {
        // If unique constraint on username occurred, try next username and retry
        if (error && error.code === '23505' && /username/.test(error.detail || error.constraint || '')) {
          attempts += 1;
          if (attempts >= 10) throw new Error('Unable to create unique username after multiple attempts');
          const currentNum = parseInt(finalUsername.replace('DRIVE', ''), 10) || 0;
          const nextNum = currentNum + 1;
          finalUsername = 'DRIVE' + String(nextNum).padStart(4, '0');
          continue;
        }
        throw error;
      }
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

  // Get user by identifier (email or username)
  static async getUserByIdentifier(identifier) {
    const query = 'SELECT * FROM users WHERE email = $1 OR username = $1;';
    try {
      const result = await pool.query(query, [identifier]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(id) {
    const query = 'SELECT id, name, email, phone, role, status, profile_image, telegram_id, chat_id FROM users WHERE id = $1;';
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

  static async updateTelegramConnection(userId, telegramId, chatId) {
    const query = `
      UPDATE users
      SET telegram_id = $1, chat_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, telegram_id, chat_id;
    `;
    try {
      const result = await pool.query(query, [telegramId, chatId, userId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  static async getTelegramChatIdByUserId(userId) {
    const query = 'SELECT chat_id FROM users WHERE id = $1;';
    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0]?.chat_id || null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserModel;
