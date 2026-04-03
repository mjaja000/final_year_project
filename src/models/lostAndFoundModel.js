const pool = require('../config/database');

class LostAndFoundModel {
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS lost_and_found (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        item_description TEXT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        vehicle_plate VARCHAR(20),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'found', 'resolved', 'closed')),
        admin_notes TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_lost_and_found_status ON lost_and_found(status);
      CREATE INDEX IF NOT EXISTS idx_lost_and_found_created_at ON lost_and_found(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_lost_and_found_user_id ON lost_and_found(user_id);
    `;

    try {
      await pool.query(query);
      console.log('Lost and Found table created successfully');
    } catch (error) {
      console.error('Error creating lost_and_found table:', error.message);
      throw error;
    }
  }

  static async create(data) {
    const { userId, itemDescription, phoneNumber, vehiclePlate } = data;
    
    const query = `
      INSERT INTO lost_and_found (user_id, item_description, phone_number, vehicle_plate)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [userId, itemDescription, phoneNumber, vehiclePlate]);
      return result.rows[0];
    } catch (error) {
      console.error('Error creating lost and found report:', error.message);
      throw error;
    }
  }

  static async getAll(filters = {}) {
    let query = `
      SELECT 
        laf.*,
        u.name as user_name,
        u.email as user_email
      FROM lost_and_found laf
      LEFT JOIN users u ON laf.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCounter = 1;

    if (filters.status) {
      query += ` AND laf.status = $${paramCounter}`;
      params.push(filters.status);
      paramCounter++;
    }

    if (filters.userId) {
      query += ` AND laf.user_id = $${paramCounter}`;
      params.push(filters.userId);
      paramCounter++;
    }

    if (filters.searchTerm) {
      query += ` AND (laf.item_description ILIKE $${paramCounter} OR laf.vehicle_plate ILIKE $${paramCounter})`;
      params.push(`%${filters.searchTerm}%`);
      paramCounter++;
    }

    query += ` ORDER BY laf.created_at DESC`;

    if (filters.limit) {
      query += ` LIMIT $${paramCounter}`;
      params.push(filters.limit);
      paramCounter++;
    }

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error fetching lost and found reports:', error.message);
      throw error;
    }
  }

  static async getById(id) {
    const query = `
      SELECT 
        laf.*,
        u.name as user_name,
        u.email as user_email
      FROM lost_and_found laf
      LEFT JOIN users u ON laf.user_id = u.id
      WHERE laf.id = $1
    `;

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching lost and found report:', error.message);
      throw error;
    }
  }

  static async updateStatus(id, status, adminNotes = null) {
    const query = `
      UPDATE lost_and_found
      SET 
        status = $1::VARCHAR,
        admin_notes = COALESCE($2, admin_notes),
        resolved_at = CASE WHEN $1::VARCHAR IN ('found', 'resolved', 'closed') THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [status, adminNotes, id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error updating lost and found status:', error.message);
      throw error;
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM lost_and_found WHERE id = $1 RETURNING *';

    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      console.error('Error deleting lost and found report:', error.message);
      throw error;
    }
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'found') as found,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE status = 'closed') as closed
      FROM lost_and_found
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching lost and found stats:', error.message);
      throw error;
    }
  }
}

module.exports = LostAndFoundModel;
