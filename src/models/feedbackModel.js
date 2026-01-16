const pool = require('../config/database');

class FeedbackModel {
  // Create feedback table with route and feedback type
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        route_id INTEGER NOT NULL,
        vehicle_id INTEGER NOT NULL,
        feedback_type VARCHAR(50) NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE,
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
      );
    `;
    try {
      await pool.query(query);
      console.log('Feedback table created successfully');
    } catch (error) {
      console.error('Error creating feedback table:', error);
    }
  }

  // Submit feedback (FR1: route, vehicle, feedback type, comment)
  static async submitFeedback(userId, routeId, vehicleId, feedbackType, comment) {
    const query = `
      INSERT INTO feedback (user_id, route_id, vehicle_id, feedback_type, comment)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [userId, routeId, vehicleId, feedbackType, comment]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get feedback by ID
  static async getFeedbackById(id) {
    const query = 'SELECT * FROM feedback WHERE id = $1;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Get user feedback
  static async getUserFeedback(userId) {
    const query = `
      SELECT f.*, r.route_name, v.registration_number, u.name as passenger_name
      FROM feedback f
      JOIN routes r ON f.route_id = r.id
      JOIN vehicles v ON f.vehicle_id = v.id
      JOIN users u ON f.user_id = u.id
      WHERE f.user_id = $1 
      ORDER BY f.created_at DESC;
    `;
    try {
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get all feedback (admin only) with filtering
  static async getAllFeedback(limit = 100, offset = 0, filters = {}) {
    let query = `
      SELECT f.*, r.route_name, v.registration_number, u.name as passenger_name
      FROM feedback f
      JOIN routes r ON f.route_id = r.id
      JOIN vehicles v ON f.vehicle_id = v.id
      JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Filter by route
    if (filters.routeId) {
      query += ` AND f.route_id = $${paramCount}`;
      params.push(filters.routeId);
      paramCount++;
    }

    // Filter by vehicle
    if (filters.vehicleId) {
      query += ` AND f.vehicle_id = $${paramCount}`;
      params.push(filters.vehicleId);
      paramCount++;
    }

    // Filter by feedback type
    if (filters.feedbackType) {
      query += ` AND f.feedback_type = $${paramCount}`;
      params.push(filters.feedbackType);
      paramCount++;
    }

    // Filter by date range
    if (filters.startDate) {
      query += ` AND f.created_at >= $${paramCount}`;
      params.push(filters.startDate);
      paramCount++;
    }

    if (filters.endDate) {
      query += ` AND f.created_at <= $${paramCount}`;
      params.push(filters.endDate);
      paramCount++;
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get feedback statistics
  static async getFeedbackStats(filters = {}) {
    let query = `
      SELECT
        COUNT(*) as total_feedback,
        COUNT(CASE WHEN feedback_type = 'Complaint' THEN 1 END) as complaints,
        COUNT(CASE WHEN feedback_type = 'Compliment' THEN 1 END) as compliments
      FROM feedback
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    // Apply same filters
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

  // Delete feedback
  static async deleteFeedback(id) {
    const query = 'DELETE FROM feedback WHERE id = $1 RETURNING id;';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }
}

module.exports = FeedbackModel;
