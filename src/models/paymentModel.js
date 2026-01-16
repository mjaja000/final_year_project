const pool = require('../config/database');

class PaymentModel {
  // Create payment table for simulation records
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
      );
    `;
    try {
      await pool.query(query);
      console.log('Payments table created successfully');
    } catch (error) {
      console.error('Error creating payments table:', error);
    }
  }

  // Initiate payment simulation
  static async initiatePayment(userId, routeId, amount, phoneNumber) {
    const query = `
      INSERT INTO payments (user_id, route_id, amount, phone_number, status)
      VALUES ($1, $2, $3, $4, 'pending')
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [userId, routeId, amount, phoneNumber]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Update payment status (simulate M-Pesa response)
  static async updatePaymentStatus(paymentId, status, transactionId = null) {
    const query = `
      UPDATE payments
      SET status = $1, transaction_id = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [status, transactionId, paymentId]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get payment by ID
  static async getPaymentById(id) {
    const query = 'SELECT * FROM payments WHERE id = $1;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user payments
  static async getUserPayments(userId) {
    const query = `
      SELECT p.*, r.route_name
      FROM payments p
      JOIN routes r ON p.route_id = r.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC;
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all payments (admin)
  static async getAllPayments(limit = 100, offset = 0, filters = {}) {
    let query = `
      SELECT p.*, r.route_name, u.name as passenger_name
      FROM payments p
      JOIN routes r ON p.route_id = r.id
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by route
    if (filters.routeId) {
      query += ` AND p.route_id = $${paramCount}`;
      params.push(filters.routeId);
      paramCount++;
    }

    // Filter by status
    if (filters.status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(filters.status);
      paramCount++;
    }

    // Filter by date range
    if (filters.startDate) {
      query += ` AND p.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND p.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` ORDER BY p.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get payment statistics
  static async getPaymentStats(filters = {}) {
    let query = `
      SELECT
        COUNT(*) as total_payments,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments
      FROM payments
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Apply filters
    if (filters.routeId) {
      query += ` AND route_id = $${paramCount}`;
      params.push(filters.routeId);
      paramCount++;
    }

    if (filters.startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    try {
      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Delete payment
  static async deletePayment(id) {
    const query = 'DELETE FROM payments WHERE id = $1 RETURNING id;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PaymentModel;
