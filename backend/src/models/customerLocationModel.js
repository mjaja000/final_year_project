const pool = require('../config/database');

/**
 * Customer Locations Model
 * Tracks anonymous customer/passenger locations for route planning and demand analysis
 */
class CustomerLocationModel {
  /**
   * Create customer_locations table
   */
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS customer_locations (
        id SERIAL PRIMARY KEY,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        client_ip VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Index for geospatial queries
      CREATE INDEX IF NOT EXISTS idx_customer_locations_coords 
        ON customer_locations (latitude, longitude);
      
      -- Index for time-based queries
      CREATE INDEX IF NOT EXISTS idx_customer_locations_recorded_at 
        ON customer_locations (recorded_at DESC);
      
      -- Index for IP-based tracking
      CREATE INDEX IF NOT EXISTS idx_customer_locations_client_ip 
        ON customer_locations (client_ip);
    `;

    try {
      await pool.query(query);
      console.log('✓ Customer locations table created successfully');
      return true;
    } catch (error) {
      console.error('✗ Error creating customer_locations table:', error.message);
      throw error;
    }
  }

  /**
   * Save a customer location
   */
  static async saveLocation(latitude, longitude, clientIp, userAgent = null) {
    const query = `
      INSERT INTO customer_locations (latitude, longitude, recorded_at, client_ip, user_agent)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        parseFloat(latitude),
        parseFloat(longitude),
        new Date(),
        clientIp,
        userAgent
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error saving customer location:', error.message);
      throw error;
    }
  }

  /**
   * Get recent customer locations within a time range
   */
  static async getRecentLocations(hoursBack = 24) {
    const query = `
      SELECT 
        id,
        latitude,
        longitude,
        recorded_at,
        client_ip
      FROM customer_locations
      WHERE recorded_at > NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY recorded_at DESC
    `;

    try {
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error fetching recent customer locations:', error.message);
      throw error;
    }
  }

  /**
   * Get customer locations within a geographic area (bounding box)
   */
  static async getLocationsByArea(minLat, maxLat, minLng, maxLng, hoursBack = 24) {
    const query = `
      SELECT 
        id,
        latitude,
        longitude,
        recorded_at,
        COUNT(*) OVER (PARTITION BY CAST(latitude AS VARCHAR(10)), CAST(longitude AS VARCHAR(10))) as location_count
      FROM customer_locations
      WHERE 
        latitude BETWEEN $1 AND $2
        AND longitude BETWEEN $3 AND $4
        AND recorded_at > NOW() - INTERVAL '${hoursBack} hours'
      ORDER BY recorded_at DESC
    `;

    try {
      const result = await pool.query(query, [minLat, maxLat, minLng, maxLng]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching locations by area:', error.message);
      throw error;
    }
  }

  /**
   * Get location density hotspots (for route optimization)
   */
  static async getLocationHotspots(hoursBack = 24, gridSize = 0.01) {
    const query = `
      SELECT 
        ROUND(latitude / $1) * $1 as grid_lat,
        ROUND(longitude / $1) * $1 as grid_lng,
        COUNT(*) as location_count,
        AVG(latitude) as avg_lat,
        AVG(longitude) as avg_lng
      FROM customer_locations
      WHERE recorded_at > NOW() - INTERVAL '${hoursBack} hours'
      GROUP BY grid_lat, grid_lng
      HAVING COUNT(*) > 1
      ORDER BY location_count DESC
      LIMIT 100
    `;

    try {
      const result = await pool.query(query, [gridSize]);
      return result.rows;
    } catch (error) {
      console.error('Error calculating location hotspots:', error.message);
      throw error;
    }
  }

  /**
   * Clean up old location data (privacy compliance)
   */
  static async cleanupOldData(daysToKeep = 30) {
    const query = `
      DELETE FROM customer_locations
      WHERE recorded_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING COUNT(*) as deleted_count
    `;

    try {
      const result = await pool.query(query);
      const deletedCount = result.rows[0]?.deleted_count || 0;
      console.log(`Cleaned up ${deletedCount} old customer location records`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old customer locations:', error.message);
      throw error;
    }
  }

  /**
   * Get location statistics
   */
  static async getStatistics(hoursBack = 24) {
    const query = `
      SELECT 
        COUNT(*) as total_locations,
        COUNT(DISTINCT client_ip) as unique_ips,
        MIN(recorded_at) as oldest_record,
        MAX(recorded_at) as newest_record
      FROM customer_locations
      WHERE recorded_at > NOW() - INTERVAL '${hoursBack} hours'
    `;

    try {
      const result = await pool.query(query);
      return result.rows[0];
    } catch (error) {
      console.error('Error fetching location statistics:', error.message);
      throw error;
    }
  }
}

module.exports = CustomerLocationModel;
