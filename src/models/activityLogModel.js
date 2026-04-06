const pool = require('../config/database');

class ActivityLogModel {
  // Create activity logs table
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        action_type VARCHAR(100) NOT NULL,
        resource_type VARCHAR(100),
        resource_id INTEGER,
        details TEXT,
        ip_address VARCHAR(45),
        status VARCHAR(20) DEFAULT 'success',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
    `;
    try {
      await pool.query(query);
      console.log('Activity logs table created successfully');
    } catch (error) {
      console.error('Error creating activity logs table:', error);
    }
  }

  // Log an activity
  static async logActivity(userId, actionType, resourceType = null, resourceId = null, details = null, ipAddress = null, status = 'success') {
    const query = `
      INSERT INTO activity_logs (user_id, action_type, resource_type, resource_id, details, ip_address, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    try {
      const result = await pool.query(query, [userId, actionType, resourceType, resourceId, details, ipAddress, status]);
      return result.rows[0];
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  // Get recent activities
  static async getRecentActivities(limit = 50) {
    const query = `
      SELECT 
        al.*,
        u.name as user_name, u.email as user_email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1;
    `;
    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get activities by user
  static async getActivitiesByUser(userId, limit = 50) {
    const query = `
      SELECT *
      FROM activity_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;
    try {
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get activities by action type
  static async getActivitiesByActionType(actionType, limit = 50) {
    const query = `
      SELECT 
        al.*,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.action_type = $1
      ORDER BY al.created_at DESC
      LIMIT $2;
    `;
    try {
      const result = await pool.query(query, [actionType, limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get activity summary
  static async getActivitySummary(hours = 24) {
    const query = `
      SELECT 
        action_type,
        COUNT(*) as count,
        status,
        MAX(created_at) as last_occurrence
      FROM activity_logs
      WHERE created_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY action_type, status
      ORDER BY count DESC;
    `;
    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get system events for dashboard
  static async getSystemEvents(limit = 20) {
    const query = `
      SELECT 
        al.id,
        al.action_type,
        al.resource_type,
        al.details,
        al.status,
        al.created_at,
        u.name as user_name
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT $1;
    `;
    try {
      const result = await pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Clean old logs (keep last 90 days)
  static async cleanOldLogs(daysToKeep = 90) {
    const query = `
      DELETE FROM activity_logs
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days';
    `;
    try {
      const result = await pool.query(query);
      return result.rowCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ActivityLogModel;
