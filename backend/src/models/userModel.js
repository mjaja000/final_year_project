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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
}

module.exports = UserModel;
