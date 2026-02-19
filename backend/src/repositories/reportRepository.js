const pool = require('../config/database');

/**
 * ReportRepository - Handles all database operations for reports using the Repository Pattern.
 * All queries use parameterized placeholders ($1, $2, etc.) to prevent SQL injection.
 */
class ReportRepository {
  /**
   * Create a new report in the database using a transaction.
   * @param {Object} data - Report data
   * @param {string} data.userId - UUID of the user submitting the report (optional)
   * @param {string} data.matatuId - UUID of the matatu being reported
   * @param {string} data.type - Report type: 'GENERAL' or 'INCIDENT'
   * @param {string} data.category - Category (required for INCIDENT, optional for GENERAL)
   * @param {number} data.rating - Rating 1-5 (required for GENERAL, optional for INCIDENT)
   * @param {string} data.comment - Comment/details
   * @returns {Promise<Object>} Created report object
   */
  static async createReport(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        userId = null,
        matatuId,
        type,
        category = null,
        rating = null,
        comment = null,
      } = data;

      // Insert report using parameterized query
      const insertQuery = `
        INSERT INTO reports (user_id, matatu_id, type, category, rating, comment, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() AT TIME ZONE 'UTC')
        RETURNING 
          id, 
          user_id, 
          matatu_id, 
          type, 
          category, 
          rating, 
          comment, 
          created_at,
          updated_at
      `;

      const insertValues = [userId, matatuId, type, category, rating, comment];
      const insertResult = await client.query(insertQuery, insertValues);
      const report = insertResult.rows[0];

      // Update matatu_performance_logs (secondary table) to track performance issues
      const performanceQuery = `
        INSERT INTO matatu_performance_logs (matatu_id, report_id, report_type, created_at)
        VALUES ($1, $2, $3, NOW() AT TIME ZONE 'UTC')
        ON CONFLICT DO NOTHING
      `;

      const performanceValues = [matatuId, report.id, type];
      await client.query(performanceQuery, performanceValues).catch(() => {
        // If the secondary table doesn't exist, just log it - non-critical
        console.warn('matatu_performance_logs table not found, skipping performance log');
      });

      await client.query('COMMIT');
      return report;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get statistics for a specific matatu.
   * @param {string} matatuId - UUID of the matatu
   * @returns {Promise<Object>} Statistics object with average rating and incident count
   */
  static async getMatatuStats(matatuId) {
    const query = `
      SELECT
        matatu_id,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN type = 'GENERAL' THEN 1 END) as feedback_count,
        COUNT(CASE WHEN type = 'INCIDENT' THEN 1 END) as incident_count,
        ROUND(AVG(CASE WHEN rating IS NOT NULL THEN rating ELSE NULL END)::numeric, 2) as average_rating,
        COUNT(DISTINCT category) as unique_incident_categories,
        MAX(created_at) as last_report_date
      FROM reports
      WHERE matatu_id = $1
      GROUP BY matatu_id
    `;

    try {
      const result = await pool.query(query, [matatuId]);
      return result.rows[0] || {
        matatu_id: matatuId,
        total_reports: 0,
        feedback_count: 0,
        incident_count: 0,
        average_rating: null,
        unique_incident_categories: 0,
        last_report_date: null,
      };
    } catch (error) {
      throw new Error(`Failed to get matatu stats: ${error.message}`);
    }
  }

  /**
   * Get all incidents for a specific matatu (high priority).
   * @param {string} matatuId - UUID of the matatu
   * @returns {Promise<Array>} Array of incident reports
   */
  static async getHighPriorityIncidents(matatuId) {
    const query = `
      SELECT 
        id,
        user_id,
        matatu_id,
        type,
        category,
        comment,
        created_at
      FROM reports
      WHERE matatu_id = $1 AND type = 'INCIDENT'
      ORDER BY created_at DESC
      LIMIT 50
    `;

    try {
      const result = await pool.query(query, [matatuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get incidents: ${error.message}`);
    }
  }

  /**
   * Get all reports for a specific matatu with optional filtering.
   * @param {string} matatuId - UUID of the matatu
   * @param {Object} options - Filter options
   * @param {string} options.type - Filter by type: 'GENERAL' or 'INCIDENT'
   * @param {number} options.limit - Pagination limit (default: 100)
   * @param {number} options.offset - Pagination offset (default: 0)
   * @returns {Promise<Object>} Reports and total count
   */
  static async getMatatuReports(matatuId, options = {}) {
    const { type = null, limit = 100, offset = 0 } = options;

    let query = `
      SELECT 
        id,
        user_id,
        matatu_id,
        type,
        category,
        rating,
        comment,
        created_at
      FROM reports
      WHERE matatu_id = $1
    `;

    const params = [matatuId];
    let paramIndex = 2;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    try {
      const result = await pool.query(query, params);

      // Get total count separately
      let countQuery = `SELECT COUNT(*) as total FROM reports WHERE matatu_id = $1`;
      const countParams = [matatuId];
      if (type) {
        countQuery += ` AND type = $2`;
        countParams.push(type);
      }

      const countResult = await pool.query(countQuery, countParams);

      return {
        reports: result.rows,
        total: parseInt(countResult.rows[0].total),
        limit,
        offset,
      };
    } catch (error) {
      throw new Error(`Failed to get matatu reports: ${error.message}`);
    }
  }

  /**
   * Get report by ID.
   * @param {string} reportId - UUID of the report
   * @returns {Promise<Object|null>} Report object or null if not found
   */
  static async getReportById(reportId) {
    const query = `
      SELECT 
        id,
        user_id,
        matatu_id,
        type,
        category,
        rating,
        comment,
        created_at,
        updated_at
      FROM reports
      WHERE id = $1
    `;

    try {
      const result = await pool.query(query, [reportId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Failed to get report: ${error.message}`);
    }
  }

  /**
   * Delete a report (soft delete by marking as archived or actual deletion).
   * @param {string} reportId - UUID of the report
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async deleteReport(reportId) {
    const query = `DELETE FROM reports WHERE id = $1 RETURNING id`;

    try {
      const result = await pool.query(query, [reportId]);
      return result.rows.length > 0;
    } catch (error) {
      throw new Error(`Failed to delete report: ${error.message}`);
    }
  }

  /**
   * Get all reports for admin listing.
   * @param {Object} options - Pagination options
   * @param {number} options.limit - Max rows
   * @param {number} options.offset - Offset
   * @returns {Promise<Object>} Reports and total count
   */
  static async getAllReports(options = {}) {
    const { limit = 100, offset = 0 } = options;

    const query = `
      SELECT
        r.id,
        r.user_id,
        r.matatu_id,
        r.type,
        r.category,
        r.rating,
        r.comment,
        r.created_at,
        r.updated_at,
        v.registration_number,
        v.route_id,
        rt.route_name
      FROM reports r
      JOIN vehicles v ON r.matatu_id = v.id
      LEFT JOIN routes rt ON v.route_id = rt.id
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;

    try {
      const result = await pool.query(query, [limit, offset]);
      const countResult = await pool.query('SELECT COUNT(*) as total FROM reports');
      return {
        reports: result.rows,
        total: parseInt(countResult.rows[0].total, 10),
        limit,
        offset,
      };
    } catch (error) {
      throw new Error(`Failed to get reports: ${error.message}`);
    }
  }

  /**
   * Get incident categories breakdown for a matatu.
   * @param {string} matatuId - UUID of the matatu
   * @returns {Promise<Array>} Array of category counts
   */
  static async getIncidentCategoryBreakdown(matatuId) {
    const query = `
      SELECT 
        category,
        COUNT(*) as count
      FROM reports
      WHERE matatu_id = $1 AND type = 'INCIDENT' AND category IS NOT NULL
      GROUP BY category
      ORDER BY count DESC
    `;

    try {
      const result = await pool.query(query, [matatuId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Failed to get category breakdown: ${error.message}`);
    }
  }
}

module.exports = ReportRepository;
